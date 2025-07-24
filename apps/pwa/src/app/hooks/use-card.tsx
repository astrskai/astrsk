import { useQuery } from "@tanstack/react-query";

import { UniqueEntityID } from "@/shared/domain/unique-entity-id";

import { cardQueries } from "@/app/queries/card-queries";

export function useCard<T>(cardId?: UniqueEntityID | null) {
  const { data: card } = useQuery(
    cardQueries.detail<T>(cardId || undefined)
  );

  return [card] as const;
}
