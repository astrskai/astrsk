// TODO: If this file is ever needed in the production renderer, refactor to use browser APIs or IPC, not Node.js Buffer/require.
// WARNING: This file uses Node.js Buffer and require. Only safe if not bundled in production renderer. Refactor for browser/IPC if needed in renderer.

import { file } from "opfs-tools";

import { Asset } from "@/modules/asset/domain/asset";

import pngChunksEncode from "png-chunks-encode";
import pngChunksExtract from "png-chunks-extract";

interface PNGChunk {
  name: string;
  data: Buffer;
}

export class PNGMetadata {
  private static createMetadataChunk(type: string, data: string): Buffer {
    const typeBuffer = Buffer.from(type);
    const dataBuffer = Buffer.from(data);
    const length = dataBuffer.length;

    // Chunk structure: Length (4 bytes) + Type (4 bytes) + Data + CRC (4 bytes)
    const chunk = Buffer.alloc(4 + 4 + length + 4);

    // Write length (big-endian)
    chunk.writeUInt32BE(length, 0);

    // Write type
    typeBuffer.copy(chunk, 4);

    // Write data
    dataBuffer.copy(chunk, 8);

    // Calculate and write CRC
    const crc = this.calculateCRC32(Buffer.concat([typeBuffer, dataBuffer]));
    chunk.writeUInt32BE(crc >>> 0, chunk.length - 4);

    return chunk;
  }

  private static calculateCRC32(data: Buffer): number {
    let crc = -1;
    const table = new Int32Array(256);

    // Generate CRC table
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1;
      }
      table[i] = c;
    }

    // Calculate CRC
    for (let i = 0; i < data.length; i++) {
      crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
    }

    return ~crc;
  }
  private static async convertToPng(
    imageData: string,
    contentType: string,
  ): Promise<string> {
    if (typeof window === "undefined") {
      throw new Error(
        "Image conversion is only supported in browser environment",
      );
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png").split(",")[1]);
      };
      img.onerror = (e) => {
        reject(new Error("Failed to load image"));
      };
      const dataUrl = `data:${contentType};base64,${imageData}`;
      img.src = dataUrl;
    });
  }

  public static async bufferToBase64(buffer: Buffer): Promise<string> {
    const base64Url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(new Blob([new Uint8Array(buffer).buffer]));
    });
    return base64Url.slice(base64Url.indexOf(",") + 1);
  }

  public static async createPNGWithMetadata(
    iconAsset: Asset,
    metadata: any,
  ): Promise<Blob> {
    try {
      // Get asset file from OPFS
      const iconAssetData = await file(iconAsset.filePath).arrayBuffer();
      if (!iconAssetData) {
        throw new Error("Failed to get origin file");
      }
      const imageDataBuffer = Buffer.from(iconAssetData);
      let imageData = await this.bufferToBase64(imageDataBuffer);

      // If it's already a PNG, we can use it directly
      if (iconAsset.mimeType === "image/png") {
        // Verify PNG header
        const buffer = imageDataBuffer;
        if (
          buffer.length >= 8 &&
          buffer.toString("hex", 0, 8) === "89504e470d0a1a0a"
        ) {
          console.log("Valid PNG detected, using directly");
        } else {
          console.log("Invalid PNG header, attempting conversion");
          imageData = await this.convertToPng(imageData, iconAsset.mimeType);
        }
      } else {
        console.log("Non-PNG format, converting to PNG");
        imageData = await this.convertToPng(imageData, iconAsset.mimeType);
      }

      const imageBuffer = Buffer.from(imageData, "base64");
      // if (imageBuffer.length < 8 || imageBuffer.toString('hex', 0, 8) !== '89504e470d0a1a0a') {
      //   throw new Error('PNG conversion failed. Please check the input image.');
      // }

      // Remove existing metadata chunks if they exist
      const chunks = pngChunksExtract(imageBuffer) as PNGChunk[];
      const filteredChunks = chunks.filter(
        (chunk: PNGChunk) =>
          chunk.name !== "tEXt" ||
          (chunk.data.toString().indexOf("chara\0") !== 0 &&
            chunk.data.toString().indexOf("ccv3\0") !== 0),
      );
      const cleanImageBuffer = Buffer.from(pngChunksEncode(filteredChunks));
      const rawMetadata = JSON.stringify(metadata);
      // Create base64 encoded metadata
      const base64EncodedData = Buffer.from(
        JSON.stringify(metadata),
        "utf8",
      ).toString("base64");
      const v2MetadataChunk = this.createMetadataChunk(
        "tEXt",
        `chara\0${base64EncodedData}`,
      );
      const totalSize =
        cleanImageBuffer.length - 12 + v2MetadataChunk.length + 12;

      const newBuffer = Buffer.concat(
        [
          cleanImageBuffer.subarray(0, cleanImageBuffer.length - 12),
          v2MetadataChunk,
          cleanImageBuffer.subarray(cleanImageBuffer.length - 12),
        ],
        totalSize,
      );

      // Insert metadata chunk before IEND chunk (last 12 bytes of PNG)
      return new Blob([new Uint8Array(newBuffer).buffer], {
        type: "image/png",
      });
    } catch (error) {
      console.error("Error creating PNG with metadata:", error);
      throw error;
    }
  }

  public static extractMetadataFromImage(
    buffer: Buffer,
  ): { metadata: any; version: "v2" | "v3" } | null {
    try {
      const chunks = pngChunksExtract(buffer) as PNGChunk[];

      // Look for metadata in tEXt chunks
      const metadataChunks = chunks.filter((chunk: PNGChunk) => {
        const chunkText = Buffer.from(chunk.data).toString();
        return (
          chunk.name === "tEXt" &&
          (chunkText.startsWith("chara\0") || chunkText.startsWith("ccv3\0"))
        );
      });

      if (metadataChunks.length === 0) {
        return null;
      }

      // Prefer ccv3 chunk if available, otherwise use chara chunk
      const metadataChunk =
        metadataChunks.find((chunk: PNGChunk) =>
          Buffer.from(chunk.data).toString().startsWith("ccv3\0"),
        ) || metadataChunks[0];

      const chunkText = Buffer.from(metadataChunk.data).toString();
      const base64Data = chunkText.split("\0")[1];
      const decodedData = Buffer.from(base64Data, "base64").toString("utf8");
      const metadata = JSON.parse(decodedData);

      return {
        metadata,
        version: chunkText.startsWith("ccv3\0") ? "v3" : "v2",
      };
    } catch (error) {
      return null;
    }
  }
}
