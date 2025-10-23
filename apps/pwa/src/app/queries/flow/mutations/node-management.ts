/**
 * Individual Node and Edge Management Mutation Hooks
 * 
 * Provides individual CRUD operations for nodes and edges using the operation processor pattern.
 * Integrates with existing batch operations and maintains optimistic updates.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { flowKeys } from "../query-factory";
import { processOperation } from "@/features/vibe/lib/operation-processors/operation-processor-factory";
import { NodeType } from "@/flow-multi/types/node-types";
import { Flow, ReadyState } from "@/modules/flow/domain/flow";
import { FlowService } from "@/app/services/flow-service";

export interface AddNodeRequest {
  nodeType: NodeType;
  position: { x: number; y: number };
  data: Record<string, any> & {
    id?: string; // UUID provided by analysis agent (backend converts simple ID to UUID)
    nodeId?: string; // Alternative field for UUID
    name?: string;
    description?: string;
    zIndex?: number;
    // Node-specific data based on type
  };
}

export interface RemoveNodeRequest {
  nodeId: string;
}

export interface AddEdgeRequest {
  source: string; // UUID from analysis agent
  target: string; // UUID from analysis agent
  label?: string;
  id?: string; // Optional UUID for edge
}

export interface RemoveEdgeRequest {
  edgeId: string;
}

/**
 * Hook for adding a single node to a flow
 * Uses operation processor pattern with transaction safety
 */
export const useAddNode = (flowId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: [`flow-${flowId}`, 'add-node'],
    mutationFn: async ({ nodeType, position, data }: AddNodeRequest) => {
      // Get current flow
      const flow = queryClient.getQueryData<Flow>(flowKeys.detail(flowId));
      if (!flow) {
        throw new Error('Flow not found');
      }
      
      // Use operation processor to add node with transaction safety
      const result = await processOperation({
        path: 'flow.nodes',
        operation: 'put',
        value: { nodeType, position, data },
        pathParts: ['flow', 'nodes'],
        resource: {
          id: flowId,
          nodes: [...(flow.props.nodes || [])],
          edges: [...(flow.props.edges || [])]
        },
        flowId
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add node');
      }
      
      return result.result;
    },
    
    onMutate: async ({ nodeType, position, data }) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: flowKeys.detail(flowId) });
      await queryClient.cancelQueries({ queryKey: flowKeys.nodes(flowId) });
      
      // Get previous flow for rollback
      const previousFlow = queryClient.getQueryData(flowKeys.detail(flowId));
      const previousNodes = queryClient.getQueryData(flowKeys.nodes(flowId));
      
      // Extract predetermined ID from analysis agent
      const predeterminedId = data.id || data.nodeId || `temp-node-${Date.now()}`;
      
      // Optimistically update flow detail
      queryClient.setQueryData(flowKeys.detail(flowId), (old: any) => {
        if (!old) return old;
        
        const newNode = {
          id: predeterminedId,
          type: nodeType,
          position,
          // System-managed fields are handled by the system
          deletable: false, // System sets to false for all nodes
          draggable: true, // System sets to true for all nodes
          zIndex: data.zIndex || undefined,
          data: {
            ...data,
            [`${nodeType}Id`]: predeterminedId
          }
        };
        
        const updatedNodes = [...(old.props.nodes || []), newNode];
        
        return {
          ...old,
          props: {
            ...old.props,
            nodes: updatedNodes,
            readyState: old.props.readyState === ReadyState.Ready ? ReadyState.Draft : old.props.readyState,
            updatedAt: new Date()
          }
        };
      });
      
      // Optimistically update nodes query
      queryClient.setQueryData(flowKeys.nodes(flowId), (old: any) => {
        if (!old) return [];
        const newNode = {
          id: predeterminedId,
          type: nodeType,
          position,
          deletable: false,
          draggable: true,
          zIndex: data.zIndex || undefined,
          data: {
            ...data,
            [`${nodeType}Id`]: predeterminedId
          }
        };
        return [...old, newNode];
      });
      
      return { previousFlow, previousNodes };
    },
    
    onError: (err, variables, context) => {
      console.error('[ADD_NODE] Mutation error - rolling back', err);
      
      // Rollback on error
      if (context?.previousFlow) {
        queryClient.setQueryData(flowKeys.detail(flowId), context.previousFlow);
      }
      if (context?.previousNodes) {
        queryClient.setQueryData(flowKeys.nodes(flowId), context.previousNodes);
      }
    },
    
    onSuccess: async (data, variables) => {
      // Update flow ready state if needed
      const flow = queryClient.getQueryData<Flow>(flowKeys.detail(flowId));
      if (flow && flow.props.readyState === ReadyState.Ready) {
        await FlowService.updateFlowReadyState.execute({
          flowId,
          readyState: ReadyState.Draft
        });
      }
      
      // Invalidate related queries after successful mutation
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: flowKeys.detail(flowId) }),
        queryClient.invalidateQueries({ queryKey: flowKeys.nodes(flowId) }),
        queryClient.invalidateQueries({ queryKey: flowKeys.validation(flowId) })
      ]);
    }
  });
};

