/**
 * Composite Node Mutation Hooks
 *
 * Single source of truth for node operations that require both:
 * 1. Entity creation/deletion (Agent, DataStore, IfNode)
 * 2. Flow graph updates (adding/removing nodes)
 *
 * These mutations handle both operations atomically with proper rollback
 *
 * IMPORTANT DATA STRUCTURE NOTE:
 * React Query cache stores flow data in PERSISTENCE format (from FlowDrizzleMapper.toPersistence):
 * - Direct properties: flowData.nodes, flowData.edges
 * - Snake_case naming: updated_at, ready_state, etc.
 *
 * This is different from Flow domain objects which have:
 * - Wrapped properties: flow.props.nodes, flow.props.edges
 * - CamelCase naming: updatedAt, readyState, etc.
 *
 * All mutations use debugFlowData() to handle both structures correctly.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UniqueEntityID } from "@/shared/domain";
import { AgentService } from "@/app/services/agent-service";
import { DataStoreNodeService } from "@/app/services/data-store-node-service";
import { IfNodeService } from "@/app/services/if-node-service";
import { FlowService } from "@/app/services/flow-service";
import { flowKeys } from "../query-factory";
import { agentKeys } from "@/entities/agent/api/query-factory";
import { dataStoreNodeKeys } from "@/entities/data-store-node/api/query-factory";
import { ifNodeKeys } from "@/entities/if-node/api/query-factory";
import { NodeType } from "@/entities/flow/model/node-types";
import { Agent, ApiType } from "@/entities/agent/domain/agent";
import { InsertFlow } from "@/db/schema/flows";
import { type CustomNodeType } from "@/features/flow/nodes/index";
import { type CustomEdgeType } from "@/features/flow/edges/index";

// ============================================================================
// Common Types
// ============================================================================

interface CreateNodeParams {
  nodeId: string;
  position: { x: number; y: number };
  nodeName: string;
  nodeColor: string;
}

interface DeleteNodeParams {
  nodeId: string;
}

interface CloneNodeParams {
  copyNodeId: string; // ID of the node to copy
  nodeId: string; // New node ID
  position: { x: number; y: number };
  nodeName: string;
  nodeColor: string;
}

// ============================================================================
// Agent Node Mutations
// ============================================================================

/**
 * Creates a new agent and adds its node to the flow
 *
 * @param flowId - The flow ID to add the agent node to
 * @returns Mutation hook for creating agent nodes
 *
 * @example
 * const createAgentNode = useCreateAgentNode(flowId);
 * await createAgentNode.mutateAsync({
 *   position: { x: 100, y: 200 },
 *   data: { name: "My Agent", apiType: ApiType.Chat }
 * });
 */
