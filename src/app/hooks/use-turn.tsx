import { useQuery } from "@tanstack/react-query";

import { UniqueEntityID } from "@/shared/domain";

import { turnQueries } from "@/app/queries/turn-queries";

export const useTurn = (turnId?: UniqueEntityID) => {
  const { data } = useQuery(turnQueries.detail(turnId));

  return [data] as const;
};
