/**
 * Agent Prompt Mutations
 * 
 * Mutations for agent prompt and message operations
 */

import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FlowService } from "@/app/services/flow-service";
import { AgentService } from "@/app/services/agent-service";
import { Flow } from "@/modules/flow/domain/flow";
import { Agent } from "@/modules/agent/domain/agent";
import { 
  PromptMessage, 
  PlainPromptMessage,
  PromptBlock,
  UpdatePromptMessageProps,
  UpdateBlockProps
} from "@/modules/agent/domain";
import { UniqueEntityID } from "@/shared/domain";
import { agentKeys } from "../query-factory";
import { flowKeys } from "@/app/queries/flow/query-factory";

/**
 * Hook for updating text prompt (for text completion agents)
 * Has edit mode for text field
 */
export const useUpdateAgentTextPrompt = (flowId: string, agentId: string) => {
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
    mutationFn: async (textPrompt: string) => {
      // Get agent
      const agentResult = await AgentService.getAgent.execute(new UniqueEntityID(agentId));
      if (agentResult.isFailure) throw new Error("Agent not found");
      const agent = agentResult.getValue();
      
      // Update agent
      const updatedAgent = agent.update({ textPrompt });
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
    
    onMutate: async (textPrompt) => {
      startEditing();
      
      await queryClient.cancelQueries({ 
        queryKey: agentKeys.detail(agentId)
      });
      
      const previousAgent = queryClient.getQueryData(
        agentKeys.detail(agentId)
      );
      
      // Optimistically update
      queryClient.setQueryData(
        agentKeys.detail(agentId),
        (old: Agent | undefined) => {
          if (!old) return old;
          const updated = old.update({ textPrompt });
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
 * Hook for adding a prompt message to an agent
 */
export const useAddAgentPromptMessage = (flowId: string, agentId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (message: PromptMessage) => {
      // Get agent
      const agentResult = await AgentService.getAgent.execute(new UniqueEntityID(agentId));
      if (agentResult.isFailure) throw new Error("Agent not found");
      const agent = agentResult.getValue();
      
      // Add message
      const addResult = agent.addMessage(message);
      if (addResult.isFailure) {
        throw new Error(addResult.getError());
      }
      
      // Save agent
      const saveResult = await AgentService.saveAgent.execute(agent);
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
    
    onMutate: async (message) => {
      await queryClient.cancelQueries({ 
        queryKey: agentKeys.detail(agentId)
      });
      
      const previousAgent = queryClient.getQueryData(
        agentKeys.detail(agentId)
      );
      
      // Optimistically add message
      queryClient.setQueryData(
        agentKeys.detail(agentId),
        (old: Agent | undefined) => {
          if (!old) return old;
          const updated = old.addMessage(message);
          return updated.isSuccess ? old : old;
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

/**
 * Hook for removing a prompt message from an agent
 */
export const useRemoveAgentPromptMessage = (flowId: string, agentId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (messageId: string) => {
      // Get agent
      const agentResult = await AgentService.getAgent.execute(new UniqueEntityID(agentId));
      if (agentResult.isFailure) throw new Error("Agent not found");
      const agent = agentResult.getValue();
      
      // Remove message
      const messages = agent.props.promptMessages.filter(
        m => m.id.toString() !== messageId
      );
      
      const updatedAgent = agent.update({ promptMessages: messages });
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
    
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ 
        queryKey: agentKeys.detail(agentId) 
      });
      
      const previousAgent = queryClient.getQueryData<Agent>(
        agentKeys.detail(agentId)
      );
      
      // Optimistically remove message
      if (previousAgent) {
        const messages = previousAgent.props.promptMessages.filter(
          m => m.id.toString() !== messageId
        );
        queryClient.setQueryData(
          agentKeys.detail(agentId),
          { ...previousAgent, props: { ...previousAgent.props, promptMessages: messages } }
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
          queryKey: agentKeys.lists()
        }),
        queryClient.invalidateQueries({ 
          queryKey: flowKeys.validation(flowId) 
        })
      ]);
    },
  });
};

/**
 * Hook for updating a prompt message
 * Has edit mode for text content
 */
export const useUpdateAgentPromptMessage = (flowId: string, agentId: string, messageId: string) => {
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
    mutationFn: async (updates: UpdatePromptMessageProps) => {
      // Get agent
      const agentResult = await AgentService.getAgent.execute(new UniqueEntityID(agentId));
      if (agentResult.isFailure) throw new Error("Agent not found");
      const agent = agentResult.getValue();
      
      // Find and update message
      const messageIndex = agent.props.promptMessages.findIndex(
        m => m.id.toString() === messageId
      );
      if (messageIndex === -1) throw new Error("Message not found");
      
      const message = agent.props.promptMessages[messageIndex];
      const updateResult = message.update(updates);
      if (updateResult.isFailure) {
        throw new Error(updateResult.getError());
      }
      
      // Save agent
      const saveResult = await AgentService.saveAgent.execute(agent);
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
    
    onMutate: async (updates) => {
      startEditing();
      
      await queryClient.cancelQueries({ 
        queryKey: agentKeys.detail(agentId) 
      });
      
      const previousAgent = queryClient.getQueryData<Agent>(
        agentKeys.detail(agentId)
      );
      
      // Optimistically update message
      if (previousAgent) {
        const messages = [...previousAgent.props.promptMessages];
        const messageIndex = messages.findIndex(m => m.id.toString() === messageId);
        if (messageIndex !== -1) {
          messages[messageIndex].update(updates);
          queryClient.setQueryData(
            agentKeys.detail(agentId),
            { ...previousAgent, props: { ...previousAgent.props, promptMessages: messages } }
          );
        }
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
 * Hook for reordering prompt messages
 */
export const useReorderAgentPromptMessages = (flowId: string, agentId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      oldIndex, 
      newIndex 
    }: { 
      oldIndex: number; 
      newIndex: number;
    }) => {
      // Get agent
      const agentResult = await AgentService.getAgent.execute(new UniqueEntityID(agentId));
      if (agentResult.isFailure) throw new Error("Agent not found");
      const agent = agentResult.getValue();
      
      // Reorder messages
      const messages = [...agent.props.promptMessages];
      const [movedMessage] = messages.splice(oldIndex, 1);
      messages.splice(newIndex, 0, movedMessage);
      
      const updatedAgent = agent.update({ promptMessages: messages });
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
    
    onMutate: async ({ oldIndex, newIndex }) => {
      await queryClient.cancelQueries({ 
        queryKey: agentKeys.detail(agentId) 
      });
      
      const previousAgent = queryClient.getQueryData<Agent>(
        agentKeys.detail(agentId)
      );
      
      // Optimistically reorder
      if (previousAgent) {
        const messages = [...previousAgent.props.promptMessages];
        const [movedMessage] = messages.splice(oldIndex, 1);
        messages.splice(newIndex, 0, movedMessage);
        
        queryClient.setQueryData(
          agentKeys.detail(agentId),
          { ...previousAgent, props: { ...previousAgent.props, promptMessages: messages } }
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
          queryKey: agentKeys.lists()
        }),
        queryClient.invalidateQueries({ 
          queryKey: flowKeys.validation(flowId) 
        })
      ]);
    },
  });
};

/**
 * Hook for toggling prompt message enabled state
 */
export const useToggleAgentPromptMessage = (flowId: string, agentId: string, messageId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      // Get agent
      const agentResult = await AgentService.getAgent.execute(new UniqueEntityID(agentId));
      if (agentResult.isFailure) throw new Error("Agent not found");
      const agent = agentResult.getValue();
      
      // Find and update message
      const messageIndex = agent.props.promptMessages.findIndex(
        m => m.id.toString() === messageId
      );
      if (messageIndex === -1) throw new Error("Message not found");
      
      const message = agent.props.promptMessages[messageIndex];
      const updateResult = message.update({ enabled });
      if (updateResult.isFailure) {
        throw new Error(updateResult.getError());
      }
      
      // Save agent
      const saveResult = await AgentService.saveAgent.execute(agent);
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
    
    onMutate: async (enabled) => {
      await queryClient.cancelQueries({ 
        queryKey: agentKeys.detail(agentId) 
      });
      
      const previousAgent = queryClient.getQueryData<Agent>(
        agentKeys.detail(agentId)
      );
      
      // Optimistically update
      if (previousAgent) {
        const messages = [...previousAgent.props.promptMessages];
        const messageIndex = messages.findIndex(m => m.id.toString() === messageId);
        if (messageIndex !== -1) {
          messages[messageIndex].update({ enabled });
          queryClient.setQueryData(
            agentKeys.detail(agentId),
            { ...previousAgent, props: { ...previousAgent.props, promptMessages: messages } }
          );
        }
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
          queryKey: agentKeys.lists()
        }),
        queryClient.invalidateQueries({ 
          queryKey: flowKeys.validation(flowId) 
        })
      ]);
    },
  });
};