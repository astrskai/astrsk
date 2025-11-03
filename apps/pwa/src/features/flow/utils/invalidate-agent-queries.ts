import { UniqueEntityID } from "@/shared/domain";
import { agentKeys } from "@/entities/agent/api/query-factory";
import { queryClient } from "@/shared/api/query-client";

/**
 * Invalidates all queries for a specific agent
 * This ensures that all components displaying this agent's data are refreshed
 * when any field of the agent is updated (model, name, parameters, etc.)
 */
export async function invalidateSingleAgentQueries(
  agentId: UniqueEntityID | string
) {
  const agentIdString = typeof agentId === "string" ? agentId : agentId.toString();
  
  const invalidations = [
    // Invalidate specific agent detail
    queryClient.invalidateQueries({
      queryKey: agentKeys.detail(agentIdString)
    }),
    
    // Invalidate all agent lists regardless of params
    queryClient.invalidateQueries({
      queryKey: agentKeys.lists(),
      exact: false // Match all queries that start with ["agents", "list"]
    })
  ];
  
  // Wait for all invalidations to complete
  await Promise.all(invalidations);
  
}

/**
 * Invalidates all agent queries
 * Use this when multiple agents have been updated
 */
export async function invalidateAllAgentQueries() {
  await queryClient.invalidateQueries({
    queryKey: agentKeys.all,
    exact: false // Match all queries that start with ["agents"]
  });
}