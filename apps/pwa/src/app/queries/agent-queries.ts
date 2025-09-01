import { queryOptions } from "@tanstack/react-query";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { AgentService } from "@/app/services/agent-service";
import { AgentDrizzleMapper } from "@/modules/agent/mappers/agent-drizzle-mapper";
import { SearchAgentQuery } from "@/modules/agent/repos";
import { queryClient } from "@/app/queries/query-client";

// Select result cache for preventing unnecessary re-renders
// Maps query key to [persistenceData, transformedResult] tuple
const selectResultCache = new Map<string, [any, any]>();

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
        if (!data || !Array.isArray(data)) return [];
        
        const queryKey = [...agentQueries.lists(), query];
        const cacheKey = JSON.stringify(queryKey);
        
        const cached = selectResultCache.get(cacheKey);
        if (cached) {
          const [cachedData, cachedResult] = cached;
          if (JSON.stringify(cachedData) === JSON.stringify(data)) {
            return cachedResult;
          }
        }
        
        // Transform new data
        const result = data.map((agent) => AgentDrizzleMapper.toDomain(agent as any));
        
        // Cache both persistence data and transformed result
        selectResultCache.set(cacheKey, [data, result]);
        
        return result;
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
        
        const queryKey = [...agentQueries.details(), id?.toString() ?? ""];
        const cacheKey = JSON.stringify(queryKey);
        
        const cached = selectResultCache.get(cacheKey);
        if (cached) {
          const [cachedData, cachedResult] = cached;
          if (JSON.stringify(cachedData) === JSON.stringify(data)) {
            return cachedResult;
          }
        }
        
        // Transform new data
        const result = AgentDrizzleMapper.toDomain(data as any);
        
        // Cache both persistence data and transformed result
        selectResultCache.set(cacheKey, [data, result]);
        
        return result;
      },
      enabled: !!id,
    }),

  // Parameters query - only fetches parameter fields
  parameters: (id?: string) =>
    queryOptions({
      queryKey: [...agentQueries.all(), "detail", id ?? "", "parameters"],
      queryFn: async () => {
        if (!id) {
          return null;
        }
        const result = await AgentService.getAgentParameters.execute({ agentId: id });
        if (result.isFailure) {
          return null;
        }
        const value = result.getValue();
        
        // Convert Maps to serializable format for caching
        return {
          enabledParameters: Array.from(value.enabledParameters.entries()),
          parameterValues: Array.from(value.parameterValues.entries())
        };
      },
      select: (data) => {
        if (!data) return null;
        // Convert back to Maps when selecting from cache
        return {
          enabledParameters: new Map(data.enabledParameters),
          parameterValues: new Map(data.parameterValues)
        };
      },
      gcTime: 5 * 60 * 1000, // 5 minutes cache
      staleTime: 30 * 1000, // 30 seconds stale time
      enabled: !!id,
    }),

  // Output query - only fetches output-related fields
  output: (id?: string) =>
    queryOptions({
      queryKey: [...agentQueries.all(), "detail", id ?? "", "output"],
      queryFn: async () => {
        if (!id) {
          return null;
        }
        const result = await AgentService.getAgentOutput.execute({ agentId: id });
        if (result.isFailure) {
          return null;
        }
        return result.getValue();
      },
      gcTime: 5 * 60 * 1000, // 5 minutes cache
      staleTime: 30 * 1000, // 30 seconds stale time
      enabled: !!id,
    }),

  // Prompt query - only fetches prompt-related fields
  prompt: (id?: string) =>
    queryOptions({
      queryKey: [...agentQueries.all(), "detail", id ?? "", "prompt"],
      queryFn: async () => {
        if (!id) {
          return null;
        }
        const result = await AgentService.getAgentPrompt.execute({ agentId: id });
        if (result.isFailure) {
          return null;
        }
        return result.getValue();
      },
      gcTime: 5 * 60 * 1000, // 5 minutes cache
      staleTime: 30 * 1000, // 30 seconds stale time
      enabled: !!id,
    }),

  // Name query - only fetches agent name
  name: (id?: string) =>
    queryOptions({
      queryKey: [...agentQueries.all(), "detail", id ?? "", "name"],
      queryFn: async () => {
        if (!id) {
          return null;
        }
        const result = await AgentService.getAgentName.execute({ agentId: id });
        if (result.isFailure) {
          return null;
        }
        return result.getValue();
      },
      gcTime: 5 * 60 * 1000, // 5 minutes cache
      staleTime: 30 * 1000, // 30 seconds stale time
      enabled: !!id,
    }),

  // Model query - only fetches model-related fields
  model: (id?: string) =>
    queryOptions({
      queryKey: [...agentQueries.all(), "detail", id ?? "", "model"],
      queryFn: async () => {
        if (!id) {
          return null;
        }
        const result = await AgentService.getAgentModel.execute({ agentId: id });
        if (result.isFailure) {
          return null;
        }
        return result.getValue();
      },
      gcTime: 5 * 60 * 1000, // 5 minutes cache
      staleTime: 30 * 1000, // 30 seconds stale time
      enabled: !!id,
    }),
};
