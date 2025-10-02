/**
 * Flow Query Factory
 *
 * Based on TkDodo's query factory pattern and TanStack Query v5 best practices.
 * This factory provides:
 * - Centralized query key management
 * - Type-safe query options
 * - Hierarchical key structure for granular invalidation
 * - Co-location of keys and query functions
 */

import { queryClient } from "@/app/queries/query-client";
import { FlowService } from "@/app/services/flow-service";
import { ValidationIssue } from "@/flow-multi/validation/types/validation-types";
import {
  Edge,
  Flow,
  Node
} from "@/modules/flow/domain/flow";
import { FlowDrizzleMapper } from "@/modules/flow/mappers/flow-drizzle-mapper";
import { UniqueEntityID } from "@/shared/domain";
import { queryOptions } from "@tanstack/react-query";

// WeakMap cache for preventing unnecessary re-renders
// Uses data object references as keys for automatic garbage collection
const selectResultCache = new WeakMap<object, any>();

/**
 * Query Key Factory
 *
 * Hierarchical structure:
 * - all: ['flows']
 * - lists: ['flows', 'list']
 * - list(filters): ['flows', 'list', { filters }]
 * - details: ['flows', 'detail']
 * - detail(id): ['flows', 'detail', id]
 *   - metadata: ['flows', 'detail', id, 'metadata']
 *   - nodes: ['flows', 'detail', id, 'nodes']
 *     - node(nodeId): ['flows', 'detail', id, 'nodes', nodeId]
 *   - edges: ['flows', 'detail', id, 'edges']
 *     - edge(edgeId): ['flows', 'detail', id, 'edges', edgeId]
 *   - dataStore: ['flows', 'detail', id, 'dataStore']
 *     - schema: ['flows', 'detail', id, 'dataStore', 'schema']
 *     - fields: ['flows', 'detail', id, 'dataStore', 'schema', 'fields']
 *     - field(fieldId): ['flows', 'detail', id, 'dataStore', 'schema', 'fields', fieldId]
 *     - runtime(nodeId): ['flows', 'detail', id, 'dataStore', 'runtime', nodeId]
 *   - response: ['flows', 'detail', id, 'response']
 *   - validation: ['flows', 'detail', id, 'validation']
 *     - issues: ['flows', 'detail', id, 'validation', 'issues']
 *     - issue(issueId): ['flows', 'detail', id, 'validation', 'issues', issueId]
 *   - ui: ['flows', 'detail', id, 'ui']
 *     - panels: ['flows', 'detail', id, 'ui', 'panels']
 *     - viewport: ['flows', 'detail', id, 'ui', 'viewport']
 *   - agents: ['flows', 'detail', id, 'agents']
 *     - agent(agentId): ['flows', 'detail', id, 'agents', agentId]
 */

// Types for query data
export interface SearchFlowsParams {
  keyword?: string;
  limit?: number;
}

