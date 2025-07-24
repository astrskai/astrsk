import { useQuery } from "@tanstack/react-query";

import { UniqueEntityID } from "@/shared/domain/unique-entity-id";

import { sessionQueries } from "@/app/queries/session-queries";

export const useSession = (sessionId?: UniqueEntityID | null) => {
  const { data } = useQuery(sessionQueries.detail(sessionId || undefined));

  const invalidateSession = () => {};

  return [data, invalidateSession] as const;
};
