/**
 * If Node Mutation Hooks
 * 
 * Mutations for If node condition operations
 */

import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FlowService } from "@/app/services/flow-service";
import { IfCondition } from "@/features/flow/nodes/if-node";
import { ConditionDataType, ConditionOperator } from "@/features/flow/types/condition-types";
import { flowKeys } from "../query-factory";
import { Flow, ReadyState } from "@/entities/flow/domain/flow";

// Type for conditions that may be incomplete (during editing)
export interface EditableCondition {
  id: string;
  dataType: ConditionDataType | null;
  value1: string;
  operator: ConditionOperator | null;
  value2: string;
}

/**
 * Hook for updating all conditions at once (batch update)
 * Used when multiple conditions change together
 */
export const useUpdateIfNodeConditions = (flowId: string, nodeId: string) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const editEndTimerRef = useRef<NodeJS.Timeout>();
  
  const endEditing = useCallback(() => {
    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }
    editEndTimerRef.current = setTimeout(() => {
      setIsEditing(false);
    }, 500);
  }, []);
  
  const startEditing = useCallback(() => {
    setIsEditing(true);
    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }
  }, []);
  
  const mutation = useMutation({
    mutationKey: [`node-${nodeId}`, 'conditions'],
    mutationFn: async (data: {
      conditions: IfCondition[]; // Valid conditions (complete, ready for evaluation)
      draftConditions: EditableCondition[]; // All conditions including incomplete ones
      logicOperator: 'AND' | 'OR';
    }) => {
      
      // Use the dedicated service method that only updates the if-node
      const result = await FlowService.updateIfNodeConditions.execute({
        flowId,
        nodeId,
        conditions: data.conditions,
        draftConditions: data.draftConditions,
        logicOperator: data.logicOperator
      });
      
      if (result.isFailure) {
        throw new Error(result.getError());
      }
      
      // Update flow ready state to Draft if it's Ready
      const flow = queryClient.getQueryData<Flow>(flowKeys.detail(flowId));
      if (flow && flow.props && flow.props.readyState === ReadyState.Ready) {
        await FlowService.updateFlowReadyState.execute({
          flowId,
          readyState: ReadyState.Draft
        });
      }
      
      return data;
    },
    
    onMutate: async (data) => {
      startEditing();
      
      // Cancel any in-flight queries for this node and flow
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.node(flowId, nodeId) 
      });
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.detail(flowId) 
      });
      
      // DON'T cancel the nodes query - we need it!
      // await queryClient.cancelQueries({ 
      //   queryKey: flowKeys.nodes(flowId) 
      // });
      
      const previousNode = queryClient.getQueryData(
        flowKeys.node(flowId, nodeId)
      );
      const previousFlow = queryClient.getQueryData(
        flowKeys.detail(flowId)
      );
      
      // Check for other pending mutations on this node
      const mutations = queryClient.getMutationCache().getAll();
      const hasPendingNodeMutations = mutations.some(
        m => m.state.status === 'pending' && 
             m.options.mutationKey?.includes(`node-${nodeId}`)
      );
      
      if (hasPendingNodeMutations) {
        // Skip optimistic update to avoid conflicts
        return { previousNode, previousFlow, skipOptimistic: true };
      }
      
      // Optimistic update for immediate UI feedback
      const nodeKey = flowKeys.node(flowId, nodeId);
      
      queryClient.setQueryData(nodeKey, (old: any) => {
        if (!old) {
          return old;
        }
        return {
          ...old,
          data: {
            ...old.data,
            conditions: data.conditions,
            draftConditions: data.draftConditions,
            logicOperator: data.logicOperator
          }
        };
      });
      
      // IMPORTANT: The nodes query is never subscribed to, so its cache doesn't exist!
      // We need to update the flow detail cache instead, which is what's actually used
      
      // Also update the flow detail optimistically
      // Cache contains persistence format (InsertFlow), not domain format
      queryClient.setQueryData(flowKeys.detail(flowId), (old: any) => {
        if (!old || !old.nodes) return old;

        const updatedNodes = old.nodes.map((node: any) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                conditions: data.conditions,
                draftConditions: data.draftConditions,
                logicOperator: data.logicOperator
              }
            };
          }
          return node;
        });

        return {
          ...old,
          nodes: updatedNodes,
          ready_state: old.ready_state === ReadyState.Ready ? ReadyState.Draft : old.ready_state,
          updated_at: new Date()
        };
      });
      
      return { previousNode, previousFlow };
    },
    
    onError: (err, variables, context) => {
      // Skip rollback if we skipped optimistic update
      if (context?.skipOptimistic) {
        setIsEditing(false);
        if (editEndTimerRef.current) {
          clearTimeout(editEndTimerRef.current);
        }
        return;
      }
      
      // Rollback optimistic updates
      if (context?.previousNode) {
        queryClient.setQueryData(
          flowKeys.node(flowId, nodeId),
          context.previousNode
        );
      }
      if (context?.previousFlow) {
        queryClient.setQueryData(
          flowKeys.detail(flowId),
          context.previousFlow
        );
      }
      
      setIsEditing(false);
      if (editEndTimerRef.current) {
        clearTimeout(editEndTimerRef.current);
      }
    },
    
    onSettled: async (data, error) => {
      if (!error) {
        endEditing();
      }
      
      // Invalidate specific node query immediately
      await queryClient.invalidateQueries({ 
        queryKey: flowKeys.node(flowId, nodeId)
      });
      
      // Delay flow detail invalidation to ensure DB write completes
      setTimeout(async () => {
        await queryClient.invalidateQueries({ 
          queryKey: flowKeys.detail(flowId),
          refetchType: 'active' // Actually refetch to get the updated data from server
        });
      }, 500); // 500ms delay to ensure DB write completes
    },
  });
  
  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isEditing,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};