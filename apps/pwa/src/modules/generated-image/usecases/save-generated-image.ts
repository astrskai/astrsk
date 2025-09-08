import { Result } from "@/shared/core";

import { GeneratedImage } from "../domain";
import { SaveGeneratedImageRepo } from "../repos/save-generated-image-repo";

export class SaveGeneratedImage {
  constructor(private saveGeneratedImageRepo: SaveGeneratedImageRepo) {}

  async execute(generatedImage: GeneratedImage): Promise<Result<void>> {
    try {
      const saveResult = await this.saveGeneratedImageRepo.save(generatedImage);
      
      if (saveResult.isFailure) {
        return Result.fail<void>(saveResult.getError());
      }

      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Failed to save generated image: ${error}`);
    }
  }
}