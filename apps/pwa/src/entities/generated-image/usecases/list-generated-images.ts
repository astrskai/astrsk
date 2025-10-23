import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { GeneratedImage } from "../domain";
import { LoadGeneratedImageRepo } from "../repos/load-generated-image-repo";

export class ListGeneratedImages {
  constructor(private loadGeneratedImageRepo: LoadGeneratedImageRepo) {}

  async execute(): Promise<Result<GeneratedImage[]>> {
    try {
      return await this.loadGeneratedImageRepo.listGeneratedImages();
    } catch (error) {
      return Result.fail<GeneratedImage[]>(`Failed to list generated images: ${error}`);
    }
  }

  async executeForCard(cardId: UniqueEntityID): Promise<Result<GeneratedImage[]>> {
    try {
      return await this.loadGeneratedImageRepo.getGeneratedImagesByCardId(cardId);
    } catch (error) {
      return Result.fail<GeneratedImage[]>(`Failed to list generated images for card: ${error}`);
    }
  }
}