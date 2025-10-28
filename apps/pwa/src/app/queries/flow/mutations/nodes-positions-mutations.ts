/**
 * Batch Node Position Mutation Hook
 * 
 * For updating multiple node positions at once (e.g., after dragging)
 * Note: Position changes do NOT update flow ready state to Draft
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FlowService } from "@/app/services/flow-service";
import { UniqueEntityID } from "@/shared/domain";
import { flowKeys } from "../query-factory";

interface NodePositionUpdate {
  nodeId: string;
  position: { x: number; y: number };
}

/**
 * Hook for updating multiple node positions in a single transaction
 * Used after drag operations to save final positions
 */
export const useUpdateNodesPositions = (flowId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (positions: NodePositionUpdate[]) => {
      const result = await FlowService.updateNodesPositions.execute({
        flowId: new UniqueEntityID(flowId),
        positions
      });
      
      if (result.isFailure) {
        throw new Error(result.getError());
      }
      
      // Note: We intentionally do NOT update flow ready state for position changes
      // Position/viewport changes are considered UI state, not content changes
      
      return; // updateNodesPositions returns Result<void>, so no value to return
    },
    
    onMutate: async (positions) => {
      // Cancel queries to prevent race conditions
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.nodes(flowId) 
      });
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.detail(flowId) 
      });
      
      // Save previous state for rollback
      const previousNodes = queryClient.getQueryData(
        flowKeys.nodes(flowId)
      );
      const previousFlow = queryClient.getQueryData(
        flowKeys.detail(flowId)
      );
      
      // Optimistically update ONLY node positions - preserve all other data
      queryClient.setQueryData(flowKeys.nodes(flowId), (oldNodes: any) => {
        if (!oldNodes) return oldNodes;
        return oldNodes.map((node: any) => {
          const update = positions.find(p => p.nodeId === node.id);
          if (update) {
            // IMPORTANT: Only update position to avoid overwriting recent changes
            return {
              ...node,
              position: update.position
            };
          }
          return node;
        });
      });
      
      // Also update in flow detail - ONLY update positions
      // Cache contains persistence format (InsertFlow), not domain format
      queryClient.setQueryData(flowKeys.detail(flowId), (old: any) => {
        if (!old || !old.nodes) return old;
        const updatedNodes = old.nodes.map((node: any) => {
          const update = positions.find(p => p.nodeId === node.id);
          if (update) {
            // IMPORTANT: Only update position to avoid overwriting recent changes
            return {
              ...node,
              position: update.position
            };
          }
          return node;
        });
        return {
          ...old,
          nodes: updatedNodes,
          updated_at: new Date(),
          // created_at preserved through ...old spread
          // Note: NOT updating ready_state - position changes don't affect it
        };
      });
      
      // Update individual node queries - ONLY update positions
      positions.forEach(({ nodeId, position }) => {
        queryClient.setQueryData(flowKeys.node(flowId, nodeId), (old: any) => {
          if (!old) return old;
          // IMPORTANT: Only update position to avoid overwriting recent changes
          return {
            ...old,
            position
          };
        });
      });
      
      return { previousNodes, previousFlow };
    },
    
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousNodes) {
        queryClient.setQueryData(
          flowKeys.nodes(flowId),
          context.previousNodes
        );
      }
      if (context?.previousFlow) {
        queryClient.setQueryData(
          flowKeys.detail(flowId),
          context.previousFlow
        );
      }
      
      // Rollback individual node queries
      variables.forEach(({ nodeId }) => {
        queryClient.invalidateQueries({
          queryKey: flowKeys.node(flowId, nodeId)
        });
      });
    },
    
    onSuccess: () => {
      // Invalidate flow detail to ensure flowRef.current gets updated with fresh positions
      // The optimistic update handles immediate UI, invalidation ensures data consistency
      queryClient.invalidateQueries({ queryKey: flowKeys.detail(flowId) });
      
      // Also invalidate individual node queries for updated nodes
      queryClient.invalidateQueries({ 
        queryKey: [...flowKeys.all, flowId, "node"],
        exact: false
      });
    }
  });
};