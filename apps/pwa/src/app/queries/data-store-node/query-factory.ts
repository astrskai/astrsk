/**
 * DataStore Node Query Factory
 *
 * Based on TkDodo's query factory pattern and TanStack Query v5 best practices.
 * This factory provides:
 * - Centralized query key management
 * - Type-safe query options
 * - Hierarchical key structure for granular invalidation
 * - Co-location of keys and query functions
 */

import { queryClient } from "@/app/queries/query-client";
import { DataStoreNodeService } from "@/app/services/data-store-node-service";
import { DataStoreNode } from "@/modules/data-store-node/domain/data-store-node";
import { DataStoreNodeDrizzleMapper } from "@/modules/data-store-node/mappers/data-store-node-drizzle-mapper";
import { UniqueEntityID } from "@/shared/domain";
import { queryOptions } from "@tanstack/react-query";
import { parse, stringify } from "superjson";

// WeakMap cache for preventing unnecessary re-renders
// Uses data object references as keys for automatic garbage collection
const selectResultCache = new WeakMap<object, any>();

/**
 * Query Key Factory
 *
 * Hierarchical structure:
 * - all: ['data-store-nodes']
 * - detail: ['data-store-nodes', 'detail', nodeId]
 *   - name: ['data-store-nodes', 'detail', nodeId, 'name']
 *   - fields: ['data-store-nodes', 'detail', nodeId, 'fields']
 *   - color: ['data-store-nodes', 'detail', nodeId, 'color']
 * - lists: ['data-store-nodes', 'list']
 */
export const dataStoreNodeKeys = {
  // Root key for all data store node queries
  all: ["data-store-nodes"] as const,

  // List queries
  lists: () => [...dataStoreNodeKeys.all, "list"] as const,

  // Detail queries for specific node (no flowId needed)
  detail: (nodeId: string) =>
    [...dataStoreNodeKeys.all, "detail", nodeId] as const,

  // Sub-queries for specific data
  name: (nodeId: string) =>
    [...dataStoreNodeKeys.detail(nodeId), "name"] as const,
  fields: (nodeId: string) =>
    [...dataStoreNodeKeys.detail(nodeId), "fields"] as const,
  color: (nodeId: string) =>
    [...dataStoreNodeKeys.detail(nodeId), "color"] as const,
};

// Types for query data
export interface DataStoreNodeData {
  id: string;
  flowId: string;
  name: string;
  color: string;
  dataStoreFields: any[];
}

export interface DataStoreNodeNameData {
  name: string;
}

export interface DataStoreNodeFieldsData {
  fields: any[];
}

export interface DataStoreNodeColorData {
  color: string;
}

