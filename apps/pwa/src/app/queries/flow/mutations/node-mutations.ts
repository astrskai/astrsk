/**
 * Node Mutation Hooks
 * 
 * Mutations for general node operations (position, label, color)
 * These work on all node types for their common properties
 */

import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FlowService } from "@/app/services/flow-service";
import { Flow, Node } from "@/modules/flow/domain/flow";
import * as optimistic from "../optimistic-updates";
import { flowKeys } from "../query-factory";

/**
 * Hook for updating node position
 * No edit mode needed - positions aren't text fields
 */
export const useUpdateNodePosition = (flowId: string, nodeId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (position: { x: number; y: number }) => {
      const flow = queryClient.getQueryData<Flow>(flowKeys.detail(flowId));
      if (!flow) throw new Error("Flow not found");
      
      const nodes = [...flow.props.nodes];
      const nodeIndex = nodes.findIndex(n => n.id === nodeId);
      if (nodeIndex === -1) throw new Error("Node not found");
      
      nodes[nodeIndex] = { 
        ...nodes[nodeIndex], 
        position 
      };
      
      const updatedFlow = flow.update({ nodes });
      if (updatedFlow.isFailure) {
        throw new Error(updatedFlow.getError());
      }
      
      const saveResult = await FlowService.saveFlow.execute(updatedFlow.getValue());
      if (saveResult.isFailure) {
        throw new Error(saveResult.getError());
      }
      
      return saveResult.getValue();
    },
    
    onMutate: async (position) => {
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.node(flowId, nodeId) 
      });
      
      const previousNode = queryClient.getQueryData(
        flowKeys.node(flowId, nodeId)
      );
      
      optimistic.updateNode(queryClient, flowId, nodeId, (old) => ({
        ...old,
        position
      }));
      
      return { previousNode };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousNode) {
        queryClient.setQueryData(
          flowKeys.node(flowId, nodeId),
          context.previousNode
        );
      }
    },
    
    onSettled: async () => {
      await queryClient.invalidateQueries({ 
        queryKey: flowKeys.node(flowId, nodeId) 
      });
    },
  });
};

/**
 * Hook for updating node label
 * Has edit mode for text field
 */
export const useUpdateNodeLabel = (flowId: string, nodeId: string) => {
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
    mutationFn: async (label: string) => {
      const flow = queryClient.getQueryData<Flow>(flowKeys.detail(flowId));
      if (!flow) throw new Error("Flow not found");
      
      const nodes = [...flow.props.nodes];
      const nodeIndex = nodes.findIndex(n => n.id === nodeId);
      if (nodeIndex === -1) throw new Error("Node not found");
      
      nodes[nodeIndex] = { 
        ...nodes[nodeIndex], 
        data: {
          ...nodes[nodeIndex].data,
          label
        }
      };
      
      const updatedFlow = flow.update({ nodes });
      if (updatedFlow.isFailure) {
        throw new Error(updatedFlow.getError());
      }
      
      const saveResult = await FlowService.saveFlow.execute(updatedFlow.getValue());
      if (saveResult.isFailure) {
        throw new Error(saveResult.getError());
      }
      
      return saveResult.getValue();
    },
    
    onMutate: async (label) => {
      startEditing();
      
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.node(flowId, nodeId) 
      });
      
      const previousNode = queryClient.getQueryData(
        flowKeys.node(flowId, nodeId)
      );
      
      optimistic.updateNode(queryClient, flowId, nodeId, (old) => ({
        ...old,
        data: {
          ...old.data,
          label
        }
      }));
      
      return { previousNode };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousNode) {
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
      
      await queryClient.invalidateQueries({ 
        queryKey: flowKeys.node(flowId, nodeId) 
      });
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

/**
 * Hook for updating node color/theme
 * No edit mode needed - color picker isn't a text field
 */
export const useUpdateNodeColor = (flowId: string, nodeId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (color: string) => {
      const flow = queryClient.getQueryData<Flow>(flowKeys.detail(flowId));
      if (!flow) throw new Error("Flow not found");
      
      const nodes = [...flow.props.nodes];
      const nodeIndex = nodes.findIndex(n => n.id === nodeId);
      if (nodeIndex === -1) throw new Error("Node not found");
      
      nodes[nodeIndex] = { 
        ...nodes[nodeIndex], 
        data: {
          ...nodes[nodeIndex].data,
          color
        }
      };
      
      const updatedFlow = flow.update({ nodes });
      if (updatedFlow.isFailure) {
        throw new Error(updatedFlow.getError());
      }
      
      const saveResult = await FlowService.saveFlow.execute(updatedFlow.getValue());
      if (saveResult.isFailure) {
        throw new Error(saveResult.getError());
      }
      
      return saveResult.getValue();
    },
    
    onMutate: async (color) => {
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.node(flowId, nodeId) 
      });
      
      const previousNode = queryClient.getQueryData(
        flowKeys.node(flowId, nodeId)
      );
      
      optimistic.updateNode(queryClient, flowId, nodeId, (old) => ({
        ...old,
        data: {
          ...old.data,
          color
        }
      }));
      
      return { previousNode };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousNode) {
        queryClient.setQueryData(
          flowKeys.node(flowId, nodeId),
          context.previousNode
        );
      }
    },
    
    onSettled: async () => {
      await queryClient.invalidateQueries({ 
        queryKey: flowKeys.node(flowId, nodeId) 
      });
    },
  });
};