/**
 * Hook for removing a single node from a flow
 * Uses operation processor pattern with automatic edge cleanup
 */
export const useRemoveNode = (flowId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: [`flow-${flowId}`, 'remove-node'],
    mutationFn: async ({ nodeId }: RemoveNodeRequest) => {
      // Get current flow
      const flow = queryClient.getQueryData<Flow>(flowKeys.detail(flowId));
      if (!flow) {
        throw new Error('Flow not found');
      }
      
      // Find node index for removal
      const nodeIndex = flow.props.nodes.findIndex((n: any) => n.id === nodeId);
      if (nodeIndex === -1) {
        throw new Error('Node not found');
      }
      
      // Use operation processor to remove node with transaction safety
      const result = await processOperation({
        path: `flow.nodes[${nodeIndex}]`,
        operation: 'remove',
        pathParts: ['flow', 'nodes', nodeIndex.toString()],
        resource: {
          id: flowId,
          nodes: [...flow.props.nodes],
          edges: [...(flow.props.edges || [])]
        },
        flowId
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to remove node');
      }
      
      return result.result;
    },
    
    onMutate: async ({ nodeId }) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: flowKeys.detail(flowId) });
      await queryClient.cancelQueries({ queryKey: flowKeys.nodes(flowId) });
      await queryClient.cancelQueries({ queryKey: flowKeys.edges(flowId) });
      
      // Get previous values for rollback
      const previousFlow = queryClient.getQueryData(flowKeys.detail(flowId));
      const previousNodes = queryClient.getQueryData(flowKeys.nodes(flowId));
      const previousEdges = queryClient.getQueryData(flowKeys.edges(flowId));
      
      // Optimistically update flow detail
      queryClient.setQueryData(flowKeys.detail(flowId), (old: any) => {
        if (!old) return old;
        
        const updatedNodes = old.props.nodes.filter((n: any) => n.id !== nodeId);
        const updatedEdges = (old.props.edges || []).filter((e: any) => 
          e.source !== nodeId && e.target !== nodeId
        );
        
        return {
          ...old,
          props: {
            ...old.props,
            nodes: updatedNodes,
            edges: updatedEdges,
            readyState: old.props.readyState === ReadyState.Ready ? ReadyState.Draft : old.props.readyState,
            updatedAt: new Date()
          }
        };
      });
      
      // Optimistically update nodes query
      queryClient.setQueryData(flowKeys.nodes(flowId), (old: any) => {
        if (!old) return [];
        return old.filter((n: any) => n.id !== nodeId);
      });
      
      // Optimistically update edges query
      queryClient.setQueryData(flowKeys.edges(flowId), (old: any) => {
        if (!old) return [];
        return old.filter((e: any) => e.source !== nodeId && e.target !== nodeId);
      });
      
      return { previousFlow, previousNodes, previousEdges };
    },
    
    onError: (err, variables, context) => {
      console.error('[REMOVE_NODE] Mutation error - rolling back', err);
      
      // Rollback on error
      if (context?.previousFlow) {
        queryClient.setQueryData(flowKeys.detail(flowId), context.previousFlow);
      }
      if (context?.previousNodes) {
        queryClient.setQueryData(flowKeys.nodes(flowId), context.previousNodes);
      }
      if (context?.previousEdges) {
        queryClient.setQueryData(flowKeys.edges(flowId), context.previousEdges);
      }
    },
    
    onSuccess: async (data, variables) => {
      // Update flow ready state if needed
      const flow = queryClient.getQueryData<Flow>(flowKeys.detail(flowId));
      if (flow && flow.props.readyState === ReadyState.Ready) {
        await FlowService.updateFlowReadyState.execute({
          flowId,
          readyState: ReadyState.Draft
        });
      }
      
      // Invalidate related queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: flowKeys.detail(flowId) }),
        queryClient.invalidateQueries({ queryKey: flowKeys.nodes(flowId) }),
        queryClient.invalidateQueries({ queryKey: flowKeys.edges(flowId) }),
        queryClient.invalidateQueries({ queryKey: flowKeys.validation(flowId) })
      ]);
    }
  });
};

