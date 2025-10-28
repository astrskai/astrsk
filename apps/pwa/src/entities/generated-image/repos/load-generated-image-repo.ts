import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { GeneratedImage } from "../domain";

export interface LoadGeneratedImageRepo {
  getGeneratedImageById(id: UniqueEntityID): Promise<Result<GeneratedImage>>;
  listGeneratedImages(): Promise<Result<GeneratedImage[]>>;
  getGeneratedImagesByCardId(cardId: UniqueEntityID): Promise<Result<GeneratedImage[]>>;
}