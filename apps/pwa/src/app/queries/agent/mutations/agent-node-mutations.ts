import { useState, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AgentService } from "@/app/services/agent-service";
import { agentQueries } from "@/app/queries/agent-queries";
import { flowQueries } from "@/app/queries/flow-queries";
import { UniqueEntityID } from "@/shared/domain";

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
      await queryClient.cancelQueries({ queryKey: agentQueries.name(agentId).queryKey });
      
      // Optimistically update the cache
      const previousName = queryClient.getQueryData(agentQueries.name(agentId).queryKey);
      queryClient.setQueryData(agentQueries.name(agentId).queryKey, { name });
      
      return { previousName };
    },
    onError: (err, name, context) => {
      // Revert optimistic update on error
      if (context?.previousName) {
        queryClient.setQueryData(agentQueries.name(agentId).queryKey, context.previousName);
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
        queryClient.invalidateQueries({ queryKey: agentQueries.name(agentId).queryKey });
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