/**
 * Hook for adding a single edge to a flow
 * Uses operation processor pattern with duplicate prevention
 */
export const useAddEdge = (flowId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: [`flow-${flowId}`, 'add-edge'],
    mutationFn: async ({ source, target, label, id }: AddEdgeRequest) => {
      // Get current flow
      const flow = queryClient.getQueryData<Flow>(flowKeys.detail(flowId));
      if (!flow) {
        throw new Error('Flow not found');
      }
      
      // Use operation processor to add edge
      const result = await processOperation({
        path: 'flow.edges',
        operation: 'put',
        value: { source, target, label, id },
        pathParts: ['flow', 'edges'],
        resource: {
          id: flowId,
          nodes: [...(flow.props.nodes || [])],
          edges: [...(flow.props.edges || [])]
        },
        flowId
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add edge');
      }
      
      return result.result;
    },
    
    onMutate: async ({ source, target, label, id }) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: flowKeys.detail(flowId) });
      await queryClient.cancelQueries({ queryKey: flowKeys.edges(flowId) });
      
      // Get previous values for rollback
      const previousFlow = queryClient.getQueryData(flowKeys.detail(flowId));
      const previousEdges = queryClient.getQueryData(flowKeys.edges(flowId));
      
      const edgeId = id || `edge-${source}-${target}-${Date.now()}`;
      
      // Optimistically update flow detail
      queryClient.setQueryData(flowKeys.detail(flowId), (old: any) => {
        if (!old) return old;
        
        // Check for duplicate edges
        const existingEdge = (old.props.edges || []).find((e: any) => 
          e.source === source && e.target === target
        );
        
        if (existingEdge) {
          return old; // Don't add duplicate
        }
        
        const newEdge = {
          id: edgeId,
          source,
          target,
          label,
          type: 'default'
          // sourceHandle and targetHandle are system-managed
        };
        
        const updatedEdges = [...(old.props.edges || []), newEdge];
        
        return {
          ...old,
          props: {
            ...old.props,
            edges: updatedEdges,
            readyState: old.props.readyState === ReadyState.Ready ? ReadyState.Draft : old.props.readyState,
            updatedAt: new Date()
          }
        };
      });
      
      // Optimistically update edges query
      queryClient.setQueryData(flowKeys.edges(flowId), (old: any) => {
        if (!old) return [];
        
        // Check for duplicate
        const existingEdge = old.find((e: any) => e.source === source && e.target === target);
        if (existingEdge) {
          return old;
        }
        
        const newEdge = {
          id: edgeId,
          source,
          target,
          label,
          type: 'default'
        };
        return [...old, newEdge];
      });
      
      return { previousFlow, previousEdges };
    },
    
    onError: (err, variables, context) => {
      console.error('[ADD_EDGE] Mutation error - rolling back', err);
      
      // Rollback on error
      if (context?.previousFlow) {
        queryClient.setQueryData(flowKeys.detail(flowId), context.previousFlow);
      }
      if (context?.previousEdges) {
        queryClient.setQueryData(flowKeys.edges(flowId), context.previousEdges);
      }
    },
    
    onSuccess: async (data, variables) => {
      // Invalidate related queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: flowKeys.detail(flowId) }),
        queryClient.invalidateQueries({ queryKey: flowKeys.edges(flowId) }),
        queryClient.invalidateQueries({ queryKey: flowKeys.validation(flowId) })
      ]);
    }
  });
};