export const useCreateAgentNode = (flowId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [`flow-${flowId}`, "create-agent-node"],
    mutationFn: async (params: CreateNodeParams) => {
      const { nodeId, position, nodeName, nodeColor } = params;

      // Get current flow for the update
      const flowData = queryClient.getQueryData<InsertFlow>(
        flowKeys.detail(flowId),
      );
      // Create new agent with pre-computed values
      const newAgent = Agent.create(
        {
          name: nodeName,
          description: "",
          promptMessages: [],
          targetApiType: ApiType.Chat,
          color: nodeColor,
          flowId: new UniqueEntityID(flowId),
        },
        new UniqueEntityID(nodeId),
      );

      if (newAgent.isFailure) {
        throw new Error(newAgent.getError());
      }

      const agent = newAgent.getValue();

      // Save the agent
      const savedAgentResult = await AgentService.saveAgent.execute(agent);
      if (savedAgentResult.isFailure) {
        throw new Error(savedAgentResult.getError());
      }

      const savedAgent = savedAgentResult.getValue();

      // Create the agent node with the pre-computed values
      const newNode = {
        id: nodeId,
        type: NodeType.AGENT as const,
        position,
        deletable: false,
        draggable: true,
        data: {},
      };

      // Update flow with new node
      const currentNodes = flowData?.nodes || [];
      const updatedNodes = [...currentNodes, newNode];
      const currentEdges = flowData?.edges || [];

      // Save the updated flow
      await FlowService.updateNodesAndEdges.execute({
        flowId,
        nodes: updatedNodes,
        edges: currentEdges,
      });

      return { agent: savedAgent, node: newNode };
    },

    onMutate: async (params: CreateNodeParams) => {
      const { nodeId, position } = params;

      // Cancel queries
      await queryClient.cancelQueries({ queryKey: flowKeys.detail(flowId) });

      // Snapshot for rollback
      const previousFlow = queryClient.getQueryData<InsertFlow>(
        flowKeys.detail(flowId),
      );

      if (!previousFlow) throw new Error("Flow not found");

      // Optimistic update with computed values
      queryClient.setQueryData(flowKeys.detail(flowId), (old: InsertFlow) => {
        if (!old) return old;

        const optimisticNode = {
          id: nodeId,
          type: NodeType.AGENT as const,
          position: position,
          deletable: false,
          draggable: true,
          data: {},
        };

        // Cache contains persistence data (snake_case with direct nodes/edges)
        return {
          ...old,
          nodes: [...(old.nodes || []), optimisticNode],
          updated_at: new Date(),
        };
      });

      return { previousFlow };
    },

    onError: (_err, _variables, context) => {
      // Rollback
      if (context?.previousFlow) {
        queryClient.setQueryData(flowKeys.detail(flowId), context.previousFlow);
      }
    },

    onSuccess: async (data) => {
      // Set the agent data in cache so it's immediately available for validation
      const agentId = data.agent.id.toString();
      queryClient.setQueryData(agentKeys.detail(agentId), data.agent);

      // Invalidate queries
      await Promise.all([
        // queryClient.invalidateQueries({ queryKey: flowKeys.detail(flowId) }),
        // queryClient.invalidateQueries({ queryKey: flowKeys.lists() }),
        // queryClient.invalidateQueries({ queryKey: agentKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: agentKeys.detail(agentId) }),
      ]);
    },
  });
};

/**
 * Deletes an agent and removes its node from the flow
 */
export const useDeleteAgentNode = (flowId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [`flow-${flowId}`, "delete-agent-node"],
    mutationFn: async ({ nodeId }: DeleteNodeParams) => {
      // Get current flow from cache
      const flowData = queryClient.getQueryData<InsertFlow>(
        flowKeys.detail(flowId),
      );

      if (!flowData) throw new Error("Flow not found");

      // Delete the agent entity
      const deleteResult = await AgentService.deleteAgent.execute(
        new UniqueEntityID(nodeId),
      );
      if (deleteResult.isFailure) {
        throw new Error(deleteResult.getError());
      }

      // Update flow - filter out deleted node and its edges
      const currentNodes = flowData?.nodes || [];
      const updatedNodes = currentNodes.filter(
        (n: CustomNodeType) => n.id !== nodeId,
      );
      const currentEdges = flowData?.edges || [];
      const updatedEdges = currentEdges.filter(
        (e: CustomEdgeType) => e.source !== nodeId && e.target !== nodeId,
      );

      await FlowService.updateNodesAndEdges.execute({
        flowId,
        nodes: updatedNodes,
        edges: updatedEdges,
      });

      // Return deleted nodeId - flow update is handled by flow-panel
      return { nodeId };
    },

    onMutate: async ({ nodeId }) => {
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: flowKeys.detail(flowId) });
      await queryClient.cancelQueries({ queryKey: agentKeys.detail(nodeId) });

      // Snapshot
      const previousFlow = queryClient.getQueryData<InsertFlow>(
        flowKeys.detail(flowId),
      );
      const previousAgent = queryClient.getQueryData(agentKeys.detail(nodeId));

      // Optimistic update - remove node and connected edges
      queryClient.setQueryData(flowKeys.detail(flowId), (old: InsertFlow) => {
        if (!old) return old;

        // InsertFlow has direct nodes/edges, not wrapped in props
        return {
          ...old,
          nodes: (old.nodes || []).filter(
            (n: CustomNodeType) => n.id !== nodeId,
          ),
          edges: (old.edges || []).filter(
            (e: CustomEdgeType) => e.source !== nodeId && e.target !== nodeId,
          ),
          updated_at: new Date(),
        };
      });

      return { previousFlow, previousAgent, nodeId };
    },

    onError: (_err, _variables, context) => {
      // Rollback
      if (context?.previousFlow) {
        queryClient.setQueryData(flowKeys.detail(flowId), context.previousFlow);
      }
      if (context?.previousAgent && context?.nodeId) {
        queryClient.setQueryData(
          agentKeys.detail(context.nodeId),
          context.previousAgent,
        );
      }
    },

    onSuccess: async () => {},
  });
};

