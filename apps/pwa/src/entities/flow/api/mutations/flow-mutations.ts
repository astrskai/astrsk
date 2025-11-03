import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useRef } from "react";
import { flowKeys } from "../query-factory";
import { FlowService } from "@/app/services/flow-service";
import { UniqueEntityID } from "@/shared/domain";
import { FlowViewport } from "@/entities/flow/domain/flow";
import { Flow } from "@/entities/flow/domain/flow";

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
        name,
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
      const previousMetadata = queryClient.getQueryData(
        flowKeys.metadata(flowId),
      );
      const previousLists = queryClient.getQueriesData({
        queryKey: flowKeys.lists(),
      });

      // Optimistically update the flow detail
      // Cache contains persistence format (InsertFlow), not domain format
      queryClient.setQueryData(flowKeys.detail(flowId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          name: newName,
          updated_at: new Date(),
        };
      });

      // Optimistically update the metadata
      queryClient.setQueryData(flowKeys.metadata(flowId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          name: newName,
          updated_at: new Date(),
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
                updatedAt: new Date(),
              },
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
        queryKey: flowKeys.detail(flowId),
      });
      queryClient.invalidateQueries({
        queryKey: flowKeys.metadata(flowId),
      });
      queryClient.invalidateQueries({
        queryKey: flowKeys.lists(),
      });
    },
    onError: (err, newName, context) => {
      setIsEditing(false);

      // Restore previous values on error
      if (context?.previousFlow) {
        queryClient.setQueryData(flowKeys.detail(flowId), context.previousFlow);
      }
      if (context?.previousMetadata) {
        queryClient.setQueryData(
          flowKeys.metadata(flowId),
          context.previousMetadata,
        );
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
    endEditing,
  };
}

// Hook for updating flow viewport with optimistic updates
export function useUpdateFlowViewport(flowId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (viewport: FlowViewport) => {
      const result = await FlowService.updateFlowViewport.execute({
        flowId: new UniqueEntityID(flowId),
        viewport,
      });
      if (result.isFailure) throw new Error(result.getError());
    },
    onMutate: async (viewport: FlowViewport) => {
      // Cancel any outgoing refetches to avoid race conditions
      await queryClient.cancelQueries({
        queryKey: flowKeys.uiViewport(flowId),
      });

      // Snapshot the previous viewport value for rollback
      const previousViewport = queryClient.getQueryData<FlowViewport>(
        flowKeys.uiViewport(flowId),
      );

      // Optimistically update the viewport cache immediately
      queryClient.setQueryData(flowKeys.uiViewport(flowId), viewport);

      // Return context with previous value for potential rollback
      return { previousViewport };
    },
    onError: (error, viewport, context) => {
      // Rollback to previous viewport on error
      if (context?.previousViewport) {
        queryClient.setQueryData(
          flowKeys.uiViewport(flowId),
          context.previousViewport,
        );
      }
      console.error("Failed to update viewport:", error);
    },
    onSuccess: (data, viewport) => {
      // Invalidate and refetch to ensure sync with server
      queryClient.invalidateQueries({
        queryKey: flowKeys.uiViewport(flowId),
      });
    },
  });
}

// Hook for cloning flow with nodes
export function useCloneFlowWithNodes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (flowId: string) => {
      const result = await FlowService.cloneFlowWithNodes.execute(
        new UniqueEntityID(flowId),
      );
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
        updatedAt: clonedFlow.props.updatedAt,
      });

      // Invalidate and wait for flow queries to settle to include the new clone
      await queryClient.invalidateQueries({
        queryKey: flowKeys.lists(),
      });
    },
    onError: (error) => {
      console.error("Failed to clone flow:", error);
    },
  });
}

// Hook for cloning flow (legacy - without nodes)
export function useCloneFlow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (flowId: string) => {
      const result = await FlowService.cloneFlow.execute(
        new UniqueEntityID(flowId),
      );
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
        updatedAt: clonedFlow.props.updatedAt,
      });

      // Invalidate and wait for flow queries to settle to include the new clone
      await queryClient.invalidateQueries({
        queryKey: flowKeys.lists(),
      });
    },
    onError: (error) => {
      console.error("Failed to clone flow:", error);
    },
  });
}

