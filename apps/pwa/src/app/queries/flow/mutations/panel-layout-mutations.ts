/**
 * Panel Layout Mutations
 *
 * Efficient mutations for updating panel layout without full flow save.
 * These mutations only update the panel structure, which is UI state
 * that doesn't affect flow logic or validation.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FlowService } from "@/app/services/flow-service";
import { flowKeys } from "@/app/queries/flow/query-factory";
import { PanelStructure } from "@/entities/flow/domain/flow";
import { toast } from "sonner";

interface UpdatePanelLayoutRequest {
  flowId: string;
  panelStructure: PanelStructure;
}

/**
 * Update panel layout mutation
 * - Updates only the panel structure field
 * - No flow validation needed (UI-only change)
 * - Optimistic update for instant feedback
 */
export function useUpdatePanelLayout(flowId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (panelStructure: PanelStructure) => {
      const result = await FlowService.updatePanelLayout.execute({
        flowId,
        panelStructure,
      });

      if (result.isFailure) {
        throw new Error(result.getError());
      }

      return panelStructure;
    },

    // Optimistic update for instant UI feedback
    onMutate: async (panelStructure) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: flowKeys.panelLayout(flowId),
      });

      // Snapshot the previous value
      const previousLayout = queryClient.getQueryData(
        flowKeys.panelLayout(flowId),
      );

      // Optimistically update to the new value
      queryClient.setQueryData(flowKeys.panelLayout(flowId), panelStructure);

      // Return a context object with the snapshotted value
      return { previousLayout };
    },

    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, panelStructure, context) => {
      if (context?.previousLayout) {
        queryClient.setQueryData(
          flowKeys.panelLayout(flowId),
          context.previousLayout,
        );
      }

      // Silent failure for layout saves - they're not critical
      console.error("Failed to save panel layout:", err);
    },

    // Always refetch after error or success
    onSettled: () => {
      // Invalidate panel layout query to ensure consistency
      queryClient.invalidateQueries({ queryKey: flowKeys.panelLayout(flowId) });
    },

    // Configuration
    retry: 1, // Retry once on failure
    retryDelay: 1000, // Wait 1 second before retry
  });
}