/**
 * Clones an existing agent and adds its node to the flow
 */
export const useCloneAgentNode = (flowId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [`flow-${flowId}`, "clone-agent-node"],
    mutationFn: async (params: CloneNodeParams) => {
      const { copyNodeId, nodeId, position, nodeName, nodeColor } = params;

      // Get current flow from cache
      const flowData = queryClient.getQueryData<InsertFlow>(
        flowKeys.detail(flowId),
      );
      if (!flowData) throw new Error("Flow not found");

      // Clone the agent with the specified target ID (nodeId)
      const clonedAgentResult = await AgentService.cloneAgent.execute({
        sourceAgentId: new UniqueEntityID(copyNodeId),
        targetAgentId: new UniqueEntityID(nodeId), // Use nodeId as the new agent's ID
      });
      if (clonedAgentResult.isFailure) {
        throw new Error(clonedAgentResult.getError());
      }

      const clonedAgent = clonedAgentResult.getValue();

      // Update with pre-computed values (name and color)
      const updatedAgent = clonedAgent.update({
        name: nodeName,
        color: nodeColor,
      });
      if (updatedAgent.isFailure) {
        throw new Error(updatedAgent.getError());
      }

      // Save the cloned agent with new ID
      const savedAgentResult = await AgentService.saveAgent.execute(
        updatedAgent.getValue(),
      );
      if (savedAgentResult.isFailure) {
        throw new Error(savedAgentResult.getError());
      }

      const savedAgent = savedAgentResult.getValue();

      // Create node for cloned agent
      const newNode = {
        id: nodeId,
        type: NodeType.AGENT as const,
        position,
        deletable: false,
        draggable: true,
        data: {},
      };

      // Update flow
      const currentNodes = flowData?.nodes || [];
      const updatedNodes = [...currentNodes, newNode];
      const currentEdges = flowData?.edges || [];

      await FlowService.updateNodesAndEdges.execute({
        flowId,
        nodes: updatedNodes,
        edges: currentEdges,
      });

      return { agent: savedAgent, node: newNode };
    },

    onMutate: async (params: CloneNodeParams) => {
      const { nodeId, position } = params;

      // Cancel queries
      await queryClient.cancelQueries({ queryKey: flowKeys.detail(flowId) });

      // Snapshot
      const previousFlow = queryClient.getQueryData<InsertFlow>(
        flowKeys.detail(flowId),
      );

      // Optimistic update with pre-computed values
      queryClient.setQueryData(flowKeys.detail(flowId), (old: InsertFlow) => {
        if (!old) return old;

        const optimisticNode = {
          id: nodeId,
          type: NodeType.AGENT as const,
          position,
          deletable: false,
          draggable: true,
          data: {},
        };

        // Cache contains persistence data (snake_case with direct nodes/edges)
        return {
          ...old,
          nodes: [...(old.nodes || []), optimisticNode],
          updated_at: new Date(),
        };
      });

      return { previousFlow };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousFlow) {
        queryClient.setQueryData(flowKeys.detail(flowId), context.previousFlow);
      }
    },

    onSuccess: async (data) => {
      const agentId = data.agent.id.toString();
      queryClient.setQueryData(agentKeys.detail(agentId), data.agent);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: agentKeys.detail(agentId),
        }),
      ]);
    },
  });
};

