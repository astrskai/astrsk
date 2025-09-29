/**
 * Data Store Node Mutation Hooks
 *
 * Mutations for node-level data store field operations
 * Uses targeted node updates to avoid race conditions
 */

import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FlowService } from "@/app/services/flow-service";
import { DataStoreField, Flow, ReadyState } from "@/modules/flow/domain/flow";
import { flowKeys } from "../query-factory";

/**
 * @deprecated Legacy flow-level data store node field mutation
 * Use useUpdateDataStoreNodeFields from @/app/queries/data-store-node/mutations instead
 * This mutation updates the flow document and can cause race conditions
 *
 * @returns mutation with isEditing state for preventing race conditions
 */
export const useUpdateDataStoreNodeFieldsLegacy = (
  flowId: string,
  nodeId: string,
) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const editEndTimerRef = useRef<NodeJS.Timeout>();

  const endEditing = useCallback(() => {
    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }
    editEndTimerRef.current = setTimeout(() => {
      setIsEditing(false);
    }, 500);
  }, []);

  const startEditing = useCallback(() => {
    setIsEditing(true);
    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }
  }, []);

  const mutation = useMutation({
    mutationFn: async (fields: DataStoreField[]) => {
      // Use dedicated method that only updates the node's data store fields
      const result = await FlowService.updateNodeDataStoreFields.execute({
        flowId,
        nodeId,
        fields,
      });

      if (result.isFailure) {
        throw new Error(result.getError());
      }

      // Update flow ready state to Draft if it's Ready
      const flow = queryClient.getQueryData<Flow>(flowKeys.detail(flowId));
      if (flow && flow.props && flow.props.readyState === ReadyState.Ready) {
        await FlowService.updateFlowReadyState.execute({
          flowId,
          readyState: ReadyState.Draft,
        });
      }

      return fields;
    },

    onMutate: async (fields) => {
      startEditing();

      // Cancel any in-flight queries for this node and flow
      await queryClient.cancelQueries({
        queryKey: flowKeys.node(flowId, nodeId),
      });
      await queryClient.cancelQueries({
        queryKey: flowKeys.detail(flowId),
      });

      const previousNode = queryClient.getQueryData(
        flowKeys.node(flowId, nodeId),
      );
      const previousFlow = queryClient.getQueryData(flowKeys.detail(flowId));

      // Check for other pending mutations on this node
      const mutations = queryClient.getMutationCache().getAll();
      const hasPendingNodeMutations = mutations.some(
        (m) =>
          m.state.status === "pending" &&
          m.options.mutationKey?.includes(`node-${nodeId}`),
      );

      if (hasPendingNodeMutations) {
        console.warn("Other mutations pending for node:", nodeId);
        // Skip optimistic update to avoid conflicts
        return { previousNode, previousFlow, skipOptimistic: true };
      }

      // Optimistic update for immediate UI feedback
      queryClient.setQueryData(flowKeys.node(flowId, nodeId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            dataStoreFields: fields,
          },
        };
      });

      // Also update the flow detail optimistically
      queryClient.setQueryData(flowKeys.detail(flowId), (old: any) => {
        if (!old) return old;

        // Handle both old format (old.props.nodes) and new format (old.nodes)
        const nodes = old.props?.nodes || old.nodes;
        if (!nodes) {
          return old;
        }

        const updatedNodes = nodes.map((node: any) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                dataStoreFields: fields,
              },
            };
          }
          return node;
        });

        // Update in the correct location based on structure
        if (old.props?.nodes) {
          // Old format: nodes under props
          return {
            ...old,
            props: {
              ...old.props,
              nodes: updatedNodes,
              readyState:
                old.props?.readyState === ReadyState.Ready
                  ? ReadyState.Draft
                  : old.props?.readyState,
            },
          };
        } else {
          // New format: nodes directly on flow
          return {
            ...old,
            nodes: updatedNodes,
          };
        }
      });

      return { previousNode, previousFlow };
    },

    onError: (err, variables, context) => {
      // Skip rollback if we skipped optimistic update
      if (context?.skipOptimistic) {
        setIsEditing(false);
        if (editEndTimerRef.current) {
          clearTimeout(editEndTimerRef.current);
        }
        return;
      }

      // Rollback optimistic updates
      if (context?.previousNode !== undefined) {
        queryClient.setQueryData(
          flowKeys.node(flowId, nodeId),
          context.previousNode,
        );
      }
      if (context?.previousFlow) {
        queryClient.setQueryData(flowKeys.detail(flowId), context.previousFlow);
      }

      setIsEditing(false);
      if (editEndTimerRef.current) {
        clearTimeout(editEndTimerRef.current);
      }
    },

    onSettled: async (data, error) => {
      if (!error) {
        endEditing();
      }

      // Invalidate all queries that contain this node's data
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: flowKeys.node(flowId, nodeId), // Specific node
        }),
        queryClient.invalidateQueries({
          queryKey: flowKeys.nodes(flowId), // All nodes array
        }),
      ]);
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isEditing,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};
