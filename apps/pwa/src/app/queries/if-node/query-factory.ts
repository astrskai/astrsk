/**
 * If Node Query Factory
 * 
 * Based on TkDodo's query factory pattern and TanStack Query v5 best practices.
 * This factory provides:
 * - Centralized query key management
 * - Type-safe query options
 * - Hierarchical key structure for granular invalidation
 * - Co-location of keys and query functions
 */

import { queryOptions } from "@tanstack/react-query";
import { UniqueEntityID } from "@/shared/domain";
import { IfNodeService } from "@/app/services/if-node-service";
import { IfCondition } from "@/flow-multi/nodes/if-node";
import { IfNodeDrizzleMapper } from "@/modules/if-node/mappers/if-node-drizzle-mapper";
import { IfNode } from "@/modules/if-node/domain/if-node";
import { parse, stringify } from "superjson";
import { queryClient } from "@/app/queries/query-client";

// WeakMap cache for preventing unnecessary re-renders
// Uses data object references as keys for automatic garbage collection
const selectResultCache = new WeakMap<object, any>();

/**
 * Check if a nodeId is in the old format (not a UUID)
 * Old format examples: "if-1755665937310", "datastore-1234567890"
 * New format: UUID strings like "123e4567-e89b-12d3-a456-426614174000"
 */
function isOldNodeIdFormat(nodeId: string): boolean {
  // UUID regex pattern
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return !uuidPattern.test(nodeId);
}

/**
 * Query Key Factory
 * 
 * Hierarchical structure:
 * - all: ['if-nodes']
 * - detail: ['if-nodes', 'flow', flowId, nodeId]
 *   - name: ['if-nodes', 'flow', flowId, nodeId, 'name']
 *   - conditions: ['if-nodes', 'flow', flowId, nodeId, 'conditions']
 *   - color: ['if-nodes', 'flow', flowId, nodeId, 'color']
 *   - logicOperator: ['if-nodes', 'flow', flowId, nodeId, 'logicOperator']
 */
export const ifNodeKeys = {
  // Root key for all if node queries
  all: ['if-nodes'] as const,
  
  // Detail queries for specific node
  detail: (flowId: string, nodeId: string) => [...ifNodeKeys.all, 'flow', flowId, nodeId] as const,
  
  // Sub-queries for specific data
  name: (flowId: string, nodeId: string) => [...ifNodeKeys.detail(flowId, nodeId), 'name'] as const,
  conditions: (flowId: string, nodeId: string) => [...ifNodeKeys.detail(flowId, nodeId), 'conditions'] as const,
  color: (flowId: string, nodeId: string) => [...ifNodeKeys.detail(flowId, nodeId), 'color'] as const,
  logicOperator: (flowId: string, nodeId: string) => [...ifNodeKeys.detail(flowId, nodeId), 'logicOperator'] as const,
};

// Types for query data
export interface IfNodeData {
  id: string;
  flowId: string;
  name: string;
  color: string;
  logicOperator: 'AND' | 'OR';
  conditions: IfCondition[];
}

export interface IfNodeNameData {
  name: string;
}

export interface IfNodeConditionsData {
  conditions: IfCondition[];
}

export interface IfNodeColorData {
  color: string;
}

export interface IfNodeLogicOperatorData {
  logicOperator: 'AND' | 'OR';
}

