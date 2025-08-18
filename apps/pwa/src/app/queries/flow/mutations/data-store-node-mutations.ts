/**
 * Data Store Node Mutation Hooks
 * 
 * Mutations for node-level data store field operations
 * Uses targeted node updates to avoid race conditions
 */

import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FlowService } from "@/app/services/flow-service";
import { UniqueEntityID } from "@/shared/domain";
import { DataStoreField } from "@/modules/flow/domain/flow";
import { flowKeys } from "../query-factory";

/**
 * Hook for updating data store fields on a specific node
 * Uses targeted node update to avoid race conditions with other flow fields
 * 
 * @returns mutation with isEditing state for preventing race conditions
 */
export const useUpdateDataStoreNodeFields = (flowId: string, nodeId: string) => {
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
    mutationFn: async (fields: DataStoreField[]) => {
      // Use dedicated method that only updates the node's data store fields
      const result = await FlowService.updateNodeDataStoreFields.execute({
        flowId,
        nodeId,
        fields
      });
      
      if (result.isFailure) {
        throw new Error(result.getError());
      }
      
      return fields;
    },
    
    onMutate: async (fields) => {
      startEditing();
      
      // Cancel any in-flight queries for this node
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.node(flowId, nodeId) 
      });
      
      const previousNode = queryClient.getQueryData(
        flowKeys.node(flowId, nodeId)
      );
      
      // No optimistic update - let the mutation complete
      
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
      
      // Only invalidate the node query - we only changed this specific node
      await queryClient.invalidateQueries({ 
        queryKey: flowKeys.node(flowId, nodeId) 
      });
      
      // Also invalidate the dataStoreRuntime query for this node
      await queryClient.invalidateQueries({ 
        queryKey: flowKeys.dataStoreRuntime(flowId, nodeId) 
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
 * Hook for updating a single field's logic in a node
 * Optimized for frequent text updates with debouncing
 * 
 * @returns mutation with isEditing state for text field updates
 */
export const useUpdateNodeFieldLogic = (flowId: string, nodeId: string) => {
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
    mutationFn: async ({ 
      fieldId, 
      logic 
    }: { 
      fieldId: string; 
      logic: string;
    }) => {
      // Get current node to update the specific field
      const nodeOrError = await FlowService.getNode.execute({
        flowId: new UniqueEntityID(flowId),
        nodeId
      });
      
      if (nodeOrError.isFailure) {
        throw new Error(nodeOrError.getError());
      }
      
      const node = nodeOrError.getValue();
      const nodeData = node.data as any;
      const currentFields = nodeData?.dataStoreFields || [];
      
      // Update the specific field's logic
      const updatedFields = currentFields.map((f: DataStoreField) =>
        f.schemaFieldId === fieldId
          ? { ...f, logic }
          : f
      );
      
      // Save using the targeted node update
      const result = await FlowService.updateNodeDataStoreFields.execute({
        flowId,
        nodeId,
        fields: updatedFields
      });
      
      if (result.isFailure) {
        throw new Error(result.getError());
      }
      
      return { fieldId, logic };
    },
    
    onMutate: async ({ fieldId, logic }) => {
      startEditing();
      
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.node(flowId, nodeId) 
      });
      
      const previousNode = queryClient.getQueryData(
        flowKeys.node(flowId, nodeId)
      );
      
      // No optimistic update for logic changes
      
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
      
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: flowKeys.node(flowId, nodeId) 
        }),
        queryClient.invalidateQueries({ 
          queryKey: flowKeys.dataStoreRuntime(flowId, nodeId) 
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