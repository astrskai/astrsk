import { useQuery } from "@tanstack/react-query";

import { flowQueries } from "@/app/queries/flow-queries";

export const useFlows = ({ keyword }: { keyword?: string } = {}) => {
  const { data, isLoading, refetch } = useQuery(flowQueries.list({ keyword }));

  const invalidate = () => {};

  return {
    data: data ?? [],
    isLoading,
    invalidate,
    refetch,
  } as const;
};
