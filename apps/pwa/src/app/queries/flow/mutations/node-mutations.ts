/**
 * Node Mutation Hooks
 * 
 * Mutations for general node operations (title, data, etc.)
 * Uses targeted node updates to avoid race conditions
 */

import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FlowService } from "@/app/services/flow-service";
import { flowKeys } from "../query-factory";
import { Flow, ReadyState } from "@/entities/flow/domain/flow";

/**
 * Hook for updating a node's title/label
 * Uses targeted node update to avoid race conditions with other flow fields
 * 
 * @returns mutation with isEditing state for preventing race conditions
 */
export const useUpdateNodeTitle = (flowId: string, nodeId: string) => {
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
    mutationFn: async (title: string) => {
      // Get current node data first
      const currentNode = queryClient.getQueryData<any>(
        flowKeys.node(flowId, nodeId)
      );
      
      if (!currentNode) {
        throw new Error("Node not found");
      }
      
      // Update the node's data with new title
      const updatedNodeData = {
        ...currentNode.data,
        label: title
      };
      
      // Use dedicated method that only updates the node's data
      const result = await FlowService.updateNode.execute({
        flowId,
        nodeId,
        nodeData: updatedNodeData
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
      
      return title;
    },
    
    onMutate: async (title) => {
      startEditing();
      
      // Cancel any in-flight queries for this node
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.node(flowId, nodeId) 
      });
      
      const previousNode = queryClient.getQueryData(
        flowKeys.node(flowId, nodeId)
      );
      
      // Optimistic update
      if (previousNode) {
        queryClient.setQueryData(
          flowKeys.node(flowId, nodeId),
          (old: any) => ({
            ...old,
            data: {
              ...old.data,
              label: title
            }
          })
        );
      }
      
      return { previousNode };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousNode !== undefined) {
        queryClient.setQueryData(
          flowKeys.node(flowId, nodeId),
          context.previousNode
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
      
      // Invalidate all queries that contain this node's data
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: flowKeys.node(flowId, nodeId) // Specific node
        }),
        queryClient.invalidateQueries({ 
          queryKey: flowKeys.nodes(flowId) // All nodes array
        }),
        queryClient.invalidateQueries({ 
          queryKey: flowKeys.detail(flowId) // Full flow detail
        })
      ]);
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