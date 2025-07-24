import { queryOptions } from "@tanstack/react-query";
import { UniqueEntityID } from "@/shared/domain";
import { FlowService } from "@/app/services/flow-service";
import { FlowDrizzleMapper } from "@/modules/flow/mappers/flow-drizzle-mapper";
import { queryClient } from "@/app/queries/query-client";

interface SearchFlowsParams {
  keyword?: string;
  limit?: number;
}

export const flowQueries = {
  all: () => ["flows"] as const,

  // List queries - not cached, stores data in detail cache
  lists: () => [...flowQueries.all(), "list"] as const,
  list: (params: SearchFlowsParams = { keyword: "", limit: 100 }) =>
    queryOptions({
      queryKey: [...flowQueries.lists(), params],
      queryFn: async () => {
        const result = await FlowService.searchFlow.execute({
          keyword: params.keyword,
          limit: params.limit!,
        });
        if (result.isFailure) {
          return [];
        }
        const flows = result.getValue();

        // Store each flow in detail cache
        flows.forEach((flow) => {
          queryClient.setQueryData(
            flowQueries.detail(flow.id).queryKey,
            FlowDrizzleMapper.toPersistence(flow),
          );
        });

        // Return persistence objects for caching
        return flows.map((flow) => FlowDrizzleMapper.toPersistence(flow));
      },
      select: (data) => {
        // Transform back to domain object
        return data.map((flow) => FlowDrizzleMapper.toDomain(flow as any));
      },
      gcTime: 1000 * 30, // 30 seconds cache
      staleTime: 1000 * 10, // 10 seconds stale time
    }),

  // Detail queries - cached for reuse
  details: () => [...flowQueries.all(), "detail"] as const,
  detail: (id?: UniqueEntityID) =>
    queryOptions({
      queryKey: [...flowQueries.details(), id?.toString() ?? ""],
      queryFn: async () => {
        if (!id) return null;
        // No network request if already cached from list query
        const flowOrError = await FlowService.getFlow.execute(id);
        if (flowOrError.isFailure) return null;
        const flow = flowOrError.getValue();
        // Transform to persistence format for storage
        return FlowDrizzleMapper.toPersistence(flow);
      },
      select: (data) => {
        if (!data) return null;
        // Transform back to domain object
        return FlowDrizzleMapper.toDomain(data as any);
      },
      enabled: !!id,
    }),
};
