import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { SaveFileToAsset } from "@/modules/asset/usecases/save-file-to-asset";
import { GeneratedImage } from "../domain";
import { SaveGeneratedImage } from "./save-generated-image";

interface SaveFileToGeneratedImageRequest {
  file: File;
  prompt: string;
  style?: string;
  aspectRatio?: string;
  associatedCardId?: UniqueEntityID;
}

export class SaveFileToGeneratedImage {
  constructor(
    private saveFileToAsset: SaveFileToAsset,
    private saveGeneratedImage: SaveGeneratedImage,
  ) {}

  async execute(request: SaveFileToGeneratedImageRequest): Promise<Result<GeneratedImage>> {
    try {
      // Save file to asset
      const assetResult = await this.saveFileToAsset.execute({ file: request.file });
      if (assetResult.isFailure) {
        return Result.fail<GeneratedImage>(assetResult.getError());
      }

      const asset = assetResult.getValue();

      // Create generated image entity
      const generatedImageResult = GeneratedImage.create({
        name: request.file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
        assetId: asset.id,
        prompt: request.prompt,
        style: request.style,
        aspectRatio: request.aspectRatio,
        associatedCardId: request.associatedCardId,
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
      return Result.fail<GeneratedImage>(`Failed to save file to generated image: ${error}`);
    }
  }
}