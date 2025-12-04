/**
 * Agent Model Mutations
 * 
 * Mutations for agent model and API configuration
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AgentService } from "@/app/services/agent-service";
import { FlowService } from "@/app/services/flow-service";
import { ModelTier } from "@/entities/agent/domain/agent";
import { ApiSource } from "@/entities/api/domain";
import { UniqueEntityID } from "@/shared/domain";
import { agentKeys } from "../query-factory";
import { flowKeys } from "@/entities/flow/api/query-factory";
import { Flow, ReadyState } from "@/entities/flow/domain/flow";

/**
 * Hook for updating agent model selection
 * No edit mode needed - dropdown selection
 */
export const useUpdateAgentModel = (flowId: string, agentId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      apiSource,
      modelId,
      modelName,
      modelTier,
    }: {
      apiSource?: ApiSource;
      modelId?: string;
      modelName?: string;
      modelTier?: ModelTier;
    }) => {
      console.log(`[ModelMutation] Updating agent model:`, {
        agentId,
        apiSource,
        modelId,
        modelName,
        modelTier,
        modelTierIsUndefined: modelTier === undefined,
      });

      // Get agent
      const agentResult = await AgentService.getAgent.execute(new UniqueEntityID(agentId));
      if (agentResult.isFailure) throw new Error("Agent not found");
      const agent = agentResult.getValue();

      // Update agent - when modelTier is set, clear specific model fields
      const updatePayload = modelTier !== undefined ? {
        // Tier-based selection: clear specific model, set tier
        apiSource: undefined,
        modelId: undefined,
        modelName,
        modelTier,
      } : {
        // Specific model selection: set model fields, clear tier
        ...(apiSource !== undefined && { apiSource }),
        ...(modelId !== undefined && { modelId }),
        ...(modelName !== undefined && { modelName }),
        modelTier: undefined,
      };

      console.log(`[ModelMutation] Update payload:`, updatePayload);
      console.log(`[ModelMutation] Agent BEFORE update - modelTier:`, agent.props.modelTier);

      const updatedAgent = agent.update(updatePayload);
      if (updatedAgent.isFailure) {
        throw new Error(updatedAgent.getError());
      }

      console.log(`[ModelMutation] Agent AFTER update - modelTier:`, updatedAgent.getValue().props.modelTier);

      // Save agent
      const saveResult = await AgentService.saveAgent.execute(updatedAgent.getValue());

      console.log(`[ModelMutation] Agent saved successfully`);
      if (saveResult.isFailure) {
        throw new Error(saveResult.getError());
      }
      
      // Update flow ready state to Draft if it's Ready
      const flow = queryClient.getQueryData<Flow>(flowKeys.detail(flowId));
      if (flow && flow.props && flow.props.readyState === ReadyState.Ready) {
        await FlowService.updateFlowReadyState.execute({
          flowId,
          readyState: ReadyState.Draft
        });
      }
      
      return saveResult.getValue();
    },
    
    onMutate: async (updates) => {
      // Cancel queries for model data and flow
      await queryClient.cancelQueries({ 
        queryKey: agentKeys.model(agentId)
      });
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.detail(flowId)
      });
      
      const previousModel = queryClient.getQueryData(
        agentKeys.model(agentId)
      );
      const previousFlow = queryClient.getQueryData(
        flowKeys.detail(flowId)
      );
      
      // Optimistically update the model query (not the full agent)
      queryClient.setQueryData(
        agentKeys.model(agentId),
        (old: any) => {
          if (!old) return old;
          // When modelTier is set, clear specific model fields
          if (updates.modelTier !== undefined) {
            return {
              ...old,
              apiSource: undefined,
              modelId: undefined,
              modelName: updates.modelName,
              modelTier: updates.modelTier,
            };
          }
          // When specific model is selected, clear modelTier
          return {
            ...old,
            ...(updates.apiSource !== undefined && { apiSource: updates.apiSource }),
            ...(updates.modelId !== undefined && { modelId: updates.modelId }),
            ...(updates.modelName !== undefined && { modelName: updates.modelName }),
            modelTier: undefined,
          };
        }
      );
      
      // Update flow ready state optimistically
      queryClient.setQueryData(
        flowKeys.detail(flowId),
        (old: any) => {
          if (!old || !old.props) return old;
          return {
            ...old,
            props: {
              ...old.props,
              readyState: old.props.readyState === ReadyState.Ready ? ReadyState.Draft : old.props.readyState
            }
          };
        }
      );
      
      return { previousModel, previousFlow };
    },
    
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousModel) {
        queryClient.setQueryData(
          agentKeys.model(agentId),
          context.previousModel
        );
      }
      if (context?.previousFlow) {
        queryClient.setQueryData(
          flowKeys.detail(flowId),
          context.previousFlow
        );
      }
    },
    
    onSettled: async () => {
      // Remove cached data to force refetch (invalidate only marks as stale)
      queryClient.removeQueries({
        queryKey: agentKeys.detail(agentId),
        exact: true,
      });

      await Promise.all([
        // Invalidate the specific model query that was optimistically updated
        queryClient.invalidateQueries({
          queryKey: agentKeys.model(agentId)
        }),
        // Refetch the full agent detail to get fresh data
        queryClient.refetchQueries({
          queryKey: agentKeys.detail(agentId)
        }),
        // Invalidate flow validation since model changes affect flow validation
        queryClient.invalidateQueries({
          queryKey: flowKeys.validation(flowId)
        })
      ]);
    },
  });
};

