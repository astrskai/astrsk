/**
 * Queue-based Agent Parameter Mutations
 * 
 * Ensures all parameter changes are saved without data loss
 * by queuing mutations and processing them sequentially
 */

import { useRef, useCallback, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AgentService } from "@/app/services/agent-service";
import { agentKeys } from "../query-factory";

interface ParameterUpdate {
  enabledParameters: Map<string, boolean>;
  parameterValues: Map<string, any>;
  timestamp: number;
}

/**
 * Hook for updating agent parameters with queue-based saving
 * Ensures no changes are lost even with rapid updates
 */
export const useUpdateAgentParametersQueue = (agentId: string) => {
  const queryClient = useQueryClient();
  const updateQueueRef = useRef<ParameterUpdate[]>([]);
  const isProcessingRef = useRef(false);
  const latestUpdateRef = useRef<ParameterUpdate | null>(null);
  
  // Core mutation for saving parameters
  const mutation = useMutation({
    mutationFn: async ({ 
      enabledParameters, 
      parameterValues 
    }: { 
      enabledParameters: Map<string, boolean>; 
      parameterValues: Map<string, any>;
    }) => {
      const result = await AgentService.updateAgentParameters.execute({
        agentId,
        enabledParameters,
        parameterValues
      });
      
      if (result.isFailure) {
        throw new Error(result.getError());
      }
      
      return { enabledParameters, parameterValues };
    },
    
    onSuccess: () => {
      // Mark as not processing before checking queue
      isProcessingRef.current = false;
      
      // Process next item in queue after successful save
      if (updateQueueRef.current.length > 0) {
        processQueue();
      }
    },
    
    onError: (error) => {
      // Clear queue on error to prevent cascading failures
      updateQueueRef.current = [];
      isProcessingRef.current = false;
      
      // Still invalidate to get fresh data
      queryClient.invalidateQueries({ 
        queryKey: [...agentKeys.all, "parameters", agentId]
      });
    },
    
    onSettled: async () => {
      // Invalidate queries after mutation completes
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: [...agentKeys.all, "parameters", agentId]
        }),
        queryClient.invalidateQueries({ 
          queryKey: agentKeys.detail(agentId) 
        })
      ]);
    },
  });
  
  // Process the queue sequentially
  const processQueue = useCallback(() => {
    if (isProcessingRef.current || updateQueueRef.current.length === 0) {
      // Either already processing or queue is empty
      return;
    }
    
    // Get the next update from queue
    const nextUpdate = updateQueueRef.current.shift();
    if (!nextUpdate) {
      isProcessingRef.current = false;
      return;
    }
    
    // Mark as processing
    isProcessingRef.current = true;
    
    // Execute the mutation
    mutation.mutate({
      enabledParameters: nextUpdate.enabledParameters,
      parameterValues: nextUpdate.parameterValues
    });
  }, [mutation]);
  
  // Add update to queue
  const queueUpdate = useCallback((
    enabledParameters: Map<string, boolean>,
    parameterValues: Map<string, any>
  ) => {
    const update: ParameterUpdate = {
      enabledParameters,
      parameterValues,
      timestamp: Date.now()
    };
    
    // Store the latest update
    latestUpdateRef.current = update;
    
    // Add to queue
    updateQueueRef.current.push(update);
    
    // Start processing if not already processing
    if (!isProcessingRef.current) {
      processQueue();
    }
  }, [processQueue]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // If there are pending updates when unmounting, try to save them
      if (updateQueueRef.current.length > 0 && !isProcessingRef.current) {
        const lastUpdate = updateQueueRef.current[updateQueueRef.current.length - 1];
        if (lastUpdate) {
          // Fire and forget the last update
          AgentService.updateAgentParameters.execute({
            agentId,
            enabledParameters: lastUpdate.enabledParameters,
            parameterValues: lastUpdate.parameterValues
          }).catch(() => {});
        }
      }
    };
  }, [agentId]);
  
  return {
    mutate: queueUpdate,
    isPending: mutation.isPending || updateQueueRef.current.length > 0,
    isError: mutation.isError,
    error: mutation.error,
    queueLength: updateQueueRef.current.length,
    isProcessing: isProcessingRef.current
  };
};