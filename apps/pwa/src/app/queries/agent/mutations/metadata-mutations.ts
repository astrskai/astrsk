/**
 * Agent Metadata Mutations
 * 
 * Mutations for agent metadata operations (name, description, color)
 */

import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FlowService } from "@/app/services/flow-service";
import { AgentService } from "@/app/services/agent-service";
import { Flow } from "@/modules/flow/domain/flow";
import { Agent } from "@/modules/agent/domain/agent";
import { UniqueEntityID } from "@/shared/domain";
import { agentKeys } from "../query-factory";
import { flowKeys } from "@/app/queries/flow/query-factory";

/**
 * Hook for updating agent name
 * Has edit mode for text field with 500ms debounce
 */
export const useUpdateAgentName = (flowId: string, agentId: string) => {
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
    mutationFn: async (name: string) => {
      // Validate name
      if (!name || name.trim().length < 3) {
        throw new Error("Agent name must be at least 3 characters long");
      }
      if (/^[0-9]/.test(name.trim())) {
        throw new Error("Agent name cannot start with a number");
      }
      
      // Get agent
      const agentResult = await AgentService.getAgent.execute(new UniqueEntityID(agentId));
      if (agentResult.isFailure) throw new Error("Agent not found");
      const agent = agentResult.getValue();
      
      // Update agent
      const updatedAgent = agent.update({ name: name.trim() });
      if (updatedAgent.isFailure) {
        throw new Error(updatedAgent.getError());
      }
      
      // Save agent
      const saveResult = await AgentService.saveAgent.execute(updatedAgent.getValue());
      if (saveResult.isFailure) {
        throw new Error(saveResult.getError());
      }
      
      // Update flow's ready state since agent changed
      const flow = queryClient.getQueryData<Flow>(flowKeys.detail(flowId));
      if (flow) {
        const updatedFlow = flow.update({});
        await FlowService.saveFlow.execute(updatedFlow.getValue());
      }
      
      return saveResult.getValue();
    },
    
    onMutate: async (name) => {
      startEditing();
      
      await queryClient.cancelQueries({ 
      });
      
      const previousAgent = queryClient.getQueryData(
        agentKeys.detail(agentId)
      );
      
      // Optimistically update agent
      queryClient.setQueryData(
        agentKeys.detail(agentId),
        (old: Agent | undefined) => {
          if (!old) return old;
          const updated = old.update({ name: name.trim() });
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
      
      setIsEditing(false);
      if (editEndTimerRef.current) {
        clearTimeout(editEndTimerRef.current);
      }
    },
    
    onSettled: async (data, error) => {
      if (!error) {
        endEditing();
      }
      
      // Invalidate agent and flow queries
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: agentKeys.detail(agentId)
        }),
        queryClient.invalidateQueries({ 
          queryKey: agentKeys.lists()
        }),
        queryClient.invalidateQueries({ 
          queryKey: flowKeys.validation(flowId)
        })
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

/**
 * Hook for updating agent description
 * Has edit mode for text field with 500ms debounce
 */
export const useUpdateAgentDescription = (flowId: string, agentId: string) => {
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
    mutationFn: async (description: string) => {
      // Get agent
      const agentResult = await AgentService.getAgent.execute(new UniqueEntityID(agentId));
      if (agentResult.isFailure) throw new Error("Agent not found");
      const agent = agentResult.getValue();
      
      // Update agent
      const updatedAgent = agent.update({ description });
      if (updatedAgent.isFailure) {
        throw new Error(updatedAgent.getError());
      }
      
      // Save agent
      const saveResult = await AgentService.saveAgent.execute(updatedAgent.getValue());
      if (saveResult.isFailure) {
        throw new Error(saveResult.getError());
      }
      
      // Update flow's ready state
      const flow = queryClient.getQueryData<Flow>(flowKeys.detail(flowId));
      if (flow) {
        const updatedFlow = flow.update({});
        await FlowService.saveFlow.execute(updatedFlow.getValue());
      }
      
      return saveResult.getValue();
    },
    
    onMutate: async (description) => {
      startEditing();
      
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
          const updated = old.update({ description });
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
      
      setIsEditing(false);
      if (editEndTimerRef.current) {
        clearTimeout(editEndTimerRef.current);
      }
    },
    
    onSettled: async (data, error) => {
      if (!error) {
        endEditing();
      }
      
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: agentKeys.detail(agentId)
        }),
        queryClient.invalidateQueries({ 
          queryKey: agentKeys.lists()
        }),
        queryClient.invalidateQueries({ 
          queryKey: flowKeys.validation(flowId)
        })
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

/**
 * Hook for updating agent color
 * No edit mode needed - color picker
 */
export const useUpdateAgentColor = (flowId: string, agentId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (color: string) => {
      // Get agent
      const agentResult = await AgentService.getAgent.execute(new UniqueEntityID(agentId));
      if (agentResult.isFailure) throw new Error("Agent not found");
      const agent = agentResult.getValue();
      
      // Update agent
      const updatedAgent = agent.update({ color });
      if (updatedAgent.isFailure) {
        throw new Error(updatedAgent.getError());
      }
      
      // Save agent
      const saveResult = await AgentService.saveAgent.execute(updatedAgent.getValue());
      if (saveResult.isFailure) {
        throw new Error(saveResult.getError());
      }
      
      // Update flow's ready state
      const flow = queryClient.getQueryData<Flow>(flowKeys.detail(flowId));
      if (flow) {
        const updatedFlow = flow.update({});
        await FlowService.saveFlow.execute(updatedFlow.getValue());
      }
      
      return saveResult.getValue();
    },
    
    onMutate: async (color) => {
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
          const updated = old.update({ color });
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
          queryKey: agentKeys.lists()
        }),
        queryClient.invalidateQueries({ 
          queryKey: flowKeys.validation(flowId)
        })
      ]);
    },
  });
};