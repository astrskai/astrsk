import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { Transaction } from "@/db/transaction";
import { Card, CardType } from "@/entities/card/domain";

export const SearchCardsSort = {
  Latest: "latest",
  Oldest: "oldest",
  TitleAtoZ: "title-atoz",
  TitleZtoA: "title-ztoa",
  Default: "latest",
} as const;

export type SearchCardsSort =
  (typeof SearchCardsSort)[keyof typeof SearchCardsSort];

export type SearchCardsQuery = {
  // Pagination
  limit?: number;
  offset?: number;

  // Sort
  sort?: SearchCardsSort;

  // Search
  keyword?: string;
  type?: CardType[];
};

export interface LoadCardRepo {
  listCards(
    query: {
      cursor?: UniqueEntityID;
      pageSize?: number;
    },
    tx?: Transaction,
  ): Promise<Result<Card[]>>;
  getCardById(id: UniqueEntityID, tx?: Transaction): Promise<Result<Card>>;
  searchCards(
    query: SearchCardsQuery,
    tx?: Transaction,
  ): Promise<Result<Card[]>>;
}
