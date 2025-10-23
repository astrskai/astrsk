import { useMemo } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { agentQueries } from "@/app/queries/agent/query-factory";
import { ifNodeQueries } from "@/app/queries/if-node/query-factory";
import { dataStoreNodeQueries } from "@/app/queries/data-store-node/query-factory";
import { AgentDrizzleMapper } from "@/entities/agent/mappers/agent-drizzle-mapper";
import { IfNodeDrizzleMapper } from "@/entities/if-node/mappers/if-node-drizzle-mapper";
import { DataStoreNodeDrizzleMapper } from "@/entities/data-store-node/mappers/data-store-node-drizzle-mapper";
import { NodeType } from "@/entities/flow/model/node-types";
import { Flow } from "@/entities/flow/domain";
import { InsertAgent } from "@/db/schema/agents";
import { InsertIfNode } from "@/db/schema/if-nodes";
import { InsertDataStoreNode } from "@/db/schema/data-store-nodes";

interface FlowDataResult {
  agents: Record<string, InsertAgent>;
  ifNodes: Record<string, InsertIfNode>;
  dataStoreNodes: Record<string, InsertDataStoreNode>;
}

interface FlowNode {
  id: string;
  type: string;
  data?: {
    agentId?: string;
    [key: string]: unknown;
  };
}

/**
 * Hook to load all flow-related data (agents, if-nodes, data-store nodes)
 */
export function useFlowData(
  flowId: string | null,
  flow: Flow | null,
): FlowDataResult {
  // Extract if-node IDs from flow nodes (same pattern as agents)
  const ifNodeIds = useMemo<string[]>(() => {
    if (!flow?.props?.nodes) {
      return [];
    }

    const ids = flow.props.nodes
      .filter((node) => node.type === "if")
      .map((node) => node.id)
      .filter((id): id is string => Boolean(id));

    // Remove duplicates to prevent duplicate query registrations
    return [...new Set(ids)];
  }, [flow]);

  // Load all if-nodes referenced by the flow (same pattern as agents)
  const ifNodeQueriesResults = useQueries({
    queries: ifNodeIds.map((nodeId: string) => {
      const query = ifNodeQueries.detail(nodeId);
      return {
        ...query,
        enabled: !!nodeId && !!flowId && !!flow,
        // Ensure stable query key
        queryKey: query.queryKey,
      };
    }),
  });

  // Convert if-node queries to Record<nodeId, nodeData>
  const ifNodes = useMemo<Record<string, InsertIfNode>>(() => {
    if (!flow || !ifNodeQueriesResults.length) return {};

    const nodeMap: Record<string, InsertIfNode> = {};

    // Store if-nodes by their nodeId
    ifNodeIds.forEach((nodeId, index) => {
      const queryResult = ifNodeQueriesResults[index];
      const nodeData = queryResult?.data;

      // Only process if we have valid node data
      if (nodeData) {
        try {
          // Convert to persistence format - this includes ALL if-node fields
          const persistenceData = IfNodeDrizzleMapper.toPersistence(nodeData);
          nodeMap[nodeId] = persistenceData;
        } catch (error) {
          console.error("Failed to convert if-node:", nodeId, error);
        }
      }
    });

    return nodeMap;
  }, [
    flow?.id,
    ifNodeIds.length,
    ifNodeQueriesResults.map((r) => r.dataUpdatedAt).join(","),
  ]);

  // Extract data-store node IDs from flow nodes (same pattern as agents)
  const dataStoreNodeIds = useMemo<string[]>(() => {
    if (!flow?.props?.nodes) {
      return [];
    }

    const ids = flow.props.nodes
      .filter((node) => node.type === "dataStore")
      .map((node) => node.id)
      .filter((id): id is string => Boolean(id));

    // Remove duplicates to prevent duplicate query registrations
    return [...new Set(ids)];
  }, [flow]);

  // Load all data-store nodes referenced by the flow (same pattern as agents)
  const dataStoreNodeQueriesResults = useQueries({
    queries: dataStoreNodeIds.map((nodeId: string) => {
      const query = dataStoreNodeQueries.detail(nodeId);
      return {
        ...query,
        enabled: !!nodeId && !!flowId && !!flow,
        // Ensure stable query key
        queryKey: query.queryKey,
      };
    }),
  });

  // Convert data-store node queries to Record<nodeId, nodeData>
  const dataStoreNodes = useMemo<Record<string, InsertDataStoreNode>>(() => {
    if (!flow || !dataStoreNodeQueriesResults.length) return {};

    const nodeMap: Record<string, InsertDataStoreNode> = {};

    // Store data-store nodes by their nodeId
    dataStoreNodeIds.forEach((nodeId, index) => {
      const queryResult = dataStoreNodeQueriesResults[index];
      const nodeData = queryResult?.data;

      // Only process if we have valid node data
      if (nodeData) {
        try {
          // Convert to persistence format - this includes ALL data-store node fields
          const persistenceData =
            DataStoreNodeDrizzleMapper.toPersistence(nodeData);
          nodeMap[nodeId] = persistenceData;
        } catch (error) {
          console.error("Failed to convert data-store node:", nodeId, error);
        }
      }
    });

    return nodeMap;
  }, [
    flow?.id,
    dataStoreNodeIds.length,
    dataStoreNodeQueriesResults.every((r) => r.isSuccess),
  ]);

  // Extract agent IDs from flow nodes (remove duplicates to prevent duplicate queries)
  const agentIds = useMemo<string[]>(() => {
    if (!flow?.props?.nodes) {
      return [];
    }

    const ids = flow.props.nodes
      .filter((node) => node.type === NodeType.AGENT)
      .map((node) => {
        const flowNode = node as FlowNode;
        return flowNode.data?.agentId || node.id;
      })
      .filter((id): id is string => Boolean(id));

    // Remove duplicates to prevent duplicate query registrations
    return [...new Set(ids)];
  }, [flow]);

  // Load all agents referenced by the flow
  // Use the agentQueries.detail factory which properly handles transformation
  const agentQueriesResults = useQueries({
    queries: agentIds.map((agentId: string) => {
      const query = agentQueries.detail(agentId);
      return {
        ...query,
        enabled: !!agentId && !!flow,
        // Ensure stable query key
        queryKey: query.queryKey,
      };
    }),
  });

  // Convert agent queries to Record<agentId, agentData>
  const agents = useMemo<Record<string, InsertAgent>>(() => {
    if (!flow || !agentQueriesResults.length) return {};

    const agentMap: Record<string, InsertAgent> = {};

    // Store agents by their agentId (not node.id)
    agentIds.forEach((agentId, index) => {
      const queryResult = agentQueriesResults[index];
      const agentData = queryResult?.data;

      // Only process if we have valid agent data
      if (agentData) {
        try {
          // Convert to persistence format - this includes ALL agent fields
          const persistenceData = AgentDrizzleMapper.toPersistence(agentData);
          agentMap[agentId] = persistenceData;
        } catch (error) {
          console.error("Failed to convert agent:", agentId, error);
        }
      }
    });

    return agentMap;
  }, [
    flow?.id,
    agentIds.length,
    agentQueriesResults.map((r) => r.dataUpdatedAt).join(","),
  ]);

  return {
    agents,
    ifNodes,
    dataStoreNodes,
  };
}