// ============================================================================
// DataStore Node Mutations
// ============================================================================

/**
 * Creates a new data store node and adds it to the flow
 */
export const useCreateDataStoreNode = (flowId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [`flow-${flowId}`, "create-datastore-node"],
    mutationFn: async (params: CreateNodeParams) => {
      const { nodeId, position, nodeName, nodeColor } = params;

      // Get current flow from cache - this is persistence data
      const flowData = queryClient.getQueryData<InsertFlow>(
        flowKeys.detail(flowId),
      );

      if (!flowData) throw new Error("Flow not found");

      // Create data store node with pre-computed values
      const createResult =
        await DataStoreNodeService.createDataStoreNode.execute({
          flowId,
          nodeId,
          name: nodeName,
          color: nodeColor,
          dataStoreFields: [],
        });

      if (createResult.isFailure) {
        throw new Error(createResult.getError());
      }

      // Create node
      const newNode = {
        id: nodeId,
        type: NodeType.DATA_STORE as const,
        position,
        deletable: false,
        draggable: true,
        data: {},
      };

      // Update flow
      const currentNodes = flowData?.nodes || [];
      const updatedNodes = [...currentNodes, newNode];
      const currentEdges = flowData?.edges || [];

      await FlowService.updateNodesAndEdges.execute({
        flowId,
        nodes: updatedNodes,
        edges: currentEdges,
      });

      return { dataStore: createResult.getValue(), node: newNode };
    },

    onMutate: async (params: CreateNodeParams) => {
      const { nodeId, position } = params;

      // Cancel queries
      await queryClient.cancelQueries({ queryKey: flowKeys.detail(flowId) });

      // Snapshot for rollback
      const previousFlow = queryClient.getQueryData<InsertFlow>(
        flowKeys.detail(flowId),
      );

      // Optimistic update with pre-computed values
      queryClient.setQueryData(flowKeys.detail(flowId), (old: InsertFlow) => {
        if (!old) return old;

        const optimisticNode = {
          id: nodeId,
          type: NodeType.DATA_STORE as const,
          position: position,
          deletable: false,
          draggable: true,
          data: {},
        };

        // Cache contains persistence data (snake_case with direct nodes/edges)
        return {
          ...old,
          nodes: [...(old.nodes || []), optimisticNode],
          updated_at: new Date(),
        };
      });

      return { previousFlow };
    },

    onError: (_err, _variables, context) => {
      // Rollback
      if (context?.previousFlow) {
        queryClient.setQueryData(flowKeys.detail(flowId), context.previousFlow);
      }
    },

    onSuccess: async (data) => {
      const dataStoreId = data.dataStore.id.toString();
      queryClient.setQueryData(
        dataStoreNodeKeys.detail(dataStoreId),
        data.dataStore,
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: dataStoreNodeKeys.detail(dataStoreId),
        }),
      ]);
    },
  });
};

/**
 * Deletes a data store node and removes it from the flow
 */
