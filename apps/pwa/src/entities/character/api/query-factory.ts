/**
 * Character Query Factory
 *
 * Character-specific query factory that wraps card queries
 * with proper type safety for CharacterCard.
 */

import { queryOptions } from "@tanstack/react-query";
import { UniqueEntityID } from "@/shared/domain";
import { CardService } from "@/app/services/card-service";
import { CardDrizzleMapper } from "@/entities/card/mappers/card-drizzle-mapper";
import { CharacterCard } from "@/entities/card/domain";
import { cardKeys } from "@/entities/card/api/query-factory";
import {
  type SortOptionValue,
  DEFAULT_SORT_VALUE,
} from "@/shared/config/sort-options";

// WeakMap cache for preventing unnecessary re-renders (detail query)
const selectResultCache = new WeakMap<object, CharacterCard>();

// Character-specific filter type (without type field since it's always Character)
export interface CharacterListFilters {
  keyword?: string;
  limit?: number;
  sort?: SortOptionValue;
}

// Query Keys (reuse card keys for cache consistency)
export const characterKeys = {
  all: () => [...cardKeys.all, "character"] as const,
  lists: () => [...characterKeys.all(), "list"] as const,
  list: (filters?: CharacterListFilters) =>
    filters ? ([...characterKeys.lists(), filters] as const) : characterKeys.lists(),
  details: () => [...characterKeys.all(), "detail"] as const,
  detail: (id: string) => cardKeys.detail(id), // Reuse card key for shared cache
};

// Query Options Factory
export const characterQueries = {
  /**
   * Optimized character list query
   * - Uses dedicated searchCharacters (single JOIN to characterCards only)
   * - Searches only character-specific fields for keywords
   * - No unnecessary plotCards JOIN
   */
  list: (filters: CharacterListFilters = {}) =>
    queryOptions({
      queryKey: characterKeys.list(filters),
      queryFn: async (): Promise<CharacterCard[]> => {
        const result = await CardService.searchCharacters.execute({
          keyword: filters.keyword || "",
          limit: filters.limit || 100,
          sort: filters.sort || DEFAULT_SORT_VALUE,
        });
        if (result.isFailure) return [];
        return result.getValue();
      },
      staleTime: 1000 * 10, // 10 seconds
      gcTime: 1000 * 60, // 1 minute
    }),

  // Character detail with type safety
  detail: (id: string) =>
    queryOptions({
      queryKey: characterKeys.detail(id),
      queryFn: async () => {
        const cardOrError = await CardService.getCard.execute(
          new UniqueEntityID(id),
        );
        if (cardOrError.isFailure) {
          throw new Error("Character not found");
        }

        const card = cardOrError.getValue();

        // Type guard at query level
        if (!(card instanceof CharacterCard)) {
          throw new Error(
            `Expected CharacterCard but got ${card.constructor.name}`,
          );
        }

        // Transform to persistence format for consistent caching
        return CardDrizzleMapper.toPersistence(card);
      },
      select: (data): CharacterCard | null => {
        if (!data) return null;

        // Check cache first
        const cached = selectResultCache.get(data as object);
        if (cached) return cached;

        // Convert to domain model
        const result = CardDrizzleMapper.toDomain(data as any);

        // Type guard after domain conversion
        if (!(result instanceof CharacterCard)) {
          return null;
        }

        // Cache and return
        selectResultCache.set(data as object, result);
        return result;
      },
      staleTime: 1000 * 30, // 30 seconds
    }),
};

/**
 * Usage:
 *
 * const { data: character } = useQuery(characterQueries.detail(characterId));
 * // character is typed as CharacterCard | null - no type guard needed!
 */
