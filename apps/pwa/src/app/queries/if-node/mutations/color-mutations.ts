import { useState, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IfNodeService } from "@/app/services/if-node-service";
import { ifNodeKeys } from "../query-factory";

/**
 * Hook for updating if node color with isEditing flag
 * Prevents refetching during editing
 */
export function useUpdateIfNodeColor(flowId: string, nodeId: string) {
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
      const result = await IfNodeService.updateIfNodeColor.execute({
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
      await queryClient.cancelQueries({ queryKey: ifNodeKeys.color(flowId, nodeId) });
      
      // Optimistically update the cache
      const previousColor = queryClient.getQueryData(ifNodeKeys.color(flowId, nodeId));
      queryClient.setQueryData(ifNodeKeys.color(flowId, nodeId), { color });
      
      return { previousColor };
    },
    onError: (err, color, context) => {
      // Revert optimistic update on error
      if (context?.previousColor) {
        queryClient.setQueryData(ifNodeKeys.color(flowId, nodeId), context.previousColor);
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
        queryClient.invalidateQueries({ queryKey: ifNodeKeys.color(flowId, nodeId) });
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