export const useDeleteDataStoreNode = (flowId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [`flow-${flowId}`, "delete-datastore-node"],
    mutationFn: async ({ nodeId }: DeleteNodeParams) => {
      // Get current flow from cache
      const flowData = queryClient.getQueryData<InsertFlow>(
        flowKeys.detail(flowId),
      );

      if (!flowData) throw new Error("Flow not found");

      // Delete data store node entity
      const deleteResult =
        await DataStoreNodeService.deleteDataStoreNode.execute({
          nodeId,
        });

      if (deleteResult.isFailure) {
        throw new Error(deleteResult.getError());
      }

      // Update flow - filter out deleted node and its edges
      const currentNodes = flowData?.nodes || [];
      const updatedNodes = currentNodes.filter(
        (n: CustomNodeType) => n.id !== nodeId,
      );
      const currentEdges = flowData?.edges || [];
      const updatedEdges = currentEdges.filter(
        (e: CustomEdgeType) => e.source !== nodeId && e.target !== nodeId,
      );

      await FlowService.updateNodesAndEdges.execute({
        flowId,
        nodes: updatedNodes,
        edges: updatedEdges,
      });

      // Return deleted nodeId - flow update is handled by flow-panel
      return { nodeId };
    },

    onMutate: async ({ nodeId }) => {
      await queryClient.cancelQueries({ queryKey: flowKeys.detail(flowId) });

      const previousFlow = queryClient.getQueryData<InsertFlow>(
        flowKeys.detail(flowId),
      );

      queryClient.setQueryData(flowKeys.detail(flowId), (old: InsertFlow) => {
        if (!old) return old;

        // InsertFlow has direct nodes/edges, not wrapped in props
        return {
          ...old,
          nodes: (old.nodes || []).filter(
            (n: CustomNodeType) => n.id !== nodeId,
          ),
          edges: (old.edges || []).filter(
            (e: CustomEdgeType) => e.source !== nodeId && e.target !== nodeId,
          ),
          updated_at: new Date(),
        };
      });

      return { previousFlow };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousFlow) {
        queryClient.setQueryData(flowKeys.detail(flowId), context.previousFlow);
      }
    },

    onSuccess: async () => {},
  });
};

/**
 * Clones an existing data store node
 */
export const useCloneDataStoreNode = (flowId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [`flow-${flowId}`, "clone-datastore-node"],
    mutationFn: async (params: CloneNodeParams) => {
      const { copyNodeId, nodeId, position, nodeName, nodeColor } = params;

      // Get current flow from cache
      const flowData = queryClient.getQueryData<InsertFlow>(
        flowKeys.detail(flowId),
      );
      if (!flowData) throw new Error("Flow not found");

      // Clone the data store node with pre-computed values
      const cloneResult = await DataStoreNodeService.cloneDataStoreNode.execute(
        {
          originalNodeId: copyNodeId,
          originalFlowId: flowId,
          newNodeId: nodeId,
          newFlowId: flowId,
          name: nodeName,
          color: nodeColor,
        },
      );

      if (cloneResult.isFailure) {
        throw new Error(cloneResult.getError());
      }

      const clonedDataStore = cloneResult.getValue();
      if (!clonedDataStore) {
        throw new Error(`DataStore node ${copyNodeId} not found`);
      }

      // Create cloned node
      const newNode = {
        id: nodeId,
        type: NodeType.DATA_STORE as const,
        position,
        deletable: false,
        draggable: true,
        data: {},
      };

      // Update flow
      const currentNodes = flowData?.nodes || [];
      const updatedNodes = [...currentNodes, newNode];
      const currentEdges = flowData?.edges || [];

      await FlowService.updateNodesAndEdges.execute({
        flowId,
        nodes: updatedNodes,
        edges: currentEdges,
      });

      return { dataStore: clonedDataStore, node: newNode };
    },

    onMutate: async (params: CloneNodeParams) => {
      const { nodeId, position } = params;

      await queryClient.cancelQueries({ queryKey: flowKeys.detail(flowId) });

      const previousFlow = queryClient.getQueryData<InsertFlow>(
        flowKeys.detail(flowId),
      );

      queryClient.setQueryData(flowKeys.detail(flowId), (old: InsertFlow) => {
        if (!old) return old;

        const optimisticNode = {
          id: nodeId,
          type: NodeType.DATA_STORE,
          position,
          deletable: false,
          draggable: true,
          data: {},
        };

        // Cache contains persistence data (snake_case with direct nodes/edges)
        return {
          ...old,
          nodes: [...(old.nodes || []), optimisticNode],
          updated_at: new Date(),
        };
      });

      return { previousFlow };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousFlow) {
        queryClient.setQueryData(flowKeys.detail(flowId), context.previousFlow);
      }
    },

    onSuccess: async (data) => {
      const dataStoreId = data.dataStore.id.toString();
      queryClient.setQueryData(
        dataStoreNodeKeys.detail(dataStoreId),
        data.dataStore,
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: dataStoreNodeKeys.detail(dataStoreId),
        }),
      ]);
    },
  });
};

