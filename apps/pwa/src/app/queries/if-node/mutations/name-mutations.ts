import { useState, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IfNodeService } from "@/app/services/if-node-service";
import { ifNodeKeys } from "../query-factory";

/**
 * Hook for updating if node name with isEditing flag
 * Prevents refetching during typing
 */
export function useUpdateIfNodeName(flowId: string, nodeId: string) {
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
    mutationFn: async (name: string) => {
      const result = await IfNodeService.updateIfNodeName.execute({
        flowId,
        nodeId,
        name,
      });
      if (result.isFailure) {
        throw new Error(result.getError());
      }
    },
    onMutate: async (name) => {
      startEditing();
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ifNodeKeys.name(flowId, nodeId) });
      
      // Optimistically update the cache
      const previousName = queryClient.getQueryData(ifNodeKeys.name(flowId, nodeId));
      queryClient.setQueryData(ifNodeKeys.name(flowId, nodeId), { name });
      
      return { previousName };
    },
    onError: (err, name, context) => {
      // Revert optimistic update on error
      if (context?.previousName) {
        queryClient.setQueryData(ifNodeKeys.name(flowId, nodeId), context.previousName);
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
        queryClient.invalidateQueries({ queryKey: ifNodeKeys.name(flowId, nodeId) });
        // Also invalidate detail query to keep it in sync
        queryClient.invalidateQueries({ queryKey: ifNodeKeys.detail(flowId, nodeId) });
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