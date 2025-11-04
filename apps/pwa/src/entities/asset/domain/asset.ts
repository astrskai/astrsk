import { write, file } from "opfs-tools";

import { Result } from "@/shared/core/result";
import { AggregateRoot } from "@/shared/domain/aggregate-root";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { getFileHash } from "@/shared/lib";
import { formatFail } from "@/shared/lib/error-utils";

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
    // Check if file is a video
    const isVideo =
      file.type.startsWith("video/") ||
      file.name.toLowerCase().endsWith(".mp4") ||
      file.name.toLowerCase().endsWith(".webm") ||
      file.name.toLowerCase().endsWith(".ogg") ||
      file.name.toLowerCase().endsWith(".mov") ||
      file.name.toLowerCase().endsWith(".avi");

    // Only process image files, skip videos and other file types
    if (!file.type.startsWith("image/") || isVideo) {
      return resolve(file); // Return original file if not an image or if it's a video
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
          // Clean up image reference
          img.src = "";
          return reject(new Error("Could not get canvas context"));
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            // Clean up references after blob creation
            img.src = "";
            canvas.width = 0;
            canvas.height = 0;

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

      img.onerror = () => {
        // Clean up on error
        img.src = "";
        reject(new Error("Failed to load image"));
      };
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
      // Convert file to WebP format (only for images, videos are kept as-is)
      const webpFile = await convertToWebp(props.file);

      // Get hash
      const hash = await getFileHash(webpFile);

      // Save file to OPFS
      const filePath = `/assets/${hash}`;

      // Check if file already exists to avoid concurrent write errors
      try {
        const existingFile = await file(filePath).getOriginFile();
        if (existingFile) {
          // File already exists, skip write and create asset from existing file
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
        }
      } catch (checkError) {
        // File doesn't exist, proceed with write
      }

      // Write file to OPFS with retry logic
      let writeAttempts = 0;
      const maxAttempts = 3;

      while (writeAttempts < maxAttempts) {
        try {
          await write(filePath, webpFile.stream());
          break;
        } catch (writeError) {
          writeAttempts++;
          const errorMessage = writeError instanceof Error ? writeError.message : 'Unknown error';

          if (errorMessage.includes('Other writer have not been closed') && writeAttempts < maxAttempts) {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 500));
          } else {
            // Re-throw if it's a different error or max attempts reached
            throw writeError;
          }
        }
      }

      if (writeAttempts >= maxAttempts) {
        throw new Error(`Failed to write file after ${maxAttempts} attempts (writer still locked)`);
      }

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