// ============================================================================
// If Node Mutations
// ============================================================================

/**
 * Creates a new if node and adds it to the flow
 */
export const useCreateIfNode = (flowId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [`flow-${flowId}`, "create-if-node"],
    mutationFn: async (params: CreateNodeParams) => {
      const { nodeId, position, nodeName, nodeColor } = params;

      // Get current flow from cache - this is persistence data
      const flowData = queryClient.getQueryData<InsertFlow>(
        flowKeys.detail(flowId),
      );

      if (!flowData) throw new Error("Flow not found");

      // Create if node with pre-computed values
      const createResult = await IfNodeService.createIfNode.execute({
        flowId,
        nodeId,
        name: nodeName,
        color: nodeColor,
        conditions: [],
        logicOperator: "AND",
      });

      if (createResult.isFailure) {
        throw new Error(createResult.getError());
      }

      // Create node
      const newNode = {
        id: nodeId,
        type: NodeType.IF as const,
        position,
        deletable: false,
        draggable: true,
        data: {},
      };

      // Update flow
      const currentNodes = flowData?.nodes || [];
      const updatedNodes = [...currentNodes, newNode];
      const currentEdges = flowData?.edges || [];

      await FlowService.updateNodesAndEdges.execute({
        flowId,
        nodes: updatedNodes,
        edges: currentEdges,
      });

      return { ifNode: createResult.getValue(), node: newNode };
    },

    onMutate: async (params: CreateNodeParams) => {
      const { nodeId, position } = params;

      // Cancel queries
      await queryClient.cancelQueries({ queryKey: flowKeys.detail(flowId) });

      // Snapshot for rollback
      const previousFlow = queryClient.getQueryData<InsertFlow>(
        flowKeys.detail(flowId),
      );

      // Optimistic update with pre-computed values
      queryClient.setQueryData(flowKeys.detail(flowId), (old: InsertFlow) => {
        if (!old) return old;

        const optimisticNode = {
          id: nodeId,
          type: NodeType.IF as const,
          position: position,
          deletable: false,
          draggable: true,
          data: {},
        };

        // Cache contains persistence data (snake_case with direct nodes/edges)
        return {
          ...old,
          nodes: [...(old.nodes || []), optimisticNode],
          updated_at: new Date(),
        };
      });

      return { previousFlow };
    },

    onError: (_err, _variables, context) => {
      // Rollback
      if (context?.previousFlow) {
        queryClient.setQueryData(flowKeys.detail(flowId), context.previousFlow);
      }
    },

    onSuccess: async (data) => {
      const ifNodeId = data.ifNode.id.toString();
      queryClient.setQueryData(ifNodeKeys.detail(ifNodeId), data.ifNode);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ifNodeKeys.detail(ifNodeId),
        }),
      ]);
    },
  });
};

/**
 * Deletes an if node and removes it from the flow
 */
