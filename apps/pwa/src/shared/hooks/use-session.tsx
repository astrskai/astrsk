import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { UniqueEntityID } from "@/shared/domain/unique-entity-id";

import { sessionQueries } from "@/entities/session/api";

export const useSession = (sessionId?: UniqueEntityID | null) => {
  const { data } = useQuery(sessionQueries.detail(sessionId || undefined));
  const queryClient = useQueryClient();

  const invalidateSession = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: sessionQueries.detail(sessionId || undefined).queryKey,
    });
  }, [queryClient, sessionId]);

  return [data, invalidateSession] as const;
};
