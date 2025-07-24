import { useQuery } from "@tanstack/react-query";

import { sessionQueries } from "@/app/queries/session-queries";
import { SearchSessionsQuery } from "@/modules/session/repos";

export const useSessions = (query: SearchSessionsQuery) => {
  const { data, isLoading } = useQuery(sessionQueries.list(query));

  return {
    data: data ?? [],
    isLoading,
  } as const;
};