export interface FlowMetadata {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface FlowGraph {
  nodes: Node[];
  edges: Edge[];
}

export interface FlowValidation {
  readyState: string;
  issues?: ValidationIssue[];
}

// Query Key Factory
export const flowKeys = {
  all: ["flows"] as const,

  // List queries
  lists: () => [...flowKeys.all, "list"] as const,
  list: (params?: SearchFlowsParams) => {
    if (!params || (params.keyword === "" && params.limit === 100)) {
      return flowKeys.lists();
    }
    return [...flowKeys.lists(), params] as const;
  },

  // Detail queries
  details: () => [...flowKeys.all, "detail"] as const,
  detail: (id: string) => [...flowKeys.details(), id, "enhanced-v1"] as const,

  // Sub-queries for a specific flow
  metadata: (id: string) => [...flowKeys.detail(id), "metadata"] as const,
  panelLayout: (id: string) => [...flowKeys.detail(id), "panelLayout"] as const,

  // Remove unnecessary 'graph' nesting - nodes and edges are direct children of flow detail
  nodes: (id: string) => [...flowKeys.detail(id), "nodes"] as const,
  node: (id: string, nodeId: string) =>
    [...flowKeys.nodes(id), nodeId] as const,
  edges: (id: string) => [...flowKeys.detail(id), "edges"] as const,
  edge: (id: string, edgeId: string) =>
    [...flowKeys.edges(id), edgeId] as const,

  // Keep graph for backwards compatibility if needed
  graph: (id: string) => [...flowKeys.detail(id), "graph"] as const,

  dataStore: (id: string) => [...flowKeys.detail(id), "dataStore"] as const,
  dataStoreSchema: (id: string) =>
    [...flowKeys.dataStore(id), "schema"] as const,
  dataStoreFields: (id: string) =>
    [...flowKeys.dataStoreSchema(id), "fields"] as const,
  dataStoreField: (id: string, fieldId: string) =>
    [...flowKeys.dataStoreFields(id), fieldId] as const,
  dataStoreRuntime: (id: string, nodeId: string) =>
    [...flowKeys.dataStore(id), "runtime", nodeId] as const,

  response: (id: string) => [...flowKeys.detail(id), "response"] as const,

  validation: (id: string) => [...flowKeys.detail(id), "validation"] as const,
  validationIssues: (id: string) =>
    [...flowKeys.validation(id), "issues"] as const,
  validationIssue: (id: string, issueId: string) =>
    [...flowKeys.validationIssues(id), issueId] as const,

  ui: (id: string) => [...flowKeys.detail(id), "ui"] as const,
  uiPanels: (id: string) => [...flowKeys.ui(id), "panels"] as const,
  uiViewport: (id: string) => [...flowKeys.ui(id), "viewport"] as const,

  // Agent queries (agents belong to flows)
  agents: (id: string) => [...flowKeys.detail(id), "agents"] as const,
  agent: (id: string, agentId: string) =>
    [...flowKeys.agents(id), agentId] as const,
};

// Query Options Factory
export const flowQueries = {
  // List queries
  list: (params: SearchFlowsParams = { keyword: "", limit: 100 }) =>
    queryOptions({
      queryKey: flowKeys.list(params),
      queryFn: async () => {
        const result = await FlowService.searchFlow.execute({
          keyword: params.keyword || "",
          limit: params.limit || 100,
        });
        if (result.isFailure) return [];
        return result
          .getValue()
          .map((flow) => FlowDrizzleMapper.toPersistence(flow));
      },
      select: (data): Flow[] => {
        if (!data || !Array.isArray(data)) return [];

        const cached = selectResultCache.get(data as object);
        if (cached) return cached;

        const result = data.map((flow) =>
          FlowDrizzleMapper.toDomain(flow as any),
        );
        selectResultCache.set(data as object, result);
        return result;
      },
      staleTime: 1000 * 10, // 10 seconds
      gcTime: 1000 * 60, // 1 minute
    }),

  // Full flow detail
  // Flow detail - Enhanced with dedicated table loading
  detail: (id: string) =>
    queryOptions({
      queryKey: flowKeys.detail(id),
      queryFn: async () => {
        if (!id) return null;
        // Use enhanced getFlowWithNodes to properly load data from dedicated tables
        const flowOrError = await FlowService.getFlowWithNodes.execute(
          new UniqueEntityID(id),
        );
        if (flowOrError.isFailure) {
          return null;
        }
        const flow = flowOrError.getValue();
        // Transform to persistence format for consistent caching (like legacy system)
        return FlowDrizzleMapper.toPersistence(flow);
      },
      select: (data): Flow | null => {
        if (!data) return null;

        const cached = selectResultCache.get(data as object);
        if (cached) return cached;

        const result = FlowDrizzleMapper.toDomain(data as any);
        selectResultCache.set(data as object, result);
        return result;
      },
      gcTime: 1000 * 60 * 5, // 5 minutes cache
      staleTime: 0, // Always consider stale - force refetch
    }),

  // Metadata only
  metadata: (id: string) =>
    queryOptions({
      queryKey: flowKeys.metadata(id),
      queryFn: async () => {
        const flowOrError = await FlowService.getFlow.execute(
          new UniqueEntityID(id),
        );
        if (flowOrError.isFailure) return null;

        const flow = flowOrError.getValue();
        return {
          id: flow.id.toString(),
          name: flow.props.name,
          description: flow.props.description,
          createdAt: flow.props.createdAt,
          updatedAt: flow.props.updatedAt,
        } as FlowMetadata;
      },
      staleTime: 1000 * 60, // 1 minute
    }),

  // Graph (nodes and edges)
  graph: (id: string) =>
    queryOptions({
      queryKey: flowKeys.graph(id),
      queryFn: async () => {
        const flowOrError = await FlowService.getFlow.execute(
          new UniqueEntityID(id),
        );
        if (flowOrError.isFailure) return null;

        const flow = flowOrError.getValue();
        return {
          nodes: flow.props.nodes,
          edges: flow.props.edges,
        } as FlowGraph;
      },
      staleTime: 1000 * 10, // 10 seconds
    }),

  // All nodes
  nodes: (id: string) =>
    queryOptions({
      queryKey: flowKeys.nodes(id),
      queryFn: async () => {
        const flowOrError = await FlowService.getFlow.execute(
          new UniqueEntityID(id),
        );
        if (flowOrError.isFailure) return [];

        return flowOrError.getValue().props.nodes;
      },
      staleTime: 1000 * 10,
    }),

  // Panel layout only
  panelLayout: (id: string) =>
    queryOptions({
      queryKey: flowKeys.panelLayout(id),
      queryFn: async () => {
        const flowOrError = await FlowService.getFlow.execute(
          new UniqueEntityID(id),
        );
        if (flowOrError.isFailure) return null;

        return flowOrError.getValue().props.panelStructure || null;
      },
      staleTime: 1000 * 60, // 1 minute - panel layout doesn't change often
    }),

  // Single node
  node: (id: string, nodeId: string) =>
    queryOptions({
      queryKey: flowKeys.node(id, nodeId),
      queryFn: async () => {
        const flowOrError = await FlowService.getFlow.execute(
          new UniqueEntityID(id),
        );
        if (flowOrError.isFailure) return null;

        return (
          flowOrError.getValue().props.nodes.find((n) => n.id === nodeId) ||
          null
        );
      },
      staleTime: 1000 * 10,
    }),

  // All edges
  edges: (id: string) =>
    queryOptions({
      queryKey: flowKeys.edges(id),
      queryFn: async () => {
        const flowOrError = await FlowService.getFlow.execute(
          new UniqueEntityID(id),
        );
        if (flowOrError.isFailure) return [];

        return flowOrError.getValue().props.edges;
      },
      staleTime: 1000 * 10,
    }),

  // Single edge
  edge: (id: string, edgeId: string) =>
    queryOptions({
      queryKey: flowKeys.edge(id, edgeId),
      queryFn: async () => {
        const flowOrError = await FlowService.getFlow.execute(
          new UniqueEntityID(id),
        );
        if (flowOrError.isFailure) return null;

        return (
          flowOrError.getValue().props.edges.find((e) => e.id === edgeId) ||
          null
        );
      },
      staleTime: 1000 * 10,
    }),

  // Data store schema - Enhanced
  dataStoreSchema: (id: string) =>
    queryOptions({
      queryKey: flowKeys.dataStoreSchema(id),
      queryFn: async () => {
        const flowOrError = await FlowService.getFlowWithNodes.execute(
          new UniqueEntityID(id),
        );
        if (flowOrError.isFailure) {
          console.error(
            "[dataStoreSchema] Failed to get flow:",
            flowOrError.getError(),
          );
          return null;
        }

        const flow = flowOrError.getValue();
        const schema = flow.props.dataStoreSchema;

        return schema || null;
      },
      staleTime: 1000 * 30,
    }),

  // Data store fields
  dataStoreFields: (id: string) =>
    queryOptions({
      queryKey: flowKeys.dataStoreFields(id),
      queryFn: async () => {
        const flowOrError = await FlowService.getFlow.execute(
          new UniqueEntityID(id),
        );
        if (flowOrError.isFailure) return [];

        return flowOrError.getValue().props.dataStoreSchema?.fields || [];
      },
      staleTime: 1000 * 30,
    }),

  // Single data store field
  dataStoreField: (id: string, fieldId: string) =>
    queryOptions({
      queryKey: flowKeys.dataStoreField(id, fieldId),
      queryFn: async () => {
        const flowOrError = await FlowService.getFlow.execute(
          new UniqueEntityID(id),
        );
        if (flowOrError.isFailure) return null;

        return (
          flowOrError
            .getValue()
            .props.dataStoreSchema?.fields.find((f) => f.id === fieldId) || null
        );
      },
      staleTime: 1000 * 30,
    }),

  // Data store runtime data for a node
  dataStoreRuntime: (id: string, nodeId: string) =>
    queryOptions({
      queryKey: flowKeys.dataStoreRuntime(id, nodeId),
      queryFn: async () => {
        const flowOrError = await FlowService.getFlow.execute(
          new UniqueEntityID(id),
        );
        if (flowOrError.isFailure) return {};

        const flow = flowOrError.getValue();
        const node = flow.props.nodes.find((n) => n.id === nodeId);
        if (node?.type === "dataStore") {
          return node.data || {};
        }

        return {};
      },
      staleTime: 1000 * 10,
    }),

  // Response template - Enhanced
  response: (id: string) =>
    queryOptions({
      queryKey: flowKeys.response(id),
      queryFn: async () => {
        const flowOrError = await FlowService.getFlowWithNodes.execute(
          new UniqueEntityID(id),
        );
        if (flowOrError.isFailure) {
          return "";
        }

        return flowOrError.getValue().props.responseTemplate || "";
      },
      staleTime: 1000 * 30,
    }),

  // Validation state
  validation: (id: string) =>
    queryOptions({
      queryKey: flowKeys.validation(id),
      queryFn: async () => {
        const flowOrError = await FlowService.getFlow.execute(
          new UniqueEntityID(id),
        );
        if (flowOrError.isFailure) return null;

        const flow = flowOrError.getValue();
        return {
          readyState: flow.props.readyState,
          issues: flow.props.validationIssues,
        } as FlowValidation;
      },
      staleTime: 1000 * 5, // 5 seconds - validation changes frequently
    }),

  // Validation issues
  validationIssues: (id: string) =>
    queryOptions({
      queryKey: flowKeys.validationIssues(id),
      queryFn: async () => {
        const flowOrError = await FlowService.getFlow.execute(
          new UniqueEntityID(id),
        );
        if (flowOrError.isFailure) return [];

        return flowOrError.getValue().props.validationIssues || [];
      },
      staleTime: 1000 * 5,
    }),

  // Single validation issue
  validationIssue: (id: string, issueId: string) =>
    queryOptions({
      queryKey: flowKeys.validationIssue(id, issueId),
      queryFn: async () => {
        const flowOrError = await FlowService.getFlow.execute(
          new UniqueEntityID(id),
        );
        if (flowOrError.isFailure) return null;

        return (
          flowOrError
            .getValue()
            .props.validationIssues?.find((i) => i.id === issueId) || null
        );
      },
      staleTime: 1000 * 5,
    }),

  // UI panels
  uiPanels: (id: string) =>
    queryOptions({
      queryKey: flowKeys.uiPanels(id),
      queryFn: async () => {
        const flowOrError = await FlowService.getFlow.execute(
          new UniqueEntityID(id),
        );
        if (flowOrError.isFailure) return null;

        return flowOrError.getValue().props.panelStructure || null;
      },
      staleTime: 1000 * 60, // 1 minute - UI state doesn't change often
    }),

  // UI viewport
  uiViewport: (id: string) =>
    queryOptions({
      queryKey: flowKeys.uiViewport(id),
      queryFn: async () => {
        const flowOrError = await FlowService.getFlow.execute(
          new UniqueEntityID(id),
        );
        if (flowOrError.isFailure) return null;

        return flowOrError.getValue().props.viewport || null;
      },
      staleTime: 1000 * 60,
    }),

  // Agent IDs in the flow (computed from nodes)
  agents: (id: string) =>
    queryOptions({
      queryKey: flowKeys.agents(id),
      queryFn: async () => {
        const flowOrError = await FlowService.getFlow.execute(
          new UniqueEntityID(id),
        );
        if (flowOrError.isFailure) return [];

        const flow = flowOrError.getValue();
        // Extract agent IDs from nodes with type 'agent'
        const agentNodes = flow.props.nodes.filter(
          (node: any) => node.type === "agent",
        );
        const agentIds = agentNodes.map(
          (node: any) => new UniqueEntityID(node.id),
        );

        return agentIds.map((id) => id.toString());
      },
      select: (data): UniqueEntityID[] => {
        return data.map((id) => new UniqueEntityID(id));
      },
      staleTime: 1000 * 30,
    }),
};

/**
 * Usage Examples:
 *
 * // Using query options
 * const { data: flow } = useQuery(flowQueries.detail(flowId));
 * const { data: nodes } = useQuery(flowQueries.nodes(flowId));
 * const { data: schema } = useQuery(flowQueries.dataStoreSchema(flowId));
 *
 * // Invalidating queries
 * queryClient.invalidateQueries({ queryKey: flowKeys.all }); // All flow queries
 * queryClient.invalidateQueries({ queryKey: flowKeys.nodes(flowId) }); // Just nodes
 * queryClient.invalidateQueries({ queryKey: flowKeys.dataStoreSchema(flowId) }); // Just schema
 *
 * // Prefetching
 * await queryClient.prefetchQuery(flowQueries.detail(flowId));
 *
 * // Setting query data
 * queryClient.setQueryData(flowKeys.node(flowId, nodeId), updatedNode);
 *
 * // Getting query data
 * const cachedFlow = client.getQueryData<Flow>(flowKeys.detail(flowId));
 */

/**
 * Helper functions to fetch flows from cache and convert to domain objects
 * Note: queryClient.fetchQuery returns persistence objects, not domain objects
 * The select function only works in useQuery hooks, so we need to manually convert
 */

export async function fetchFlow(id: UniqueEntityID): Promise<Flow> {
  const data = await queryClient.fetchQuery(
    flowQueries.detail(id.toString()),
  );
  if (!data) {
    throw new Error(`Flow not found: ${id.toString()}`);
  }
  return FlowDrizzleMapper.toDomain(data as any);
}
