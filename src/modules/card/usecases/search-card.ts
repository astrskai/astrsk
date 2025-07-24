import { Result, UseCase } from "@/shared/core";

import { Card } from "@/modules/card/domain";
import { LoadCardRepo, SearchCardsQuery } from "@/modules/card/repos";

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