export const useDeleteIfNode = (flowId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [`flow-${flowId}`, "delete-if-node"],
    mutationFn: async ({ nodeId }: DeleteNodeParams) => {
      // Get current flow from cache
      const flowData = queryClient.getQueryData<InsertFlow>(
        flowKeys.detail(flowId),
      );

      if (!flowData) throw new Error("Flow not found");

      // Delete if node entity
      const deleteResult = await IfNodeService.deleteIfNode.execute({
        nodeId,
      });

      if (deleteResult.isFailure) {
        throw new Error(deleteResult.getError());
      }

      // Update flow - filter out deleted node and its edges
      const currentNodes = flowData?.nodes || [];
      const updatedNodes = currentNodes.filter(
        (n: CustomNodeType) => n.id !== nodeId,
      );
      const currentEdges = flowData?.edges || [];
      const updatedEdges = currentEdges.filter(
        (e: CustomEdgeType) => e.source !== nodeId && e.target !== nodeId,
      );

      await FlowService.updateNodesAndEdges.execute({
        flowId,
        nodes: updatedNodes,
        edges: updatedEdges,
      });

      // Return deleted nodeId - flow update is handled by flow-panel
      return { nodeId };
    },

    onMutate: async ({ nodeId }) => {
      await queryClient.cancelQueries({ queryKey: flowKeys.detail(flowId) });

      const previousFlow = queryClient.getQueryData<InsertFlow>(
        flowKeys.detail(flowId),
      );

      queryClient.setQueryData(flowKeys.detail(flowId), (old: InsertFlow) => {
        if (!old) return old;

        // InsertFlow has direct nodes/edges, not wrapped in props
        return {
          ...old,
          nodes: (old.nodes || []).filter(
            (n: CustomNodeType) => n.id !== nodeId,
          ),
          edges: (old.edges || []).filter(
            (e: CustomEdgeType) => e.source !== nodeId && e.target !== nodeId,
          ),
          updated_at: new Date(),
        };
      });

      return { previousFlow };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousFlow) {
        queryClient.setQueryData(flowKeys.detail(flowId), context.previousFlow);
      }
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: flowKeys.detail(flowId) }),
        queryClient.invalidateQueries({ queryKey: ifNodeKeys.all }),
      ]);
    },
  });
};

/**
 * Clones an existing if node
 */
export const useCloneIfNode = (flowId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [`flow-${flowId}`, "clone-if-node"],
    mutationFn: async (params: CloneNodeParams) => {
      const { copyNodeId, nodeId, position, nodeName, nodeColor } = params;

      // Get current flow from cache
      const flowData = queryClient.getQueryData<InsertFlow>(
        flowKeys.detail(flowId),
      );
      if (!flowData) throw new Error("Flow not found");

      // Clone the if node with pre-computed values
      const cloneResult = await IfNodeService.cloneIfNode.execute({
        originalNodeId: copyNodeId,
        originalFlowId: flowId,
        newNodeId: nodeId,
        newFlowId: flowId,
        name: nodeName,
        color: nodeColor,
      });

      if (cloneResult.isFailure) {
        throw new Error(cloneResult.getError());
      }

      const clonedIfNode = cloneResult.getValue();
      if (!clonedIfNode) {
        throw new Error(`IfNode ${copyNodeId} not found`);
      }

      // Create cloned node
      const newNode = {
        id: nodeId,
        type: NodeType.IF as const,
        position,
        deletable: false,
        draggable: true,
        data: {},
      };

      // Update flow
      const currentNodes = flowData?.nodes || [];
      const updatedNodes = [...currentNodes, newNode];
      const currentEdges = flowData?.edges || [];

      await FlowService.updateNodesAndEdges.execute({
        flowId,
        nodes: updatedNodes,
        edges: currentEdges,
      });

      return { ifNode: clonedIfNode, node: newNode };
    },

    onMutate: async (params: CloneNodeParams) => {
      const { nodeId, position } = params;

      await queryClient.cancelQueries({ queryKey: flowKeys.detail(flowId) });

      const previousFlow = queryClient.getQueryData<InsertFlow>(
        flowKeys.detail(flowId),
      );

      queryClient.setQueryData(flowKeys.detail(flowId), (old: InsertFlow) => {
        if (!old) return old;

        const optimisticNode = {
          id: nodeId,
          type: NodeType.IF,
          position,
          deletable: false,
          draggable: true,
          data: {},
        };

        // Cache contains persistence data (snake_case with direct nodes/edges)
        return {
          ...old,
          nodes: [...(old.nodes || []), optimisticNode],
          updated_at: new Date(),
        };
      });

      return { previousFlow };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousFlow) {
        queryClient.setQueryData(flowKeys.detail(flowId), context.previousFlow);
      }
    },

    onSuccess: async (data) => {
      const ifNodeId = data.ifNode.id.toString();
      queryClient.setQueryData(ifNodeKeys.detail(ifNodeId), data.ifNode);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ifNodeKeys.detail(ifNodeId),
        }),
      ]);
    },
  });
};
