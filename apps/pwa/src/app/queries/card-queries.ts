import { queryOptions } from "@tanstack/react-query";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { CardService } from "@/app/services";
import { CardDrizzleMapper } from "@/modules/card/mappers/card-drizzle-mapper";
import { CardType } from "@/modules/card/domain";
import { SearchCardsSort } from "@/modules/card/repos";
import { queryClient } from "@/app/queries/query-client";

interface SearchCardsParams {
  keyword?: string;
  limit?: number;
  sort?: (typeof SearchCardsSort)[keyof typeof SearchCardsSort];
  type?: CardType[];
}

export const cardQueries = {
  all: () => ["cards"] as const,

  // List queries - not cached, stores data in detail cache
  lists: () => [...cardQueries.all(), "list"] as const,
  list: (
    params: SearchCardsParams = {
      keyword: "",
      limit: 100,
      sort: SearchCardsSort.Latest,
      type: [],
    },
  ) =>
    queryOptions({
      queryKey: [...cardQueries.lists(), params],
      queryFn: async () => {
        const result = await CardService.searchCard.execute({
          limit: params.limit!,
          keyword: params.keyword!,
          sort: params.sort!,
          type: params.type!,
        });
        if (result.isFailure) {
          return [];
        }
        const cards = result.getValue();

        // Store each card in detail cache
        cards.forEach((card) => {
          queryClient.setQueryData(
            cardQueries.detail(card.id).queryKey,
            CardDrizzleMapper.toPersistence(card),
          );
        });

        // Return persistence objects for caching
        return cards.map((card) => CardDrizzleMapper.toPersistence(card));
      },
      select: (data) => {
        // Transform back to domain object
        return data.map((card) => CardDrizzleMapper.toDomain(card as any));
      },
      gcTime: 1000 * 30, // 30 seconds cache
      staleTime: 1000 * 10, // 10 seconds stale time
    }),

  // Detail queries - cached for reuse
  details: () => [...cardQueries.all(), "detail"] as const,
  detail: <T>(id?: UniqueEntityID) =>
    queryOptions({
      queryKey: [...cardQueries.details(), id?.toString() ?? ""],
      queryFn: async () => {
        if (!id) return null;
        // No network request if already cached from list query
        const cardOrError = await CardService.getCard.execute(id);
        if (cardOrError.isFailure) return null;
        const card = cardOrError.getValue();
        // Transform to persistence format for storage
        return CardDrizzleMapper.toPersistence(card);
      },
      select: (data) => {
        if (!data) return null;
        // Transform back to domain object
        return CardDrizzleMapper.toDomain(data as any) as T;
      },
      enabled: !!id,
    }),
};
