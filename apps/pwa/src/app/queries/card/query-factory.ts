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

export interface CardMetadata {
  id: string;
  name: string;
  description: string;
  type: CardType;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CardContent {
  name: string;
  description: string;
  greeting?: string;
  systemPrompt?: string;
  exampleMessages?: Array<{
    user: string;
    assistant: string;
  }>;
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
  metadata: (id: string) => [...cardKeys.detail(id), "metadata"] as const,
  content: (id: string) => [...cardKeys.detail(id), "content"] as const,
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

  // Metadata only
  metadata: (id: string) =>
    queryOptions({
      queryKey: cardKeys.metadata(id),
      queryFn: async () => {
        const cardOrError = await CardService.getCard.execute(
          new UniqueEntityID(id),
        );
        if (cardOrError.isFailure) return null;

        const card = cardOrError.getValue();
        return {
          id: card.id.toString(),
          name: card.props.title,
          description: card.props.cardSummary || "",
          type: card.props.type,
          createdAt: card.props.createdAt,
          updatedAt: card.props.updatedAt,
        } as CardMetadata;
      },
      staleTime: 1000 * 60, // 1 minute
    }),

  // Content (name, description, greeting, etc.)
  content: (id: string) =>
    queryOptions({
      queryKey: cardKeys.content(id),
      queryFn: async () => {
        const cardOrError = await CardService.getCard.execute(
          new UniqueEntityID(id),
        );
        if (cardOrError.isFailure) return null;

        const card = cardOrError.getValue();
        const content: CardContent = {
          name: card.props.title,
          description: card.props.cardSummary || "",
        };

        if (card instanceof CharacterCard) {
          content.greeting = card.props.name;
          content.systemPrompt = card.props.description;
          content.exampleMessages = card.props.exampleDialogue
            ? [{ user: "Example", assistant: card.props.exampleDialogue }]
            : [];
        }

        return content;
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
