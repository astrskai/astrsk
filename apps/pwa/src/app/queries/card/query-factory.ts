/**
 * Card Query Factory
 *
 * Based on TkDodo's query factory pattern and TanStack Query v5 best practices.
 * This factory provides:
 * - Centralized query key management
 * - Type-safe query options
 * - Hierarchical key structure for granular invalidation
 * - Co-location of keys and query functions
 */

import { queryOptions } from "@tanstack/react-query";
import { UniqueEntityID } from "@/shared/domain";
import { CardService } from "@/app/services/card-service";
import { CardDrizzleMapper } from "@/modules/card/mappers/card-drizzle-mapper";
import { LorebookDrizzleMapper } from "@/modules/card/mappers/lorebook-drizzle-mapper";
import { Card, CardType, CharacterCard, PlotCard } from "@/modules/card/domain";
import { SearchCardsSort } from "@/modules/card/repos";
import { queryClient } from "@/app/queries/query-client";

// WeakMap cache for preventing unnecessary re-renders
// Uses data object references as keys for automatic garbage collection
const selectResultCache = new WeakMap<object, any>();

/**
 * Query Key Factory
 *
 * Hierarchical structure:
 * - all: ['cards']
 * - lists: ['cards', 'list']
 * - list(filters): ['cards', 'list', { filters }]
 * - details: ['cards', 'detail']
 * - detail(id): ['cards', 'detail', id]
 *   - metadata: ['cards', 'detail', id, 'metadata']
 *   - content: ['cards', 'detail', id, 'content']
 *   - lorebook: ['cards', 'detail', id, 'lorebook']
 *     - entry(entryId): ['cards', 'detail', id, 'lorebook', 'entry', entryId]
 *   - scenarios: ['cards', 'detail', id, 'scenarios']
 *     - scenario(scenarioId): ['cards', 'detail', id, 'scenarios', scenarioId]
 *   - variables: ['cards', 'detail', id, 'variables']
 *     - variable(variableId): ['cards', 'detail', id, 'variables', variableId]
 */

// Types for query data
export interface CardListFilters {
  keyword?: string;
  limit?: number;
  sort?: (typeof SearchCardsSort)[keyof typeof SearchCardsSort];
  type?: CardType[];
}

// Query Key Factory
export const cardKeys = {
  all: ["cards"] as const,

  // List queries
  lists: () => [...cardKeys.all, "list"] as const,
  list: (filters?: CardListFilters) =>
    filters ? ([...cardKeys.lists(), filters] as const) : cardKeys.lists(),

  // Detail queries
  details: () => [...cardKeys.all, "detail"] as const,
  detail: (id: string) => [...cardKeys.details(), id] as const,

  // Sub-queries for a specific card
  imagePrompt: (id: string) => [...cardKeys.detail(id), "imagePrompt"] as const,

  // Lorebook queries
  lorebook: (id: string) => [...cardKeys.detail(id), "lorebook"] as const,

  // Scenarios queries (for plot cards)
  scenarios: (id: string) => [...cardKeys.detail(id), "scenarios"] as const,
  scenario: (id: string, scenarioId: string) =>
    [...cardKeys.scenarios(id), scenarioId] as const,
};

