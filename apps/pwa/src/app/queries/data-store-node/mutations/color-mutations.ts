import { useState, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DataStoreNodeService } from "@/app/services/data-store-node-service";
import { dataStoreNodeKeys } from "../query-factory";

/**
 * Hook for updating data store node color with isEditing flag
 * Prevents refetching during editing
 */
export function useUpdateDataStoreNodeColor(flowId: string, nodeId: string) {
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
    mutationFn: async (color: string) => {
      const result = await DataStoreNodeService.updateDataStoreNodeColor.execute({
        flowId,
        nodeId,
        color,
      });
      if (result.isFailure) {
        throw new Error(result.getError());
      }
    },
    onMutate: async (color) => {
      startEditing();
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: dataStoreNodeKeys.color(flowId, nodeId) });
      
      // Optimistically update the cache
      const previousColor = queryClient.getQueryData(dataStoreNodeKeys.color(flowId, nodeId));
      queryClient.setQueryData(dataStoreNodeKeys.color(flowId, nodeId), { color });
      
      return { previousColor };
    },
    onError: (err, color, context) => {
      // Revert optimistic update on error
      if (context?.previousColor) {
        queryClient.setQueryData(dataStoreNodeKeys.color(flowId, nodeId), context.previousColor);
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
        queryClient.invalidateQueries({ queryKey: dataStoreNodeKeys.color(flowId, nodeId) });
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