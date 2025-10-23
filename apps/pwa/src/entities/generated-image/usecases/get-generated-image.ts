import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { GeneratedImage } from "../domain";
import { LoadGeneratedImageRepo } from "../repos/load-generated-image-repo";

export class GetGeneratedImage {
  constructor(private loadGeneratedImageRepo: LoadGeneratedImageRepo) {}

  async execute(id: UniqueEntityID): Promise<Result<GeneratedImage>> {
    try {
      return await this.loadGeneratedImageRepo.getGeneratedImageById(id);
    } catch (error) {
      return Result.fail<GeneratedImage>(`Failed to get generated image: ${error}`);
    }
  }
}