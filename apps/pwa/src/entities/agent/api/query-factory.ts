/**
 * Agent Query Factory
 *
 * Based on TkDodo's query factory pattern and TanStack Query v5 best practices.
 * This factory provides:
 * - Centralized query key management
 * - Type-safe query options
 * - Hierarchical key structure for granular invalidation
 * - Co-location of keys and query functions
 */

import { queryOptions } from "@tanstack/react-query";
import { AgentService } from "@/app/services/agent-service";
import { UniqueEntityID } from "@/shared/domain";
import { AgentDrizzleMapper } from "@/entities/agent/mappers/agent-drizzle-mapper";
import { PromptDrizzleMapper } from "@/entities/agent/mappers/prompt-drizzle-mapper";
import { ParameterDrizzleMapper } from "@/entities/agent/mappers/parameter-drizzle-mapper";
import { OutputDrizzleMapper } from "@/entities/agent/mappers/output-drizzle-mapper";
import { queryClient } from "@/shared/api/query-client";
import { Agent } from "@/entities/agent/domain";

// WeakMap cache for preventing unnecessary re-renders
// Uses data object references as keys for automatic garbage collection
const selectResultCache = new WeakMap<object, any>();

/**
 * Query Key Factory
 *
 * Hierarchical structure:
 * - all: ['agents']
 * - lists: ['agents', 'list']
 * - list(filters): ['agents', 'list', { filters }]
 * - details: ['agents', 'detail']
 * - detail(id): ['agents', 'detail', id]
 *   - name: ['agents', 'detail', id, 'name']
 *   - metadata: ['agents', 'detail', id, 'metadata']
 *   - prompt: ['agents', 'detail', id, 'prompt']
 *   - output: ['agents', 'detail', id, 'output']
 *   - model: ['agents', 'detail', id, 'model']
 *   - parameters: ['agents', 'detail', id, 'parameters']
 *   - schema: ['agents', 'detail', id, 'schema']
 *   - schemaFields: ['agents', 'detail', id, 'schema', 'fields']
 *   - schemaField(fieldName): ['agents', 'detail', id, 'schema', 'fields', fieldName]
 */
export const agentKeys = {
  // Root key for all agent queries
  all: ["agents"] as const,

  // List queries
  lists: () => [...agentKeys.all, "list"] as const,
  list: (filters?: any) =>
    filters ? ([...agentKeys.lists(), filters] as const) : agentKeys.lists(),

  // Detail queries
  details: () => [...agentKeys.all, "detail"] as const,
  detail: (id: string) => [...agentKeys.details(), id] as const,

  // Sub-queries for a specific agent
  name: (id: string) => [...agentKeys.detail(id), "name"] as const,
  metadata: (id: string) => [...agentKeys.detail(id), "metadata"] as const,

  // Prompt-related queries
  prompt: (id: string) => [...agentKeys.detail(id), "prompt"] as const,
  promptMessages: (id: string) =>
    [...agentKeys.prompt(id), "messages"] as const,
  promptMessage: (id: string, messageId: string) =>
    [...agentKeys.promptMessages(id), messageId] as const,
  textPrompt: (id: string) => [...agentKeys.prompt(id), "text"] as const,

  // Output configuration
  output: (id: string) => [...agentKeys.detail(id), "output"] as const,
  outputFormat: (id: string) => [...agentKeys.output(id), "format"] as const,
  schema: (id: string) => [...agentKeys.output(id), "schema"] as const,
  schemaFields: (id: string) => [...agentKeys.schema(id), "fields"] as const,
  schemaField: (id: string, fieldName: string) =>
    [...agentKeys.schemaFields(id), fieldName] as const,

  // Model configuration
  model: (id: string) => [...agentKeys.detail(id), "model"] as const,
  apiType: (id: string) => [...agentKeys.model(id), "apiType"] as const,
  modelName: (id: string) => [...agentKeys.model(id), "name"] as const,

  // Parameters
  parameters: (id: string) => [...agentKeys.detail(id), "parameters"] as const,
  parameter: (id: string, paramName: string) =>
    [...agentKeys.parameters(id), paramName] as const,

  // Agent relationships
  flows: (id: string) => [...agentKeys.detail(id), "flows"] as const,
  sessions: (id: string) => [...agentKeys.detail(id), "sessions"] as const,
};

