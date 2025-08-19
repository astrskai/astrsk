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
import { Agent } from "@/modules/agent/domain/agent";

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
  all: ['agents'] as const,
  
  // List queries
  lists: () => [...agentKeys.all, 'list'] as const,
  list: (filters?: any) => 
    filters 
      ? [...agentKeys.lists(), filters] as const
      : agentKeys.lists(),
  
  // Detail queries
  details: () => [...agentKeys.all, 'detail'] as const,
  detail: (id: string) => [...agentKeys.details(), id] as const,
  
  // Sub-queries for a specific agent
  name: (id: string) => [...agentKeys.detail(id), 'name'] as const,
  metadata: (id: string) => [...agentKeys.detail(id), 'metadata'] as const,
  
  // Prompt-related queries
  prompt: (id: string) => [...agentKeys.detail(id), 'prompt'] as const,
  promptMessages: (id: string) => [...agentKeys.prompt(id), 'messages'] as const,
  promptMessage: (id: string, messageId: string) => [...agentKeys.promptMessages(id), messageId] as const,
  textPrompt: (id: string) => [...agentKeys.prompt(id), 'text'] as const,
  
  // Output configuration
  output: (id: string) => [...agentKeys.detail(id), 'output'] as const,
  outputFormat: (id: string) => [...agentKeys.output(id), 'format'] as const,
  schema: (id: string) => [...agentKeys.output(id), 'schema'] as const,
  schemaFields: (id: string) => [...agentKeys.schema(id), 'fields'] as const,
  schemaField: (id: string, fieldName: string) => [...agentKeys.schemaFields(id), fieldName] as const,
  
  // Model configuration
  model: (id: string) => [...agentKeys.detail(id), 'model'] as const,
  apiType: (id: string) => [...agentKeys.model(id), 'apiType'] as const,
  modelName: (id: string) => [...agentKeys.model(id), 'name'] as const,
  
  // Parameters
  parameters: (id: string) => [...agentKeys.detail(id), 'parameters'] as const,
  parameter: (id: string, paramName: string) => [...agentKeys.parameters(id), paramName] as const,
  
  // Agent relationships
  flows: (id: string) => [...agentKeys.detail(id), 'flows'] as const,
  sessions: (id: string) => [...agentKeys.detail(id), 'sessions'] as const,
};

// Types for query data
export interface AgentMetadata {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: Date;
  updatedAt?: Date;
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
        const result = await AgentService.searchAgent.execute({
          keyword: filters.keyword || "",
          limit: filters.limit || 100,
        });
        if (result.isFailure) return [];
        return result.getValue();
      },
      staleTime: 1000 * 10, // 10 seconds
      gcTime: 1000 * 60, // 1 minute
    }),

  // Full agent detail
  detail: (id: string) =>
    queryOptions({
      queryKey: agentKeys.detail(id),
      queryFn: async () => {
        const result = await AgentService.getAgent.execute(
          new UniqueEntityID(id)
        );
        if (result.isFailure) return null;
        return result.getValue();
      },
      staleTime: 1000 * 30, // 30 seconds
    }),

  // Agent name only
  name: (id: string) =>
    queryOptions({
      queryKey: agentKeys.name(id),
      queryFn: async () => {
        const result = await AgentService.getAgentName.execute({ 
          agentId: id 
        });
        if (result.isFailure) {
          return null;
        }
        const nameData = result.getValue();
        const name = nameData.name; // Extract the name string from the object
        return name;
      },
      staleTime: 1000 * 60, // 1 minute
    }),

  // Agent metadata
  metadata: (id: string) =>
    queryOptions({
      queryKey: agentKeys.metadata(id),
      queryFn: async () => {
        const result = await AgentService.getAgent.execute(
          new UniqueEntityID(id)
        );
        if (result.isFailure) return null;
        
        const agent = result.getValue();
        return {
          id: agent.id.toString(),
          name: agent.props.name,
          description: agent.props.description,
          color: agent.props.color,
          createdAt: agent.props.createdAt,
          updatedAt: agent.props.updatedAt,
        } as AgentMetadata;
      },
      staleTime: 1000 * 60, // 1 minute
    }),

  // Agent prompt
  prompt: (id: string) =>
    queryOptions({
      queryKey: agentKeys.prompt(id),
      queryFn: async () => {
        const result = await AgentService.getAgent.execute(
          new UniqueEntityID(id)
        );
        if (result.isFailure) return null;
        
        const agent = result.getValue();
        return {
          promptMessages: agent.props.promptMessages,
          textPrompt: agent.props.textPrompt,
        };
      },
      staleTime: 1000 * 30, // 30 seconds
    }),

  // Agent output configuration
  output: (id: string) =>
    queryOptions({
      queryKey: agentKeys.output(id),
      queryFn: async () => {
        const result = await AgentService.getAgent.execute(
          new UniqueEntityID(id)
        );
        if (result.isFailure) return null;
        
        const agent = result.getValue();
        return {
          outputFormat: agent.props.outputFormat,
          enabledStructuredOutput: agent.props.enabledStructuredOutput,
          schemaFields: agent.props.schemaFields,
        };
      },
      staleTime: 1000 * 30, // 30 seconds
    }),

  // Agent schema fields
  schemaFields: (id: string) =>
    queryOptions({
      queryKey: agentKeys.schemaFields(id),
      queryFn: async () => {
        const result = await AgentService.getAgent.execute(
          new UniqueEntityID(id)
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
          new UniqueEntityID(id)
        );
        if (result.isFailure) return null;
        
        const agent = result.getValue();
        return {
          apiType: agent.props.targetApiType,
          modelName: agent.props.modelName,
          modelId: agent.props.modelId,
          apiSource: agent.props.apiSource,
        };
      },
      staleTime: 1000 * 60, // 1 minute
    }),

  // Agent parameters
  parameters: (id: string) =>
    queryOptions({
      queryKey: agentKeys.parameters(id),
      queryFn: async () => {
        const result = await AgentService.getAgent.execute(
          new UniqueEntityID(id)
        );
        if (result.isFailure) return null;
        
        const agent = result.getValue();
        const params = agent.props.parameterValues || new Map();
        const enabled = agent.props.enabledParameters || new Map();
        return {
          enabledParameters: enabled,
          parameterValues: params,
        };
      },
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