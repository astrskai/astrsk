import { Result, UseCase } from "@/shared/core";
import { formatFail } from "@/shared/utils";

import { Card } from "@/modules/card/domain";
import { SaveCardRepo } from "@/modules/card/repos/save-card-repo";

export class SaveCard implements UseCase<Card, Result<Card>> {
  constructor(private saveCardRepo: SaveCardRepo) {}

  async execute(card: Card): Promise<Result<Card>> {
    try {
      const savedCardResult = await this.saveCardRepo.saveCard(card);
      return savedCardResult;
    } catch (error) {
      return formatFail("Failed to save card", error);
    }
  }
}
