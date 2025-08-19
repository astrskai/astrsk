/**
 * Data Store Mutation Hooks
 * 
 * Mutations for data store schema operations
 */

import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FlowService } from "@/app/services/flow-service";
import { DataStoreSchema } from "@/modules/flow/domain/flow";
import { flowKeys } from "../query-factory";

/**
 * Hook for updating the entire data store schema
 * Use this for batch updates to avoid multiple saves
 * 
 * @returns mutation with isEditing state for preventing race conditions
 */
export const useUpdateDataStoreSchema = (flowId: string) => {
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
    mutationFn: async (schema: DataStoreSchema) => {
      // Use dedicated method that only updates the data store schema
      // This avoids race conditions where we might overwrite other fields
      const result = await FlowService.updateDataStoreSchema.execute({
        flowId,
        schema
      });
      
      if (result.isFailure) {
        throw new Error(result.getError());
      }
      
      return schema;
    },
    
    onMutate: async (schema) => {
      startEditing();
      
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.dataStoreSchema(flowId) 
      });
      
      const previousSchema = queryClient.getQueryData(
        flowKeys.dataStoreSchema(flowId)
      );
      
      // No optimistic update - let the mutation complete
      
      return { previousSchema };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousSchema !== undefined) {
        queryClient.setQueryData(
          flowKeys.dataStoreSchema(flowId),
          context.previousSchema
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
      
      // Only invalidate the data store schema query - we only changed the schema
      await queryClient.invalidateQueries({ queryKey: flowKeys.dataStoreSchema(flowId) });
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