// Query Options Factory
export const ifNodeQueries = {
  // Full if node detail
  detail: (flowId: string, nodeId: string) =>
    queryOptions({
      queryKey: ifNodeKeys.detail(flowId, nodeId),
      queryFn: async () => {
        const result = await IfNodeService.getIfNode.execute({ flowId, nodeId });
        if (result.isFailure) {
          throw new Error(result.getError());
        }
        
        const ifNode = result.getValue();
        if (!ifNode) return null;
        
        // Transform to persistence format for caching
        return IfNodeDrizzleMapper.toPersistence(ifNode);
      },
      select: (data): IfNode | null => {
        if (!data) return null;
        
        const cached = selectResultCache.get(data as object);
        if (cached) return cached;
        
        const result = IfNodeDrizzleMapper.toDomain(data as any);
        selectResultCache.set(data as object, result);
        return result;
      },
      staleTime: 1000 * 30, // 30 seconds
    }),

  // If node name only
  name: (flowId: string, nodeId: string) =>
    queryOptions({
      queryKey: ifNodeKeys.name(flowId, nodeId),
      queryFn: async (): Promise<IfNodeNameData | null> => {
        const result = await IfNodeService.getIfNode.execute({ flowId, nodeId });
        if (result.isFailure) {
          throw new Error(result.getError());
        }
        
        const ifNode = result.getValue();
        if (!ifNode) return null;
        
        return { name: ifNode.name };
      },
      staleTime: 1000 * 60, // 1 minute
    }),

  // If node conditions only
  conditions: (flowId: string, nodeId: string) =>
    queryOptions({
      queryKey: ifNodeKeys.conditions(flowId, nodeId),
      queryFn: async (): Promise<any> => {
        const result = await IfNodeService.getIfNode.execute({ flowId, nodeId });
        if (result.isFailure) {
          throw new Error(result.getError());
        }
        
        const ifNode = result.getValue();
        if (!ifNode) return null;
        
        // Transform conditions array to serializable format for caching
        return {
          conditions: stringify(ifNode.conditions)
        };
      },
      select: (data): IfNodeConditionsData | null => {
        if (!data) return null;
        
        const cached = selectResultCache.get(data as object);
        if (cached) return cached;
        
        // Transform new data - deserialize SuperJSON conditions
        const result: IfNodeConditionsData = {
          conditions: parse(data.conditions) as IfCondition[] || []
        };
        
        selectResultCache.set(data as object, result);
        return result;
      },
      staleTime: 1000 * 30, // 30 seconds
    }),

  // If node color only
  color: (flowId: string, nodeId: string) =>
    queryOptions({
      queryKey: ifNodeKeys.color(flowId, nodeId),
      queryFn: async (): Promise<IfNodeColorData | null> => {
        const result = await IfNodeService.getIfNode.execute({ flowId, nodeId });
        if (result.isFailure) {
          throw new Error(result.getError());
        }
        
        const ifNode = result.getValue();
        if (!ifNode) return null;
        
        return { color: ifNode.color };
      },
      staleTime: 1000 * 60, // 1 minute
    }),

  // If node logic operator only
  logicOperator: (flowId: string, nodeId: string) =>
    queryOptions({
      queryKey: ifNodeKeys.logicOperator(flowId, nodeId),
      queryFn: async (): Promise<IfNodeLogicOperatorData | null> => {
        const result = await IfNodeService.getIfNode.execute({ flowId, nodeId });
        if (result.isFailure) {
          throw new Error(result.getError());
        }
        
        const ifNode = result.getValue();
        if (!ifNode) return null;
        
        return { logicOperator: ifNode.logicOperator };
      },
      staleTime: 1000 * 60, // 1 minute
    }),
};

/**
 * Usage Examples:
 * 
 * // Using query options
 * const { data: ifNode } = useQuery(ifNodeQueries.detail(flowId, nodeId));
 * const { data: name } = useQuery(ifNodeQueries.name(flowId, nodeId));
 * const { data: conditions } = useQuery(ifNodeQueries.conditions(flowId, nodeId));
 * 
 * // Invalidating queries
 * queryClient.invalidateQueries({ queryKey: ifNodeKeys.all }); // All if node queries
 * queryClient.invalidateQueries({ queryKey: ifNodeKeys.detail(flowId, nodeId) }); // Specific node
 * queryClient.invalidateQueries({ queryKey: ifNodeKeys.name(flowId, nodeId) }); // Just name
 * 
 * // Prefetching
 * await queryClient.prefetchQuery(ifNodeQueries.detail(flowId, nodeId));
 * 
 * // Setting query data
 * queryClient.setQueryData(ifNodeKeys.name(flowId, nodeId), { name: newName });
 * 
 * // Getting query data
 * const cachedNode = queryClient.getQueryData<IfNodeData>(ifNodeKeys.detail(flowId, nodeId));
 */

/**
 * Helper functions to fetch if nodes from cache and convert to domain objects
 * Note: queryClient.fetchQuery returns persistence objects, not domain objects
 * The select function only works in useQuery hooks, so we need to manually convert
 */

export async function fetchIfNode(
  flowId: UniqueEntityID,
  nodeId: string,
): Promise<IfNode> {
  const data = await queryClient.fetchQuery(
    ifNodeQueries.detail(flowId.toString(), nodeId),
  );
  if (!data) {
    throw new Error(`IfNode not found: ${flowId.toString()}/${nodeId}`);
  }
  return IfNodeDrizzleMapper.toDomain(data as any);
}