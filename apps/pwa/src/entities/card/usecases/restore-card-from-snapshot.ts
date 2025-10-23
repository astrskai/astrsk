import { Result, UseCase } from "@/shared/core";
import { formatFail } from "@/shared/lib";

import { Card } from "@/entities/card/domain";
import { SaveCardRepo } from "@/entities/card/repos/save-card-repo";
import { CardDrizzleMapper } from "@/entities/card/mappers/card-drizzle-mapper";
import { SelectCard } from "@/db/schema/cards";

export class RestoreCardFromSnapshot implements UseCase<SelectCard, Result<Card>> {
  constructor(private saveCardRepo: SaveCardRepo) {}

  async execute(cardDbFormat: SelectCard): Promise<Result<Card>> {
    try {
      // Use CardDrizzleMapper to convert database format to domain object
      // This handles all the complex object reconstruction properly
      const card = CardDrizzleMapper.toDomain(cardDbFormat);

      // Use the existing save functionality to restore the card
      const restoredCardResult = await this.saveCardRepo.saveCard(card);
      return restoredCardResult;
    } catch (error) {
      return formatFail("Failed to restore card from snapshot", error);
    }
  }
}