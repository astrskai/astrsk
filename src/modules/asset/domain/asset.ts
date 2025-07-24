import { write } from "opfs-tools";

import { Result } from "@/shared/core/result";
import { AggregateRoot } from "@/shared/domain/aggregate-root";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { getFileHash } from "@/shared/utils";
import { formatFail } from "@/shared/utils/error-utils";

import { TableName } from "@/db/schema/table-name";

export type Ref = {
  table: TableName;
  id: UniqueEntityID;
};

export interface AssetProps {
  hash: string;
  name: string;
  sizeByte: number;
  mimeType: string;
  filePath: string;
  updatedAt: Date;
}

/**
 * Converts an image file to WebP format
 * @param file The image file to convert
 * @param quality Optional quality override of the WebP image (0-1)
 * @returns A Promise that resolves to a new File in WebP format
 */
async function convertToWebp(file: File, quality?: number): Promise<File> {
  return new Promise((resolve, reject) => {
    // Only process image files
    if (!file.type.startsWith("image/")) {
      return resolve(file); // Return original file if not an image
    }

    // Set quality based on file type if not explicitly provided
    if (quality === undefined) {
      if (file.type === "image/jpeg" || file.type === "image/jpg") {
        quality = 0.8;
      } else if (file.type === "image/png") {
        quality = 1.0;
      } else {
        quality = 0.8; // Default for other image formats
      }
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Could not get canvas context"));
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error("Failed to convert to WebP"));
            }

            const webpFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, "") + ".webp",
              { type: "image/webp" },
            );
            resolve(webpFile);
          },
          "image/webp",
          quality,
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = event.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export class Asset extends AggregateRoot<AssetProps> {
  get hash(): string {
    return this.props.hash;
  }

  get name(): string {
    return this.props.name;
  }

  get sizeByte(): number {
    return this.props.sizeByte;
  }

  get mimeType(): string {
    return this.props.mimeType;
  }

  get filePath(): string {
    return this.props.filePath;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public static create(props: AssetProps, id?: UniqueEntityID): Result<Asset> {
    try {
      const asset = new Asset(props, id);
      return Result.ok(asset);
    } catch (error) {
      return formatFail("Failed to create Asset", error);
    }
  }

  public static async createFromFile(
    props: {
      file: File;
    },
    id?: UniqueEntityID,
  ): Promise<Result<Asset>> {
    try {
      // Convert file to WebP format
      const webpFile = await convertToWebp(props.file);

      // Get hash
      const hash = await getFileHash(webpFile);

      // Save file to OPFS
      const filePath = `/assets/${hash}`;
      await write(filePath, webpFile.stream());

      // Create asset
      return Asset.create(
        {
          hash: hash,
          name: webpFile.name,
          sizeByte: webpFile.size,
          mimeType: webpFile.type,
          filePath: filePath,
          updatedAt: new Date(),
        },
        id,
      );
    } catch (error) {
      return formatFail("Failed to create Asset from WebFile", error);
    }
  }
}
