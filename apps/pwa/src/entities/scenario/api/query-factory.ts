/**
 * Scenario Query Factory
 *
 * Scenario-specific query factory that wraps card queries
 * with proper type safety for PlotCard.
 */

import { queryOptions } from "@tanstack/react-query";
import { UniqueEntityID } from "@/shared/domain";
import { CardService } from "@/app/services/card-service";
import { CardDrizzleMapper } from "@/entities/card/mappers/card-drizzle-mapper";
import { PlotCard } from "@/entities/card/domain";
import { cardKeys } from "@/entities/card/api/query-factory";

// WeakMap cache for preventing unnecessary re-renders
const selectResultCache = new WeakMap<object, PlotCard>();

// Query Keys (reuse card keys for cache consistency)
export const scenarioKeys = {
  all: () => [...cardKeys.all, "scenario"] as const,
  details: () => [...scenarioKeys.all(), "detail"] as const,
  detail: (id: string) => cardKeys.detail(id), // Reuse card key for shared cache
};

// Query Options Factory
export const scenarioQueries = {
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
        if (!(card instanceof PlotCard)) {
          throw new Error(
            `Expected PlotCard but got ${card.constructor.name}`,
          );
        }

        // Transform to persistence format for consistent caching
        return CardDrizzleMapper.toPersistence(card);
      },
      select: (data): PlotCard | null => {
        if (!data) return null;

        // Check cache first
        const cached = selectResultCache.get(data as object);
        if (cached) return cached;

        // Convert to domain model
        const result = CardDrizzleMapper.toDomain(data as any);

        // Type guard after domain conversion
        if (!(result instanceof PlotCard)) {
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
 * // scenario is typed as PlotCard | null - no type guard needed!
 */
