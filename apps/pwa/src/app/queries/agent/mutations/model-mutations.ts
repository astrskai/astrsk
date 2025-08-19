/**
 * Agent Model Mutations
 * 
 * Mutations for agent model and API configuration
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AgentService } from "@/app/services/agent-service";
import { FlowService } from "@/app/services/flow-service";
import { Agent, ApiType } from "@/modules/agent/domain/agent";
import { ApiSource } from "@/modules/api/domain";
import { UniqueEntityID } from "@/shared/domain";
import { agentKeys } from "../query-factory";
import { flowKeys } from "@/app/queries/flow/query-factory";
import { Flow, ReadyState } from "@/modules/flow/domain/flow";

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
      modelName 
    }: { 
      apiSource?: ApiSource; 
      modelId?: string; 
      modelName?: string;
    }) => {
      // Get agent
      const agentResult = await AgentService.getAgent.execute(new UniqueEntityID(agentId));
      if (agentResult.isFailure) throw new Error("Agent not found");
      const agent = agentResult.getValue();
      
      // Update agent
      const updatedAgent = agent.update({ 
        ...(apiSource !== undefined && { apiSource }),
        ...(modelId !== undefined && { modelId }),
        ...(modelName !== undefined && { modelName })
      });
      if (updatedAgent.isFailure) {
        throw new Error(updatedAgent.getError());
      }
      
      // Save agent
      const saveResult = await AgentService.saveAgent.execute(updatedAgent.getValue());
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
      // Cancel queries for agent and flow
      await queryClient.cancelQueries({ 
        queryKey: agentKeys.detail(agentId)
      });
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.detail(flowId)
      });
      
      const previousAgent = queryClient.getQueryData(
        agentKeys.detail(agentId)
      );
      const previousFlow = queryClient.getQueryData(
        flowKeys.detail(flowId)
      );
      
      // Optimistically update agent
      queryClient.setQueryData(
        agentKeys.detail(agentId),
        (old: Agent | undefined) => {
          if (!old) return old;
          const updated = old.update(updates);
          return updated.isSuccess ? updated.getValue() : old;
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
      
      return { previousAgent, previousFlow };
    },
    
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousAgent) {
        queryClient.setQueryData(
          agentKeys.detail(agentId),
          context.previousAgent
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
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: agentKeys.detail(agentId)
        }),
        queryClient.invalidateQueries({ 
          queryKey: flowKeys.validation(flowId)
        })
      ]);
    },
  });
};

