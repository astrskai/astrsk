import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { GeneratedImage } from "../domain";
import { SaveGeneratedImage } from "./save-generated-image";

interface SaveGeneratedImageFromAssetRequest {
  assetId: UniqueEntityID;
  name: string;
  prompt: string;
  style?: string;
  aspectRatio?: string;
  associatedCardId?: UniqueEntityID;
}

export class SaveGeneratedImageFromAsset {
  constructor(private saveGeneratedImage: SaveGeneratedImage) {}

  async execute(request: SaveGeneratedImageFromAssetRequest): Promise<Result<GeneratedImage>> {
    try {
      // Create generated image entity referencing existing asset
      const generatedImageResult = GeneratedImage.create({
        name: request.name,
        assetId: request.assetId, // Reuse existing asset - no duplication
        prompt: request.prompt,
        style: request.style,
        aspectRatio: request.aspectRatio,
        associatedCardId: request.associatedCardId,
      });

      if (generatedImageResult.isFailure) {
        return Result.fail<GeneratedImage>(generatedImageResult.getError());
      }

      const generatedImage = generatedImageResult.getValue();

      // Save generated image record (asset already exists)
      const saveResult = await this.saveGeneratedImage.execute(generatedImage);
      if (saveResult.isFailure) {
        return Result.fail<GeneratedImage>(saveResult.getError());
      }

      return Result.ok<GeneratedImage>(generatedImage);
    } catch (error) {
      return Result.fail<GeneratedImage>(`Failed to save generated image from asset: ${error}`);
    }
  }
}