// Query Options Factory
export const dataStoreNodeQueries = {
  // Full data store node detail
  detail: (nodeId: string) =>
    queryOptions({
      queryKey: dataStoreNodeKeys.detail(nodeId),
      queryFn: async () => {
        const result = await DataStoreNodeService.getDataStoreNode.execute(
          new UniqueEntityID(nodeId),
        );
        if (result.isFailure) {
          throw new Error(result.getError());
        }

        const dataStoreNode = result.getValue();
        if (!dataStoreNode) return null;

        // Transform to persistence format for caching
        return DataStoreNodeDrizzleMapper.toPersistence(dataStoreNode);
      },
      select: (data): DataStoreNode | null => {
        if (!data) return null;

        const cached = selectResultCache.get(data as object);
        if (cached) return cached;

        const result = DataStoreNodeDrizzleMapper.toDomain(data as any);
        selectResultCache.set(data as object, result);
        return result;
      },
      staleTime: 1000 * 30, // 30 seconds
    }),

  // Data store node name only
  name: (nodeId: string) =>
    queryOptions({
      queryKey: dataStoreNodeKeys.name(nodeId),
      queryFn: async (): Promise<DataStoreNodeNameData | null> => {
        const result = await DataStoreNodeService.getDataStoreNode.execute(
          new UniqueEntityID(nodeId),
        );
        if (result.isFailure) {
          throw new Error(result.getError());
        }

        const dataStoreNode = result.getValue();
        if (!dataStoreNode) return null;

        return { name: dataStoreNode.name };
      },
      staleTime: 1000 * 60, // 1 minute
    }),

  // Data store node fields only
  fields: (nodeId: string) =>
    queryOptions({
      queryKey: dataStoreNodeKeys.fields(nodeId),
      queryFn: async (): Promise<any> => {
        const result = await DataStoreNodeService.getDataStoreNode.execute(
          new UniqueEntityID(nodeId),
        );
        if (result.isFailure) {
          throw new Error(result.getError());
        }

        const dataStoreNode = result.getValue();
        if (!dataStoreNode) return null;

        // Transform fields array to serializable format for caching
        return {
          fields: stringify(dataStoreNode.dataStoreFields),
        };
      },
      select: (data): DataStoreNodeFieldsData | null => {
        if (!data) return null;

        const cached = selectResultCache.get(data as object);
        if (cached) return cached;

        // Transform new data - deserialize SuperJSON fields
        const result: DataStoreNodeFieldsData = {
          fields: (parse(data.fields) as any[]) || [],
        };

        selectResultCache.set(data as object, result);
        return result;
      },
      staleTime: 1000 * 30, // 30 seconds
    }),

  // Data store node color only
  color: (nodeId: string) =>
    queryOptions({
      queryKey: dataStoreNodeKeys.color(nodeId),
      queryFn: async (): Promise<DataStoreNodeColorData | null> => {
        const result = await DataStoreNodeService.getDataStoreNode.execute(
          new UniqueEntityID(nodeId),
        );
        if (result.isFailure) {
          throw new Error(result.getError());
        }

        const dataStoreNode = result.getValue();
        if (!dataStoreNode) return null;

        return { color: dataStoreNode.color };
      },
      staleTime: 1000 * 60, // 1 minute
    }),
};

/**
 * Usage Examples:
 *
 * // Using query options
 * const { data: dataStoreNode } = useQuery(dataStoreNodeQueries.detail(nodeId));
 * const { data: name } = useQuery(dataStoreNodeQueries.name(flowId, nodeId));
 * const { data: fields } = useQuery(dataStoreNodeQueries.fields(flowId, nodeId));
 *
 * // Invalidating queries
 * queryClient.invalidateQueries({ queryKey: dataStoreNodeKeys.all }); // All data store node queries
 * queryClient.invalidateQueries({ queryKey: dataStoreNodeKeys.detail(flowId, nodeId) }); // Specific node
 * queryClient.invalidateQueries({ queryKey: dataStoreNodeKeys.name(flowId, nodeId) }); // Just name
 *
 * // Prefetching
 * await queryClient.prefetchQuery(dataStoreNodeQueries.detail(flowId, nodeId));
 *
 * // Setting query data
 * queryClient.setQueryData(dataStoreNodeKeys.name(flowId, nodeId), { name: newName });
 *
 * // Getting query data
 * const cachedNode = queryClient.getQueryData<DataStoreNodeData>(dataStoreNodeKeys.detail(flowId, nodeId));
 */

/**
 * Helper functions to fetch data store nodes from cache and convert to domain objects
 * Note: queryClient.fetchQuery returns persistence objects, not domain objects
 * The select function only works in useQuery hooks, so we need to manually convert
 */

export async function fetchDataStoreNode(
  nodeId: string,
): Promise<DataStoreNode> {
  const data = await queryClient.fetchQuery(
    dataStoreNodeQueries.detail(nodeId),
  );
  if (!data) {
    throw new Error(
      `DataStoreNode not found: ${nodeId}`,
    );
  }
  return DataStoreNodeDrizzleMapper.toDomain(data as any);
}
