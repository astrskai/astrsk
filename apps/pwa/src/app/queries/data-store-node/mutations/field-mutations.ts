import { useState, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DataStoreNodeService } from "@/app/services/data-store-node-service";
import { dataStoreNodeKeys } from "../query-factory";
import { DataStoreField } from "@/modules/flow/domain/flow";

/**
 * Hook for updating data store node fields with isEditing flag
 * Prevents refetching during editing
 */
export function useUpdateDataStoreNodeFields(flowId: string, nodeId: string) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const editTimeoutRef = useRef<NodeJS.Timeout>();

  const startEditing = useCallback(() => {
    setIsEditing(true);
    if (editTimeoutRef.current) {
      clearTimeout(editTimeoutRef.current);
    }
  }, []);

  const endEditing = useCallback(() => {
    if (editTimeoutRef.current) {
      clearTimeout(editTimeoutRef.current);
    }
    // Add delay before allowing refetch to prevent flicker
    editTimeoutRef.current = setTimeout(() => {
      setIsEditing(false);
    }, 500);
  }, []);

  const mutation = useMutation({
    mutationFn: async (fields: DataStoreField[]) => {
      const result = await DataStoreNodeService.updateDataStoreNodeFields.execute({
        flowId,
        nodeId,
        fields,
      });
      
      if (result.isFailure) {
        throw new Error(result.getError());
      }
    },
    onMutate: async (fields) => {
      startEditing();
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: dataStoreNodeKeys.fields(flowId, nodeId) });
      
      // Optimistically update the cache
      const previousFields = queryClient.getQueryData(dataStoreNodeKeys.fields(flowId, nodeId));
      queryClient.setQueryData(dataStoreNodeKeys.fields(flowId, nodeId), { fields });
      
      return { previousFields };
    },
    onError: (err, fields, context) => {
      // Revert optimistic update on error
      if (context?.previousFields) {
        queryClient.setQueryData(dataStoreNodeKeys.fields(flowId, nodeId), context.previousFields);
      }
      setIsEditing(false);
      if (editTimeoutRef.current) {
        clearTimeout(editTimeoutRef.current);
      }
    },
    onSettled: () => {
      endEditing();
      // Invalidate to ensure consistency after delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: dataStoreNodeKeys.fields(flowId, nodeId) });
        // Also invalidate detail query to keep it in sync
        queryClient.invalidateQueries({ queryKey: dataStoreNodeKeys.detail(flowId, nodeId) });
      }, 600);
    },
  });

  return {
    ...mutation,
    isEditing,
    setIsEditing,
    startEditing,
    endEditing,
  };
}