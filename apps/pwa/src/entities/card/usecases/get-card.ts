import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { Card } from "@/entities/card/domain";
import { LoadCardRepo } from "@/entities/card/repos";

export class GetCard implements UseCase<UniqueEntityID, Result<Card>> {
  constructor(private loadCardRepo: LoadCardRepo) {}

  async execute(cardId: UniqueEntityID): Promise<Result<Card>> {
    try {
      const cardResult = await this.loadCardRepo.getCardById(cardId);
      return cardResult;
    } catch (error) {
      return Result.fail<Card>(
        `Error fetching card: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