// Hook for deleting flow with nodes
export function useDeleteFlowWithNodes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (flowId: string) => {
      const result = await FlowService.deleteFlowWithNodes.execute(
        new UniqueEntityID(flowId),
      );
      if (result.isFailure) throw new Error(result.getError());
      return; // void return - no value to return
    },
    onSuccess: () => {
      // Invalidate all flow queries to remove the deleted flow from lists
      queryClient.invalidateQueries({
        queryKey: flowKeys.lists(),
      });
    },
    onError: (error) => {
      console.error("Failed to delete flow with nodes:", error);
    },
  });
}

// Hook for deleting flow (legacy - without nodes)
export function useDeleteFlow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (flowId: string) => {
      const result = await FlowService.deleteFlow.execute(
        new UniqueEntityID(flowId),
      );
      if (result.isFailure) throw new Error(result.getError());
      return; // void return - no value to return
    },
    onSuccess: () => {
      // Invalidate all flow queries to remove the deleted flow from lists
      queryClient.invalidateQueries({
        queryKey: flowKeys.lists(),
      });
    },
    onError: (error) => {
      console.error("Failed to delete flow:", error);
    },
  });
}

// Hook for updating flow response template
type UseUpdateResponseTemplateReturn = ReturnType<
  typeof useMutation<
    string,
    Error,
    string,
    { previousFlow: any; previousResponse: any }
  >
> & {
  isEditing: boolean;
  hasCursor: boolean;
  setCursorActive: (active: boolean) => void;
};

export function useUpdateResponseTemplate(
  flowId: string,
): UseUpdateResponseTemplateReturn {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [hasCursor, setHasCursor] = useState(false);
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
      setHasCursor(false);
    }, 500);
  }, []);

  const setCursorActive = useCallback(
    (active: boolean) => {
      setHasCursor(active);
      if (active) {
        startEditing();
      }
    },
    [startEditing],
  );

  const mutation = useMutation({
    mutationFn: async (responseTemplate: string) => {
      const result = await FlowService.updateResponseTemplate.execute({
        flowId,
        responseTemplate,
      });
      if (result.isFailure) {
        throw new Error(result.getError());
      }
      return responseTemplate;
    },
    onMutate: async (newResponseTemplate) => {
      startEditing();

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: flowKeys.detail(flowId) });
      await queryClient.cancelQueries({ queryKey: flowKeys.response(flowId) });

      // Snapshot the previous values
      const previousFlow = queryClient.getQueryData(flowKeys.detail(flowId));
      const previousResponse = queryClient.getQueryData(
        flowKeys.response(flowId),
      );

      // Optimistically update both caches
      queryClient.setQueryData(flowKeys.detail(flowId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          responseTemplate: newResponseTemplate,
          updatedAt: new Date(),
        };
      });

      queryClient.setQueryData(flowKeys.response(flowId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          template: newResponseTemplate,
          updatedAt: new Date(),
        };
      });

      return { previousFlow, previousResponse };
    },
    onError: (err, newResponseTemplate, context) => {
      // Rollback on error
      if (context?.previousFlow) {
        queryClient.setQueryData(flowKeys.detail(flowId), context.previousFlow);
      }
      if (context?.previousResponse) {
        queryClient.setQueryData(
          flowKeys.response(flowId),
          context.previousResponse,
        );
      }
      endEditing();
    },
    onSuccess: () => {
      // Invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: flowKeys.detail(flowId) });
      queryClient.invalidateQueries({ queryKey: flowKeys.response(flowId) });
    },
    onSettled: () => {
      endEditing();
    },
  });

  return {
    ...mutation,
    isEditing,
    hasCursor,
    setCursorActive,
  } as UseUpdateResponseTemplateReturn;
}
