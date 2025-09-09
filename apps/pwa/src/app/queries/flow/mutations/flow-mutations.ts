import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useRef } from "react";
import { flowKeys } from "../query-factory";
import { FlowService } from "@/app/services/flow-service";
import { UniqueEntityID } from "@/shared/domain";
import { Node, Edge, FlowViewport } from "@/modules/flow/domain/flow";
import { Flow } from "@/modules/flow/domain/flow";

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


// Hook for updating flow viewport with optimistic updates
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
    onMutate: async (viewport: FlowViewport) => {
      // Cancel any outgoing refetches to avoid race conditions
      await queryClient.cancelQueries({ queryKey: flowKeys.uiViewport(flowId) });
      
      // Snapshot the previous viewport value for rollback
      const previousViewport = queryClient.getQueryData<FlowViewport>(flowKeys.uiViewport(flowId));
      
      // Optimistically update the viewport cache immediately
      queryClient.setQueryData(flowKeys.uiViewport(flowId), viewport);
      
      // Return context with previous value for potential rollback
      return { previousViewport };
    },
    onError: (error, viewport, context) => {
      // Rollback to previous viewport on error
      if (context?.previousViewport) {
        queryClient.setQueryData(flowKeys.uiViewport(flowId), context.previousViewport);
      }
      console.error('Failed to update viewport:', error);
    },
    onSuccess: (data, viewport) => {
      // Invalidate and refetch to ensure sync with server
      queryClient.invalidateQueries({ 
        queryKey: flowKeys.uiViewport(flowId)
      });
    },
  });
}

// Hook for cloning flow with nodes
export function useCloneFlowWithNodes() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (flowId: string) => {
      const result = await FlowService.cloneFlowWithNodes.execute(new UniqueEntityID(flowId));
      if (result.isFailure) throw new Error(result.getError());
      return result.getValue();
    },
    onSuccess: async (clonedFlow: Flow) => {
      // Pre-populate the new flow's cache first
      const flowId = clonedFlow.id.toString();
      queryClient.setQueryData(flowKeys.detail(flowId), clonedFlow);
      queryClient.setQueryData(flowKeys.metadata(flowId), {
        id: clonedFlow.id,
        name: clonedFlow.props.name,
        createdAt: clonedFlow.props.createdAt,
        updatedAt: clonedFlow.props.updatedAt
      });
      
      // Invalidate and wait for flow queries to settle to include the new clone
      await queryClient.invalidateQueries({ 
        queryKey: flowKeys.lists() 
      });
    },
    onError: (error) => {
      console.error('Failed to clone flow:', error);
    },
  });
}

// Hook for cloning flow (legacy - without nodes)
export function useCloneFlow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (flowId: string) => {
      const result = await FlowService.cloneFlow.execute(new UniqueEntityID(flowId));
      if (result.isFailure) throw new Error(result.getError());
      return result.getValue();
    },
    onSuccess: async (clonedFlow: Flow) => {
      // Pre-populate the new flow's cache first
      const flowId = clonedFlow.id.toString();
      queryClient.setQueryData(flowKeys.detail(flowId), clonedFlow);
      queryClient.setQueryData(flowKeys.metadata(flowId), {
        id: clonedFlow.id,
        name: clonedFlow.props.name,
        createdAt: clonedFlow.props.createdAt,
        updatedAt: clonedFlow.props.updatedAt
      });
      
      // Invalidate and wait for flow queries to settle to include the new clone
      await queryClient.invalidateQueries({ 
        queryKey: flowKeys.lists() 
      });
    },
    onError: (error) => {
      console.error('Failed to clone flow:', error);
    },
  });
}

// Hook for deleting flow with nodes
export function useDeleteFlowWithNodes() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (flowId: string) => {
      const result = await FlowService.deleteFlowWithNodes.execute(new UniqueEntityID(flowId));
      if (result.isFailure) throw new Error(result.getError());
      return; // void return - no value to return
    },
    onSuccess: () => {
      // Invalidate all flow queries to remove the deleted flow from lists
      queryClient.invalidateQueries({ 
        queryKey: flowKeys.lists() 
      });
    },
    onError: (error) => {
      console.error('Failed to delete flow with nodes:', error);
    },
  });
}

// Hook for deleting flow (legacy - without nodes)
export function useDeleteFlow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (flowId: string) => {
      const result = await FlowService.deleteFlow.execute(new UniqueEntityID(flowId));
      if (result.isFailure) throw new Error(result.getError());
      return; // void return - no value to return
    },
    onSuccess: () => {
      // Invalidate all flow queries to remove the deleted flow from lists
      queryClient.invalidateQueries({ 
        queryKey: flowKeys.lists() 
      });
    },
    onError: (error) => {
      console.error('Failed to delete flow:', error);
    },
  });
}

// Hook for updating coding panel state with optimistic updates
export function useUpdateCodingPanelState(flowId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (isOpen: boolean) => {
      const result = await FlowService.updateFlowCodingPanelState.execute({ 
        flowId: new UniqueEntityID(flowId), 
        isCodingPanelOpen: isOpen 
      });
      if (result.isFailure) throw new Error(result.getError());
      return isOpen;
    },
    onMutate: async (isOpen: boolean) => {
      // Cancel any outgoing refetches to prevent overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: flowKeys.detail(flowId) });
      
      // Snapshot the previous value
      const previousFlow = queryClient.getQueryData(flowKeys.detail(flowId));
      
      // Optimistically update the flow detail
      queryClient.setQueryData(flowKeys.detail(flowId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          props: {
            ...old.props,
            isCodingPanelOpen: isOpen,
            updatedAt: new Date()
          }
        };
      });
      
      // Return context for potential rollback
      return { previousFlow };
    },
    onError: (err, isOpen, context) => {
      // Restore previous value on error
      if (context?.previousFlow) {
        queryClient.setQueryData(flowKeys.detail(flowId), context.previousFlow);
      }
      console.error('Failed to update coding panel state:', err);
    },
    onSuccess: () => {
      // Invalidate to ensure consistency with server
      queryClient.invalidateQueries({ 
        queryKey: flowKeys.detail(flowId)
      });
    },
  });
}