// Types for query data
export interface AgentMetadata {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export interface AgentListFilters {
  keyword?: string;
  limit?: number;
}

// Query Options Factory
export const agentQueries = {
  // List queries
  list: (filters: AgentListFilters = { limit: 100 }) =>
    queryOptions({
      queryKey: agentKeys.list(filters),
      queryFn: async () => {
        const agentsOrError = await AgentService.searchAgent.execute({
          keyword: filters.keyword || "",
          limit: filters.limit || 100,
        });
        if (agentsOrError.isFailure) return [];
        const agents = agentsOrError.getValue();

        // Store each agent in detail cache
        agents.forEach((agent) => {
          queryClient.setQueryData(
            agentKeys.detail(agent.id.toString()),
            AgentDrizzleMapper.toPersistence(agent),
          );
        });

        // Return persistence objects for caching
        return agents.map((agent) => AgentDrizzleMapper.toPersistence(agent));
      },
      select: (data): Agent[] => {
        if (!data || !Array.isArray(data)) return [];

        const cached = selectResultCache.get(data as object);
        if (cached) return cached;

        const result = data.map((agent) =>
          AgentDrizzleMapper.toDomain(agent as any),
        );
        
        selectResultCache.set(data as object, result);
        return result;
      },
      staleTime: 1000 * 10, // 10 seconds
      gcTime: 1000 * 60, // 1 minute
    }),

  // Full agent detail
  detail: (id: string | UniqueEntityID) =>
    queryOptions({
      queryKey: agentKeys.detail(typeof id === "string" ? id : id.toString()),
      queryFn: async () => {
        const uniqueId = typeof id === "string" ? new UniqueEntityID(id) : id;
        const result = await AgentService.getAgent.execute(uniqueId);
        if (result.isFailure) return null;
        const agent = result.getValue();
        // Transform to persistence format for storage
        return AgentDrizzleMapper.toPersistence(agent);
      },
      select: (data): Agent | null => {
        if (!data) return null;

        const cached = selectResultCache.get(data as object);
        if (cached) return cached;

        const result = AgentDrizzleMapper.toDomain(data as any);
        selectResultCache.set(data as object, result);
        return result;
      },
      staleTime: 1000 * 30, // 30 seconds
    }),

  // Agent name only
  name: (id?: string) =>
    queryOptions({
      queryKey: agentKeys.name(id ?? ""),
      queryFn: async () => {
        if (!id) return null;
        const result = await AgentService.getAgentName.execute({
          agentId: id,
        });
        if (result.isFailure) {
          return null;
        }
        return result.getValue(); // Return the full object with name property
      },
      enabled: !!id,
      staleTime: 1000 * 60, // 1 minute
    }),

  // Agent metadata
  metadata: (id: string) =>
    queryOptions({
      queryKey: agentKeys.metadata(id),
      queryFn: async () => {
        const result = await AgentService.getAgent.execute(
          new UniqueEntityID(id),
        );
        if (result.isFailure) return null;

        const agent = result.getValue();
        return {
          id: agent.id.toString(),
          name: agent.props.name,
          description: agent.props.description,
          color: agent.props.color,
        } as AgentMetadata;
      },
      staleTime: 1000 * 60, // 1 minute
    }),

  // Agent prompt
  prompt: (id?: string) =>
    queryOptions({
      queryKey: agentKeys.prompt(id ?? ""),
      queryFn: async () => {
        if (!id) return null;
        const result = await AgentService.getAgentPrompt.execute({
          agentId: id,
        });
        if (result.isFailure) return null;
        const value = result.getValue();

        // Transform to persistence format for caching
        return PromptDrizzleMapper.toPersistence(value);
      },
      select: (data): any => {
        if (!data) return null;

        const cached = selectResultCache.get(data as object);
        if (cached) return cached;

        const result = PromptDrizzleMapper.toDomain(data as any);
        selectResultCache.set(data as object, result);
        return result;
      },
      enabled: !!id,
      staleTime: 1000 * 30, // 30 seconds
    }),

  // Agent output configuration
  output: (id?: string) =>
    queryOptions({
      queryKey: agentKeys.output(id ?? ""),
      queryFn: async () => {
        if (!id) return null;
        const result = await AgentService.getAgentOutput.execute({
          agentId: id,
        });
        if (result.isFailure) return null;
        const value = result.getValue();

        // Transform to persistence format for caching
        return OutputDrizzleMapper.toPersistence(value);
      },
      select: (data): any => {
        if (!data) return null;

        const cached = selectResultCache.get(data as object);
        if (cached) return cached;

        const result = OutputDrizzleMapper.toDomain(data as any);
        selectResultCache.set(data as object, result);
        return result;
      },
      enabled: !!id,
      staleTime: 1000 * 30, // 30 seconds
    }),

  // Agent schema fields
  schemaFields: (id: string) =>
    queryOptions({
      queryKey: agentKeys.schemaFields(id),
      queryFn: async () => {
        const result = await AgentService.getAgent.execute(
          new UniqueEntityID(id),
        );
        if (result.isFailure) return [];

        return result.getValue().props.schemaFields || [];
      },
      staleTime: 1000 * 30, // 30 seconds
    }),

  // Agent model configuration
  model: (id: string) =>
    queryOptions({
      queryKey: agentKeys.model(id),
      queryFn: async () => {
        const result = await AgentService.getAgent.execute(
          new UniqueEntityID(id),
        );
        if (result.isFailure) return null;

        const agent = result.getValue();
        return {
          apiType: agent.props.targetApiType,
          modelName: agent.props.modelName,
          modelId: agent.props.modelId,
          apiSource: agent.props.apiSource,
          modelTier: agent.props.modelTier,
          useDefaultModel: agent.props.useDefaultModel,
        };
      },
      staleTime: 1000 * 60, // 1 minute
    }),

  // Agent parameters
  parameters: (id?: string) =>
    queryOptions({
      queryKey: agentKeys.parameters(id ?? ""),
      queryFn: async () => {
        if (!id) return null;
        const result = await AgentService.getAgentParameters.execute({
          agentId: id,
        });
        if (result.isFailure) return null;
        const value = result.getValue();

        // Transform to persistence format for caching
        return ParameterDrizzleMapper.toPersistence(value);
      },
      select: (data): any => {
        if (!data) return null;

        const cached = selectResultCache.get(data as object);
        if (cached) return cached;

        const result = ParameterDrizzleMapper.toDomain(data as any);
        selectResultCache.set(data as object, result);
        return result;
      },
      enabled: !!id,
      staleTime: 1000 * 60, // 1 minute
    }),
};

/**
 * Usage Examples:
 *
 * // Using query options
 * const { data: agent } = useQuery(agentQueries.detail(agentId));
 * const { data: name } = useQuery(agentQueries.name(agentId));
 * const { data: schema } = useQuery(agentQueries.schemaFields(agentId));
 *
 * // Invalidating queries
 * queryClient.invalidateQueries({ queryKey: agentKeys.all }); // All agent queries
 * queryClient.invalidateQueries({ queryKey: agentKeys.name(agentId) }); // Just name
 * queryClient.invalidateQueries({ queryKey: agentKeys.output(agentId) }); // Just output config
 *
 * // Prefetching
 * await queryClient.prefetchQuery(agentQueries.detail(agentId));
 *
 * // Setting query data
 * queryClient.setQueryData(agentKeys.name(agentId), newName);
 *
 * // Getting query data
 * const cachedAgent = queryClient.getQueryData<Agent>(agentKeys.detail(agentId));
 */

/**
 * Helper functions to fetch agents from cache and convert to domain objects
 * Note: queryClient.fetchQuery returns persistence objects, not domain objects
 * The select function only works in useQuery hooks, so we need to manually convert
 */

export async function fetchAgent(id: UniqueEntityID): Promise<Agent> {
  // Always fetch fresh data from DB (staleTime: 0 forces refetch)
  const data = await queryClient.fetchQuery({
    ...agentQueries.detail(id.toString()),
    staleTime: 0, // Force fresh fetch, don't use cached data
  });
  if (!data) {
    throw new Error(`Agent not found: ${id.toString()}`);
  }
  return AgentDrizzleMapper.toDomain(data as any);
}