/**
 * Hook for removing a single edge from a flow
 * Uses operation processor pattern
 */
export const useRemoveEdge = (flowId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: [`flow-${flowId}`, 'remove-edge'],
    mutationFn: async ({ edgeId }: RemoveEdgeRequest) => {
      // Get current flow
      const flow = queryClient.getQueryData<Flow>(flowKeys.detail(flowId));
      if (!flow) {
        throw new Error('Flow not found');
      }
      
      // Find edge index for removal
      const edgeIndex = (flow.props.edges || []).findIndex((e: any) => e.id === edgeId);
      if (edgeIndex === -1) {
        throw new Error('Edge not found');
      }
      
      // Use operation processor to remove edge
      const result = await processOperation({
        path: `flow.edges[${edgeIndex}]`,
        operation: 'remove',
        pathParts: ['flow', 'edges', edgeIndex.toString()],
        resource: {
          id: flowId,
          nodes: [...(flow.props.nodes || [])],
          edges: [...(flow.props.edges || [])]
        },
        flowId
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to remove edge');
      }
      
      return result.result;
    },
    
    onMutate: async ({ edgeId }) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: flowKeys.detail(flowId) });
      await queryClient.cancelQueries({ queryKey: flowKeys.edges(flowId) });
      
      // Get previous values for rollback
      const previousFlow = queryClient.getQueryData(flowKeys.detail(flowId));
      const previousEdges = queryClient.getQueryData(flowKeys.edges(flowId));
      
      // Optimistically update flow detail
      queryClient.setQueryData(flowKeys.detail(flowId), (old: any) => {
        if (!old) return old;
        
        const updatedEdges = (old.props.edges || []).filter((e: any) => e.id !== edgeId);
        
        return {
          ...old,
          props: {
            ...old.props,
            edges: updatedEdges,
            readyState: old.props.readyState === ReadyState.Ready ? ReadyState.Draft : old.props.readyState,
            updatedAt: new Date()
          }
        };
      });
      
      // Optimistically update edges query
      queryClient.setQueryData(flowKeys.edges(flowId), (old: any) => {
        if (!old) return [];
        return old.filter((e: any) => e.id !== edgeId);
      });
      
      return { previousFlow, previousEdges };
    },
    
    onError: (err, variables, context) => {
      console.error('[REMOVE_EDGE] Mutation error - rolling back', err);
      
      // Rollback on error
      if (context?.previousFlow) {
        queryClient.setQueryData(flowKeys.detail(flowId), context.previousFlow);
      }
      if (context?.previousEdges) {
        queryClient.setQueryData(flowKeys.edges(flowId), context.previousEdges);
      }
    },
    
    onSuccess: async (data, variables) => {
      // Invalidate related queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: flowKeys.detail(flowId) }),
        queryClient.invalidateQueries({ queryKey: flowKeys.edges(flowId) }),
        queryClient.invalidateQueries({ queryKey: flowKeys.validation(flowId) })
      ]);
    }
  });
};