/**
 * Scenario Query Factory
 *
 * Scenario-specific query factory that wraps card queries
 * with proper type safety for ScenarioCard.
 */

import { queryOptions } from "@tanstack/react-query";
import { UniqueEntityID } from "@/shared/domain";
import { CardService } from "@/app/services/card-service";
import { CardDrizzleMapper } from "@/entities/card/mappers/card-drizzle-mapper";
import { ScenarioCard } from "@/entities/card/domain";
import { cardKeys } from "@/entities/card/api/query-factory";
import {
  type SortOptionValue,
  DEFAULT_SORT_VALUE,
} from "@/shared/config/sort-options";

// WeakMap cache for preventing unnecessary re-renders
const selectResultCache = new WeakMap<object, ScenarioCard>();

// Scenario-specific filter type (without type field since it's always Scenario)
export interface ScenarioListFilters {
  keyword?: string;
  limit?: number;
  sort?: SortOptionValue;
}

// Query Keys (reuse card keys for cache consistency)
export const scenarioKeys = {
  all: () => [...cardKeys.all, "scenario"] as const,
  lists: () => [...scenarioKeys.all(), "list"] as const,
  list: (filters?: ScenarioListFilters) =>
    filters ? ([...scenarioKeys.lists(), filters] as const) : scenarioKeys.lists(),
  details: () => [...scenarioKeys.all(), "detail"] as const,
  detail: (id: string) => cardKeys.detail(id), // Reuse card key for shared cache
};

// Query Options Factory
export const scenarioQueries = {
  /**
   * Optimized scenario list query
   * - Uses dedicated searchScenarios (single query to scenarios table)
   * - Searches only scenario-specific fields for keywords
   * - No unnecessary characters table JOIN
   */
  list: (filters: ScenarioListFilters = {}) =>
    queryOptions({
      queryKey: scenarioKeys.list(filters),
      queryFn: async (): Promise<ScenarioCard[]> => {
        const result = await CardService.searchScenarios.execute({
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

  // Scenario detail with type safety
  detail: (id: string) =>
    queryOptions({
      queryKey: scenarioKeys.detail(id),
      queryFn: async () => {
        const cardOrError = await CardService.getCard.execute(
          new UniqueEntityID(id),
        );
        if (cardOrError.isFailure) {
          throw new Error("Scenario not found");
        }

        const card = cardOrError.getValue();

        // Type guard at query level
        if (!(card instanceof ScenarioCard)) {
          throw new Error(
            `Expected ScenarioCard but got ${card.constructor.name}`,
          );
        }

        // Transform to persistence format for consistent caching
        return CardDrizzleMapper.toPersistence(card);
      },
      select: (data): ScenarioCard | null => {
        if (!data) return null;

        // Check cache first
        const cached = selectResultCache.get(data as object);
        if (cached) return cached;

        // Convert to domain model
        const result = CardDrizzleMapper.toDomain(data as any);

        // Type guard after domain conversion
        if (!(result instanceof ScenarioCard)) {
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
 * const { data: scenario } = useQuery(scenarioQueries.detail(scenarioId));
 * // scenario is typed as ScenarioCard | null - no type guard needed!
 */
