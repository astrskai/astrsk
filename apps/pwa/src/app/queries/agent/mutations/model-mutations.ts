/**
 * Agent Model Mutations
 * 
 * Mutations for agent model and API configuration
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FlowService } from "@/app/services/flow-service";
import { AgentService } from "@/app/services/agent-service";
import { Flow } from "@/modules/flow/domain/flow";
import { Agent, ApiType } from "@/modules/agent/domain/agent";
import { ApiSource } from "@/modules/api/domain";
import { UniqueEntityID } from "@/shared/domain";
import { agentKeys } from "../query-factory";
import { flowKeys } from "@/app/queries/flow/query-factory";

/**
 * Hook for updating agent API type (chat vs text)
 * No edit mode needed - dropdown selection
 */
export const useUpdateAgentApiType = (flowId: string, agentId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (targetApiType: ApiType) => {
      // Get agent
      const agentResult = await AgentService.getAgent.execute(new UniqueEntityID(agentId));
      if (agentResult.isFailure) throw new Error("Agent not found");
      const agent = agentResult.getValue();
      
      // Update agent
      const updatedAgent = agent.update({ targetApiType });
      if (updatedAgent.isFailure) {
        throw new Error(updatedAgent.getError());
      }
      
      // Save agent
      const saveResult = await AgentService.saveAgent.execute(updatedAgent.getValue());
      if (saveResult.isFailure) {
        throw new Error(saveResult.getError());
      }
      
      // Update flow's ready state
      const flow = queryClient.getQueryData<Flow>(flowKeys.validation(flowId));
      if (flow) {
        const updatedFlow = flow.update({});
        await FlowService.saveFlow.execute(updatedFlow.getValue());
      }
      
      return saveResult.getValue();
    },
    
    onMutate: async (targetApiType) => {
      await queryClient.cancelQueries({ 
      });
      
      const previousAgent = queryClient.getQueryData(
        agentKeys.detail(agentId)
      );
      
      // Optimistically update
      queryClient.setQueryData(
        agentKeys.detail(agentId),
        (old: Agent | undefined) => {
          if (!old) return old;
          const updated = old.update({ targetApiType });
          return updated.isSuccess ? updated.getValue() : old;
        }
      );
      
      return { previousAgent };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousAgent) {
        queryClient.setQueryData(
          agentKeys.detail(agentId),
          context.previousAgent
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
      
      // Update flow's ready state
      const flow = queryClient.getQueryData<Flow>(flowKeys.validation(flowId));
      if (flow) {
        const updatedFlow = flow.update({});
        await FlowService.saveFlow.execute(updatedFlow.getValue());
      }
      
      return saveResult.getValue();
    },
    
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ 
      });
      
      const previousAgent = queryClient.getQueryData(
        agentKeys.detail(agentId)
      );
      
      // Optimistically update
      queryClient.setQueryData(
        agentKeys.detail(agentId),
        (old: Agent | undefined) => {
          if (!old) return old;
          const updated = old.update(updates);
          return updated.isSuccess ? updated.getValue() : old;
        }
      );
      
      return { previousAgent };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousAgent) {
        queryClient.setQueryData(
          agentKeys.detail(agentId),
          context.previousAgent
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

/**
 * Hook for updating agent token count
 * No edit mode needed - calculated value
 */
export const useUpdateAgentTokenCount = (flowId: string, agentId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (tokenCount: number) => {
      // Get agent
      const agentResult = await AgentService.getAgent.execute(new UniqueEntityID(agentId));
      if (agentResult.isFailure) throw new Error("Agent not found");
      const agent = agentResult.getValue();
      
      // Update agent
      const updatedAgent = agent.update({ tokenCount });
      if (updatedAgent.isFailure) {
        throw new Error(updatedAgent.getError());
      }
      
      // Save agent
      const saveResult = await AgentService.saveAgent.execute(updatedAgent.getValue());
      if (saveResult.isFailure) {
        throw new Error(saveResult.getError());
      }
      
      return saveResult.getValue();
    },
    
    onMutate: async (tokenCount) => {
      await queryClient.cancelQueries({ 
      });
      
      const previousAgent = queryClient.getQueryData(
        agentKeys.detail(agentId)
      );
      
      // Optimistically update
      queryClient.setQueryData(
        agentKeys.detail(agentId),
        (old: Agent | undefined) => {
          if (!old) return old;
          const updated = old.update({ tokenCount });
          return updated.isSuccess ? updated.getValue() : old;
        }
      );
      
      return { previousAgent };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousAgent) {
        queryClient.setQueryData(
          agentKeys.detail(agentId),
          context.previousAgent
        );
      }
    },
    
    onSettled: async () => {
      await queryClient.invalidateQueries({ 
        queryKey: agentKeys.detail(agentId)
      });
    },
  });
};