/**
 * Flow Validation Mutation Hooks
 * 
 * Mutations for flow validation state and ready state updates
 * Uses targeted updates to avoid race conditions
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FlowService } from "@/app/services/flow-service";
import { ReadyState } from "@/entities/flow/domain/flow";
import { flowKeys } from "../query-factory";

/**
 * Hook for updating flow validation state
 * Updates both ready state and validation issues
 * 
 * @returns mutation for updating validation state
 */
export const useUpdateFlowValidation = (flowId: string) => {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: async ({ 
      readyState, 
      validationIssues 
    }: { 
      readyState: ReadyState; 
      validationIssues: any[] 
    }) => {
      // Use dedicated method that only updates validation fields
      const result = await FlowService.updateFlowValidation.execute({
        flowId,
        readyState,
        validationIssues
      });
      
      if (result.isFailure) {
        throw new Error(result.getError());
      }
      
      return { readyState, validationIssues };
    },
    
    onMutate: async ({ readyState, validationIssues }) => {
      // Cancel any in-flight queries for this flow
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.detail(flowId) 
      });
      
      const previousFlow = queryClient.getQueryData(
        flowKeys.detail(flowId)
      );
      
      // Optimistic update
      // Cache contains persistence format (InsertFlow), not domain format
      queryClient.setQueryData(
        flowKeys.detail(flowId),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            ready_state: readyState,
            validation_issues: validationIssues,
            updated_at: new Date()
          };
        }
      );
      
      return { previousFlow };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousFlow !== undefined) {
        queryClient.setQueryData(
          flowKeys.detail(flowId),
          context.previousFlow
        );
      }
    },
    
    onSettled: async () => {
      // Invalidate all queries related to this flow
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: flowKeys.detail(flowId) 
        }),
        queryClient.invalidateQueries({ 
          queryKey: flowKeys.validation(flowId) 
        }),
        queryClient.invalidateQueries({ 
          queryKey: flowKeys.lists() // Flow lists might show ready state
        })
      ]);
    },
  });
  
  return mutation;
};