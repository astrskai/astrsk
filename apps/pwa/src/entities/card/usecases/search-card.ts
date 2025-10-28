import { Result, UseCase } from "@/shared/core";

import { Card } from "@/entities/card/domain";
import { LoadCardRepo, SearchCardsQuery } from "@/entities/card/repos";

export class SearchCard implements UseCase<SearchCardsQuery, Result<Card[]>> {
  constructor(private loadCardRepo: LoadCardRepo) {}

  async execute(query: SearchCardsQuery): Promise<Result<Card[]>> {
    try {
      const cardsResult = await this.loadCardRepo.searchCards(query);
      return cardsResult;
    } catch (error) {
      return Result.fail<Card[]>(
        `Failed to list cards: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
