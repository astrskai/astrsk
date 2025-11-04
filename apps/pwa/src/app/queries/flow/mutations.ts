/**
 * Flow Mutation Hooks
 *
 * Ready-to-use mutation hooks for flow operations.
 * These combine optimistic updates, API calls, and invalidation.
 */

import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FlowService } from "@/app/services/flow-service";
import { flowKeys } from "./query-factory";

/**
 * Hook for updating response template with edit mode support
 * Use this for template editor to prevent race conditions
 *
 * @param flowId - The flow ID
 * @param endType - undefined for character (default responseTemplate), "user" for responseTemplateUser, "plot" for responseTemplatePlot
 * @returns mutation with isEditing state that can be used to pause query subscriptions
 */
export const useUpdateResponseTemplate = (flowId: string, endType?: string) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [hasCursor, setHasCursor] = useState(false);
  const editEndTimerRef = useRef<NodeJS.Timeout>();

  // Function to end editing with debounce
  const endEditing = useCallback(() => {
    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }

    editEndTimerRef.current = setTimeout(() => {
      setIsEditing(false);
    }, 500);
  }, []);

  // Function to start/continue editing
  const startEditing = useCallback(() => {
    setIsEditing(true);

    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }
  }, []);

  // Function to set cursor active state
  const setCursorActive = useCallback((active: boolean) => {
    setHasCursor(active);
  }, []);

  const mutation = useMutation({
    mutationFn: async (template: string) => {
      // Use dedicated method that only updates the response template
      // This avoids race conditions where we might overwrite other fields
      const result = await FlowService.updateResponseTemplate.execute({
        flowId,
        responseTemplate: template,
        endType, // Pass endType to update the correct template
      });

      if (result.isFailure) {
        throw new Error(result.getError());
      }

      return template; // Return the template that was saved
    },

    onMutate: async (template) => {
      // Start edit mode
      startEditing();

      await queryClient.cancelQueries({
        queryKey: flowKeys.response(flowId, endType),
      });

      const previousTemplate = queryClient.getQueryData(
        flowKeys.response(flowId, endType),
      );

      // No optimistic update - let the mutation complete

      return { previousTemplate };
    },

    onError: (err, variables, context) => {
      if (context?.previousTemplate !== undefined) {
        queryClient.setQueryData(
          flowKeys.response(flowId, endType),
          context.previousTemplate,
        );
      }

      // End edit mode on error
      setIsEditing(false);
      if (editEndTimerRef.current) {
        clearTimeout(editEndTimerRef.current);
      }
    },

    onSettled: async (data, error) => {
      // Start debounced end of edit mode
      if (!error) {
        endEditing();
      }

      // Only invalidate the specific response template query (don't invalidate detail)
      // This prevents other response panels from re-fetching unnecessarily
      await queryClient.invalidateQueries({
        queryKey: flowKeys.response(flowId, endType),
        exact: true, // Only invalidate this exact query, not child queries
      });

      // Invalidate the detail query to update vibe panel
      // But use exact: true to prevent invalidating response queries
      await queryClient.invalidateQueries({
        queryKey: flowKeys.detail(flowId),
        exact: true,
      });
    },
  });

  // Always return mutation with isEditing state - fully type-safe!
  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isEditing, // Always present, TypeScript knows this exists
    hasCursor,
    setCursorActive,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};
