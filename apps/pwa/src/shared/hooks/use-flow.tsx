import { useQuery } from "@tanstack/react-query";

import { UniqueEntityID } from "@/shared/domain";

import { flowQueries } from "@/app/queries/flow-queries";

export const useFlow = (flowId?: UniqueEntityID) => {
  const { data, isLoading } = useQuery(flowQueries.detail(flowId));

  return {
    data,
    isLoading,
  } as const;
};