// Query Options Factory
export const cardQueries = {
  // List queries
  list: (filters: CardListFilters = {}) =>
    queryOptions({
      queryKey: cardKeys.list(filters),
      queryFn: async () => {
        const result = await CardService.searchCard.execute({
          keyword: filters.keyword || "",
          limit: filters.limit || 100,
          sort: filters.sort || SearchCardsSort.Latest,
          type: filters.type || [],
        });
        if (result.isFailure) return [];
        return result.getValue();
      },
      staleTime: 1000 * 10, // 10 seconds
      gcTime: 1000 * 60, // 1 minute
    }),

  // Full card detail
  detail: (id: string) =>
    queryOptions({
      queryKey: cardKeys.detail(id),
      queryFn: async () => {
        const cardOrError = await CardService.getCard.execute(
          new UniqueEntityID(id),
        );
        if (cardOrError.isFailure) return null;
        const card = cardOrError.getValue();
        // Transform to persistence format for consistent caching (like legacy system)
        return CardDrizzleMapper.toPersistence(card);
      },
      select: (data): Card | null => {
        if (!data) return null;

        const cached = selectResultCache.get(data as object);
        if (cached) return cached;

        const result = CardDrizzleMapper.toDomain(data as any);
        selectResultCache.set(data as object, result);
        return result;
      },
      staleTime: 1000 * 30, // 30 seconds
    }),

  // Image prompt
  imagePrompt: (id: string) =>
    queryOptions({
      queryKey: cardKeys.imagePrompt(id),
      queryFn: async () => {
        const cardOrError = await CardService.getCard.execute(
          new UniqueEntityID(id),
        );
        if (cardOrError.isFailure) return "";

        const card = cardOrError.getValue();
        return card.props.imagePrompt || "";
      },
      staleTime: 1000 * 5, // 5 seconds - shorter for prompt updates
      gcTime: 1000 * 30, // 30 seconds
    }),

  // Lorebook
  lorebook: (id: string) =>
    queryOptions({
      queryKey: cardKeys.lorebook(id),
      queryFn: async () => {
        const cardOrError = await CardService.getCard.execute(
          new UniqueEntityID(id),
        );
        if (cardOrError.isFailure) return null;

        const card = cardOrError.getValue();
        // Transform lorebook to persistence format for consistent caching
        return card.props.lorebook
          ? LorebookDrizzleMapper.toPersistence(card.props.lorebook)
          : null;
      },
      select: (data): any => {
        if (!data) return null;

        const cached = selectResultCache.get(data as object);
        if (cached) return cached;

        const result = LorebookDrizzleMapper.toDomain(data);
        selectResultCache.set(data as object, result);
        return result;
      },
      staleTime: 1000 * 30,
    }),

  // Scenarios (for plot cards)
  scenarios: (id: string) =>
    queryOptions({
      queryKey: cardKeys.scenarios(id),
      queryFn: async () => {
        const cardOrError = await CardService.getCard.execute(
          new UniqueEntityID(id),
        );
        if (cardOrError.isFailure) return [];

        const card = cardOrError.getValue();
        if (card instanceof PlotCard) {
          return card.props.scenarios || [];
        }
        return [];
      },
      select: (data): any[] => {
        if (!data) return [];

        const cached = selectResultCache.get(data as object);
        if (cached) return cached;

        // For scenarios, data is already in the right format, just cache it
        const result = data;
        selectResultCache.set(data as object, result);
        return result;
      },
      staleTime: 1000 * 30,
    }),

  // Single scenario
  scenario: (id: string, scenarioId: string) =>
    queryOptions({
      queryKey: cardKeys.scenario(id, scenarioId),
      queryFn: async () => {
        const cardOrError = await CardService.getCard.execute(
          new UniqueEntityID(id),
        );
        if (cardOrError.isFailure) return null;

        const card = cardOrError.getValue();
        if (card instanceof PlotCard) {
          return (
            card.props.scenarios?.find((s: any) => s.name === scenarioId) ||
            null
          );
        }
        return null;
      },
      staleTime: 1000 * 30,
    }),
};

/**
 * Usage Examples:
 *
 * // Using query options
 * const { data: card } = useQuery(cardQueries.detail(cardId));
 * const { data: metadata } = useQuery(cardQueries.metadata(cardId));
 * const { data: lorebook } = useQuery(cardQueries.lorebook(cardId));
 *
 * // Invalidating queries
 * queryClient.invalidateQueries({ queryKey: cardKeys.all }); // All card queries
 * queryClient.invalidateQueries({ queryKey: cardKeys.lorebook(cardId) }); // Just lorebook
 * queryClient.invalidateQueries({ queryKey: cardKeys.content(cardId) }); // Just content
 *
 * // Prefetching
 * await queryClient.prefetchQuery(cardQueries.detail(cardId));
 *
 * // Setting query data
 * queryClient.setQueryData(cardKeys.metadata(cardId), updatedMetadata);
 *
 * // Getting query data
 * const cachedCard = client.getQueryData<Card>(cardKeys.detail(cardId));
 */

/**
 * Helper functions to fetch cards from cache and convert to domain objects
 * Note: queryClient.fetchQuery returns persistence objects, not domain objects
 * The select function only works in useQuery hooks, so we need to manually convert
 */

export async function fetchCard(id: UniqueEntityID): Promise<Card> {
  const data = await queryClient.fetchQuery(cardQueries.detail(id.toString()));
  if (!data) {
    throw new Error(`Card not found: ${id.toString()}`);
  }
  return CardDrizzleMapper.toDomain(data as any);
}

export async function fetchPlotCard(id: UniqueEntityID): Promise<PlotCard> {
  const card = await fetchCard(id);
  if (!(card instanceof PlotCard)) {
    throw new Error(`Card is not a PlotCard: ${id.toString()}`);
  }
  return card;
}

export async function fetchPlotCardOptional(
  id: UniqueEntityID,
): Promise<PlotCard | null> {
  try {
    return await fetchPlotCard(id);
  } catch {
    return null;
  }
}

export async function fetchCharacterCard(
  id: UniqueEntityID,
): Promise<CharacterCard> {
  const card = await fetchCard(id);
  if (!(card instanceof CharacterCard)) {
    throw new Error(`Card is not a CharacterCard: ${id.toString()}`);
  }
  return card;
}

export async function fetchCharacterCardOptional(
  id: UniqueEntityID,
): Promise<CharacterCard | null> {
  try {
    return await fetchCharacterCard(id);
  } catch {
    return null;
  }
}
