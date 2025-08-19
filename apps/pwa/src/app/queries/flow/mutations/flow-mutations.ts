import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useRef } from "react";
import { flowKeys } from "../query-factory";
import { FlowService } from "@/app/services/flow-service";
import { UniqueEntityID } from "@/shared/domain";
import { Node, Edge, FlowViewport } from "@/modules/flow/domain/flow";

// Hook for updating flow name with isEditing flag and optimistic updates
export function useUpdateFlowName(flowId: string) {
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
    editTimeoutRef.current = setTimeout(() => {
      setIsEditing(false);
    }, 500);
  }, []);
  
  const mutation = useMutation({
    mutationFn: async (name: string) => {
      const result = await FlowService.updateFlowName.execute({ 
        flowId: new UniqueEntityID(flowId), 
        name 
      });
      if (result.isFailure) throw new Error(result.getError());
      return name;
    },
    onMutate: async (newName) => {
      startEditing();
      
      // Cancel any outgoing refetches to prevent overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: flowKeys.detail(flowId) });
      await queryClient.cancelQueries({ queryKey: flowKeys.metadata(flowId) });
      await queryClient.cancelQueries({ queryKey: flowKeys.lists() });

      // Snapshot the previous values
      const previousFlow = queryClient.getQueryData(flowKeys.detail(flowId));
      const previousMetadata = queryClient.getQueryData(flowKeys.metadata(flowId));
      const previousLists = queryClient.getQueriesData({ queryKey: flowKeys.lists() });

      // Optimistically update the flow detail
      queryClient.setQueryData(flowKeys.detail(flowId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          props: {
            ...old.props,
            name: newName,
            updatedAt: new Date()
          }
        };
      });

      // Optimistically update the metadata
      queryClient.setQueryData(flowKeys.metadata(flowId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          name: newName,
          updatedAt: new Date()
        };
      });

      // Optimistically update all list queries that contain this flow
      queryClient.setQueriesData({ queryKey: flowKeys.lists() }, (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((flow: any) => {
          if (flow.id?.toString() === flowId || flow.id === flowId) {
            return {
              ...flow,
              props: {
                ...flow.props,
                name: newName,
                updatedAt: new Date()
              }
            };
          }
          return flow;
        });
      });

      // Return a context object with the snapshotted values
      return { previousFlow, previousMetadata, previousLists };
    },
    onSuccess: () => {
      endEditing();
      // Invalidate queries to ensure consistency with server
      queryClient.invalidateQueries({ 
        queryKey: flowKeys.detail(flowId)
      });
      queryClient.invalidateQueries({ 
        queryKey: flowKeys.metadata(flowId)
      });
      queryClient.invalidateQueries({ 
        queryKey: flowKeys.lists()
      });
    },
    onError: (err, newName, context) => {
      setIsEditing(false);
      
      // Restore previous values on error
      if (context?.previousFlow) {
        queryClient.setQueryData(flowKeys.detail(flowId), context.previousFlow);
      }
      if (context?.previousMetadata) {
        queryClient.setQueryData(flowKeys.metadata(flowId), context.previousMetadata);
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
  });
  
  return {
    ...mutation,
    isEditing,
    startEditing,
    endEditing
  };
}


// Hook for updating flow viewport (no isEditing needed as it doesn't affect UI state)
export function useUpdateFlowViewport(flowId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (viewport: FlowViewport) => {
      const result = await FlowService.updateFlowViewport.execute({ 
        flowId: new UniqueEntityID(flowId), 
        viewport 
      });
      if (result.isFailure) throw new Error(result.getError());
    },
    onSuccess: () => {
      // Only invalidate viewport query
      queryClient.invalidateQueries({ 
        queryKey: flowKeys.uiViewport(flowId)
      });
    },
  });
}