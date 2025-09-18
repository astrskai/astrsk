import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { SaveFileToAsset } from "@/modules/asset/usecases/save-file-to-asset";
import { GeneratedImage } from "../domain";
import { SaveGeneratedImage } from "./save-generated-image";
import { DrizzleGeneratedImageRepo } from "../repos/impl/drizzle-generated-image-repo";

interface SaveFileToGeneratedImageRequest {
  file: File;
  prompt: string;
  style?: string;
  aspectRatio?: string;
  associatedCardId?: UniqueEntityID;
  inputImageFile?: File; // For image-to-video, the original input image to use as thumbnail
  isSessionGenerated?: boolean; // True for images/videos generated in sessions
}

export class SaveFileToGeneratedImage {
  constructor(
    private saveFileToAsset: SaveFileToAsset,
    private saveGeneratedImage: SaveGeneratedImage,
    private generatedImageRepo?: DrizzleGeneratedImageRepo,
  ) {}

  /**
   * Extract first frame from video as thumbnail
   */
  private async extractVideoThumbnail(videoFile: File): Promise<File | null> {
    try {
      // Create a video element
      const video = document.createElement("video");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) return null;

      return new Promise((resolve) => {
        video.onloadedmetadata = () => {
          // Set canvas size to video dimensions (with max size limit for performance)
          const maxWidth = 800;
          const maxHeight = 800;
          let width = video.videoWidth;
          let height = video.videoHeight;

          // Scale down if needed while maintaining aspect ratio
          if (width > maxWidth || height > maxHeight) {
            const aspectRatio = width / height;
            if (width > height) {
              width = maxWidth;
              height = width / aspectRatio;
            } else {
              height = maxHeight;
              width = height * aspectRatio;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Seek to first frame
          video.currentTime = 0.1; // Small offset to ensure we get a frame
        };

        video.onseeked = () => {
          // Draw the current frame to canvas (scaled to fit)
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Convert canvas to blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const thumbnailFile = new File(
                  [blob],
                  `thumb-${videoFile.name.replace(/\.[^/.]+$/, "")}.jpg`,
                  { type: "image/jpeg" },
                );
                resolve(thumbnailFile);
              } else {
                resolve(null);
              }

              // Clean up video and canvas
              URL.revokeObjectURL(video.src);
              video.src = "";
              video.load();
              canvas.width = 0;
              canvas.height = 0;
            },
            "image/jpeg",
            0.9,
          ); // Higher quality for thumbnails
        };

        video.onerror = () => {
          resolve(null);
          URL.revokeObjectURL(video.src);
          video.src = "";
          canvas.width = 0;
          canvas.height = 0;
        };

        // Load video
        video.src = URL.createObjectURL(videoFile);
        video.load();
      });
    } catch (error) {
      console.error("Failed to extract video thumbnail:", error);
      return null;
    }
  }

  async execute(
    request: SaveFileToGeneratedImageRequest,
  ): Promise<Result<GeneratedImage>> {
    try {
      // Save file to asset
      const assetResult = await this.saveFileToAsset.execute({
        file: request.file,
      });
      if (assetResult.isFailure) {
        return Result.fail<GeneratedImage>(assetResult.getError());
      }

      const asset = assetResult.getValue();

      // Check if a generated image already exists for this asset
      if (this.generatedImageRepo) {
        const existingImageResult =
          await this.generatedImageRepo.getGeneratedImageByAssetId(asset.id);
        if (existingImageResult.isSuccess) {
          const existingImage = existingImageResult.getValue();
          if (existingImage) {
            // Return existing image instead of creating duplicate
            return Result.ok<GeneratedImage>(existingImage);
          }
        }
      }

      // Detect media type from file
      const isVideo =
        request.file.type.startsWith("video/") ||
        request.file.name.toLowerCase().endsWith(".mp4") ||
        request.file.name.toLowerCase().endsWith(".webm") ||
        request.file.name.toLowerCase().endsWith(".ogg") ||
        request.file.name.toLowerCase().endsWith(".mov") ||
        request.file.name.toLowerCase().endsWith(".avi");
      const mediaType = isVideo ? "video" : "image";

      // Extract and save thumbnail for videos
      let thumbnailAssetId: UniqueEntityID | undefined;
      if (isVideo) {
        // For image-to-video: use the input image as thumbnail
        // For text-to-video: extract thumbnail from the video
        if (request.inputImageFile) {
          // Image-to-video: save the original input image as thumbnail
          const thumbnailAssetResult = await this.saveFileToAsset.execute({
            file: request.inputImageFile,
          });
          if (thumbnailAssetResult.isSuccess) {
            thumbnailAssetId = thumbnailAssetResult.getValue().id;
          }
        } else {
          // Text-to-video: extract thumbnail from the generated video
          const thumbnailFile = await this.extractVideoThumbnail(request.file);
          if (thumbnailFile) {
            const thumbnailAssetResult = await this.saveFileToAsset.execute({
              file: thumbnailFile,
            });
            if (thumbnailAssetResult.isSuccess) {
              thumbnailAssetId = thumbnailAssetResult.getValue().id;
            }
          }
        }
      }

      const generatedImageResult = GeneratedImage.create({
        name: request.file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
        assetId: asset.id,
        prompt: request.prompt,
        style: request.style,
        aspectRatio: request.aspectRatio,
        mediaType: mediaType,
        thumbnailAssetId: thumbnailAssetId,
        associatedCardId: request.associatedCardId,
        isSessionGenerated: request.isSessionGenerated || false,
      });

      if (generatedImageResult.isFailure) {
        return Result.fail<GeneratedImage>(generatedImageResult.getError());
      }

      const generatedImage = generatedImageResult.getValue();

      // Save generated image
      const saveResult = await this.saveGeneratedImage.execute(generatedImage);
      if (saveResult.isFailure) {
        return Result.fail<GeneratedImage>(saveResult.getError());
      }

      return Result.ok<GeneratedImage>(generatedImage);
    } catch (error) {
      return Result.fail<GeneratedImage>(
        `Failed to save file to generated image: ${error}`,
      );
    }
  }
}
