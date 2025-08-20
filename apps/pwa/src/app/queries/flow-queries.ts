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

        // Enhance each flow with data from dedicated tables and store in detail cache
        const enhancedFlows = await Promise.all(
          flows.map(async (flow) => {
            try {
              // Use enhanced getFlowWithNodes for each flow
              const enhancedFlowOrError = await FlowService.getFlowWithNodes.execute(flow.id);
              if (enhancedFlowOrError.isSuccess) {
                const enhancedFlow = enhancedFlowOrError.getValue();
                
                // Store enhanced flow in detail cache
                queryClient.setQueryData(
                  flowQueries.detail(flow.id).queryKey,
                  FlowDrizzleMapper.toPersistence(enhancedFlow),
                );
                
                return enhancedFlow;
              } else {
                console.warn(`Failed to enhance flow ${flow.id.toString()}, using basic data`);
                
                // Fallback to basic flow
                queryClient.setQueryData(
                  flowQueries.detail(flow.id).queryKey,
                  FlowDrizzleMapper.toPersistence(flow),
                );
                
                return flow;
              }
            } catch (error) {
              console.error(`Error enhancing flow ${flow.id.toString()}:`, error);
              return flow; // Fallback to basic flow
            }
          })
        );

        // Return persistence objects for caching
        return enhancedFlows.map((flow) => FlowDrizzleMapper.toPersistence(flow));
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
      queryKey: [...flowQueries.details(), id?.toString() ?? "", "enhanced-v1"],
      queryFn: async () => {
        if (!id) return null;
        
        // Check if enhanced method exists
        if (!FlowService.getFlowWithNodes) {
          const flowOrError = await FlowService.getFlow.execute(id);
          if (flowOrError.isFailure) {
            return null;
          }
          const flow = flowOrError.getValue();
          const persisted = FlowDrizzleMapper.toPersistence(flow);
          return persisted;
        }
        
        // Use enhanced getFlowWithNodes to properly load data from dedicated tables
        const flowOrError = await FlowService.getFlowWithNodes.execute(id);
        if (flowOrError.isFailure) {
          return null;
        }
        const flow = flowOrError.getValue();
        // Transform to persistence format for storage
        const persisted = FlowDrizzleMapper.toPersistence(flow);
        return persisted;
      },
      select: (data) => {
        
        if (!data) return null;
        
        // Transform back to domain object
        const domain = FlowDrizzleMapper.toDomain(data as any);
        
        
        return domain;
      },
      enabled: !!id,
      gcTime: 1000 * 60 * 5, // 5 minutes cache
      staleTime: 0, // Always consider stale - force refetch
    }),
};
