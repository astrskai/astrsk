import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { Transaction } from "@/db/transaction";
import { Card, CardType, CharacterCard, ScenarioCard } from "@/entities/card/domain";
import { SortOptionValue } from "@/shared/config/sort-options";

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
  sort?: SortOptionValue;

  // Search
  keyword?: string;
  type?: CardType[];
};

// Optimized query for specific card types (no unnecessary JOINs)
export type SearchCharactersQuery = Omit<SearchCardsQuery, "type">;
export type SearchScenariosQuery = Omit<SearchCardsQuery, "type">;

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
  // Optimized methods for specific card types (single JOIN, type-specific keyword search)
  searchCharacters(
    query: SearchCharactersQuery,
    tx?: Transaction,
  ): Promise<Result<CharacterCard[]>>;
  searchScenarios(
    query: SearchScenariosQuery,
    tx?: Transaction,
  ): Promise<Result<ScenarioCard[]>>;
}
