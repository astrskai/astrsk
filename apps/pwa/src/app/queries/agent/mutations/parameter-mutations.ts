/**
 * Agent Parameter Mutations
 * 
 * Mutations for agent parameter configuration
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FlowService } from "@/app/services/flow-service";
import { AgentService } from "@/app/services/agent-service";
import { Flow } from "@/modules/flow/domain/flow";
import { Agent } from "@/modules/agent/domain/agent";
import { UniqueEntityID } from "@/shared/domain";
import { agentKeys } from "../query-factory";
import { flowKeys } from "@/app/queries/flow/query-factory";

/**
 * Hook for toggling a parameter on/off
 */
export const useToggleAgentParameter = (flowId: string, agentId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      parameterName, 
      enabled 
    }: { 
      parameterName: string; 
      enabled: boolean;
    }) => {
      // Get agent
      const agentResult = await AgentService.getAgent.execute(new UniqueEntityID(agentId));
      if (agentResult.isFailure) throw new Error("Agent not found");
      const agent = agentResult.getValue();
      
      // Update parameter enabled state
      const enabledParameters = new Map(agent.props.enabledParameters);
      enabledParameters.set(parameterName, enabled);
      
      const updatedAgent = agent.update({ enabledParameters });
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
    
    onMutate: async ({ parameterName, enabled }) => {
      await queryClient.cancelQueries({ 
      });
      
      const previousAgent = queryClient.getQueryData<Agent>(
        agentKeys.detail(agentId)
      );
      
      // Optimistically update
      if (previousAgent) {
        const enabledParameters = new Map(previousAgent.props.enabledParameters);
        enabledParameters.set(parameterName, enabled);
        
        queryClient.setQueryData(
          agentKeys.detail(agentId),
          {
            ...previousAgent,
            props: { ...previousAgent.props, enabledParameters }
          }
        );
      }
      
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
 * Hook for updating a parameter value
 */
export const useUpdateAgentParameterValue = (flowId: string, agentId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      parameterName, 
      value 
    }: { 
      parameterName: string; 
      value: any;
    }) => {
      // Get agent
      const agentResult = await AgentService.getAgent.execute(new UniqueEntityID(agentId));
      if (agentResult.isFailure) throw new Error("Agent not found");
      const agent = agentResult.getValue();
      
      // Update parameter value
      const parameterValues = new Map(agent.props.parameterValues);
      parameterValues.set(parameterName, value);
      
      const updatedAgent = agent.update({ parameterValues });
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
    
    onMutate: async ({ parameterName, value }) => {
      await queryClient.cancelQueries({ 
      });
      
      const previousAgent = queryClient.getQueryData<Agent>(
        agentKeys.detail(agentId)
      );
      
      // Optimistically update
      if (previousAgent) {
        const parameterValues = new Map(previousAgent.props.parameterValues);
        parameterValues.set(parameterName, value);
        
        queryClient.setQueryData(
          agentKeys.detail(agentId),
          {
            ...previousAgent,
            props: { ...previousAgent.props, parameterValues }
          }
        );
      }
      
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
 * Hook for bulk updating all parameters
 */
export const useUpdateAgentParameters = (flowId: string, agentId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      enabledParameters, 
      parameterValues 
    }: { 
      enabledParameters?: Map<string, boolean>; 
      parameterValues?: Map<string, any>;
    }) => {
      // Get agent
      const agentResult = await AgentService.getAgent.execute(new UniqueEntityID(agentId));
      if (agentResult.isFailure) throw new Error("Agent not found");
      const agent = agentResult.getValue();
      
      // Update agent
      const updatedAgent = agent.update({ 
        ...(enabledParameters !== undefined && { enabledParameters }),
        ...(parameterValues !== undefined && { parameterValues })
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
 * Hook for resetting all parameters to defaults
 */
export const useResetAgentParameters = (flowId: string, agentId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      // Get agent
      const agentResult = await AgentService.getAgent.execute(new UniqueEntityID(agentId));
      if (agentResult.isFailure) throw new Error("Agent not found");
      const agent = agentResult.getValue();
      
      // Reset parameters
      const updatedAgent = agent.update({ 
        enabledParameters: new Map<string, boolean>(),
        parameterValues: new Map<string, any>()
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
    
    onMutate: async () => {
      await queryClient.cancelQueries({ 
      });
      
      const previousAgent = queryClient.getQueryData(
        agentKeys.detail(agentId)
      );
      
      // Optimistically reset
      queryClient.setQueryData(
        agentKeys.detail(agentId),
        (old: Agent | undefined) => {
          if (!old) return old;
          const updated = old.update({ 
            enabledParameters: new Map<string, boolean>(),
            parameterValues: new Map<string, any>()
          });
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