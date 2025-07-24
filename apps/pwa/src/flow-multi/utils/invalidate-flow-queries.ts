import { UniqueEntityID } from "@/shared/domain";
import { flowQueries } from "@/app/queries/flow-queries";
import { queryClient } from "@/app/queries/query-client";

/**
 * Invalidates all queries for a specific flow
 * This ensures that all components displaying this flow's data are refreshed
 * when any field of the flow is updated (model, agents, etc.)
 */
export async function invalidateSingleFlowQueries(
  flowId: UniqueEntityID | string
) {
  const flowIdString = typeof flowId === "string" ? flowId : flowId.toString();
  
  const invalidations = [
    // Invalidate specific flow detail - respects global staleTime
    queryClient.invalidateQueries({
      queryKey: flowQueries.detail(new UniqueEntityID(flowIdString)).queryKey,
      refetchType: 'inactive' // Only refetch inactive queries, respecting global staleTime
    }),

    // IMPORTANT: Also invalidate flow validation queries
    // The validation query has an additional "validation" key segment
    queryClient.invalidateQueries({
      queryKey: [...flowQueries.detail(new UniqueEntityID(flowIdString)).queryKey, "validation"],
      exact: true // Match exactly this query
    }),

    // Invalidate all flow lists regardless of params
    // This uses partial matching to invalidate any query that starts with ["flows", "list"]
    queryClient.invalidateQueries({
      queryKey: flowQueries.lists(),
      exact: false // This is key - it will match all queries that start with this key
    })
  ];
  
  // Wait for all invalidations to complete
  await Promise.all(invalidations);
  
}

/**
 * Invalidates all flow queries
 * Use this when multiple flows have been updated
 */
export async function invalidateAllFlowQueries() {
  await queryClient.invalidateQueries({
    queryKey: flowQueries.all(),
    exact: false // Match all queries that start with ["flows"]
  });
}