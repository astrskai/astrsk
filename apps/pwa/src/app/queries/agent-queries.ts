import { queryOptions } from "@tanstack/react-query";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { AgentService } from "@/app/services/agent-service";
import { AgentDrizzleMapper } from "@/modules/agent/mappers/agent-drizzle-mapper";
import { SearchAgentQuery } from "@/modules/agent/repos";
import { queryClient } from "@/app/queries/query-client";

export const agentQueries = {
  all: () => ["agents"] as const,

  // List queries - not cached, stores data in detail cache
  lists: () => [...agentQueries.all(), "list"] as const,
  list: (query: SearchAgentQuery = { limit: 100 }) =>
    queryOptions({
      queryKey: [...agentQueries.lists(), query],
      queryFn: async () => {
        const agentsOrError = await AgentService.searchAgent.execute(query);
        if (agentsOrError.isFailure) {
          return [];
        }
        const agents = agentsOrError.getValue();

        // Store each agent in detail cache
        agents.forEach((agent) => {
          queryClient.setQueryData(
            agentQueries.detail(agent.id).queryKey,
            AgentDrizzleMapper.toPersistence(agent),
          );
        });

        // Return persistence objects for caching
        return agents.map((agent) => AgentDrizzleMapper.toPersistence(agent));
      },
      select: (data) => {
        // Transform back to domain object
        return data.map((agent) => AgentDrizzleMapper.toDomain(agent as any));
      },
      gcTime: 1000 * 30, // 30 seconds cache
      staleTime: 1000 * 10, // 10 seconds stale time
    }),

  // Detail queries - cached for reuse
  details: () => [...agentQueries.all(), "detail"] as const,
  detail: (id?: UniqueEntityID) =>
    queryOptions({
      queryKey: [...agentQueries.details(), id?.toString() ?? ""],
      queryFn: async () => {
        if (!id) return null;
        // No network request if already cached from list query
        const agentOrError = await AgentService.getAgent.execute(id);
        if (agentOrError.isFailure) return null;
        const agent = agentOrError.getValue();
        // Transform to persistence format for storage
        return AgentDrizzleMapper.toPersistence(agent);
      },
      select: (data) => {
        if (!data) return null;
        // Transform back to domain object
        return AgentDrizzleMapper.toDomain(data as any);
      },
      enabled: !!id,
    }),
};
