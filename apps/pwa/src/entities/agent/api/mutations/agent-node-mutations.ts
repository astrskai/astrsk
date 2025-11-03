import { useState, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AgentService } from "@/app/services/agent-service";
import { agentKeys } from "@/entities/agent/api/query-factory";

/**
 * Hook for updating agent name with isEditing flag
 * Prevents refetching during typing
 */
export function useUpdateAgentName(agentId: string) {
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
      const result = await AgentService.updateAgentName.execute({
        agentId,
        name,
      });
      if (result.isFailure) {
        throw new Error(result.getError());
      }
    },
    onMutate: async (name) => {
      startEditing();
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: agentKeys.name(agentId) });
      
      // Optimistically update the cache
      const previousName = queryClient.getQueryData(agentKeys.name(agentId));
      queryClient.setQueryData(agentKeys.name(agentId), { name });
      
      return { previousName };
    },
    onError: (_err, _name, context) => {
      // Revert optimistic update on error
      if (context?.previousName) {
        queryClient.setQueryData(agentKeys.name(agentId), context.previousName);
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
        queryClient.invalidateQueries({ queryKey: agentKeys.name(agentId) });
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