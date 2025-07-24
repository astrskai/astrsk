import { UniqueEntityID } from "@/shared/domain";
import { agentQueries } from "@/app/queries/agent-queries";
import { queryClient } from "@/app/queries/query-client";

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
      queryKey: agentQueries.detail(new UniqueEntityID(agentIdString)).queryKey
    }),
    
    // Invalidate all agent lists regardless of params
    queryClient.invalidateQueries({
      queryKey: agentQueries.lists(),
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
    queryKey: agentQueries.all(),
    exact: false // Match all queries that start with ["agents"]
  });
}