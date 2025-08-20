/**
 * Agent Prompt Mutations (New Architecture)
 * 
 * Mutations for agent prompt configuration using efficient database access
 * Handles both chat and text prompt types without loading full agent
 */

import { useRef, useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AgentService } from "@/app/services/agent-service";
import { FlowService } from "@/app/services/flow-service";
import { ApiType } from "@/modules/agent/domain/agent";
import { PromptMessage } from "@/modules/agent/domain";
import { agentKeys } from "../query-factory";
import { flowKeys } from "@/app/queries/flow/query-factory";
import { Flow, ReadyState } from "@/modules/flow/domain/flow";

/**
 * Hook for updating just the API type
 */
export const useUpdateAgentApiType = (flowId: string, agentId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (targetApiType: ApiType) => {
      const result = await AgentService.updateAgentPrompt.execute({
        agentId,
        targetApiType
      });
      
      if (result.isFailure) {
        throw new Error(result.getError());
      }
      
      // Update flow ready state to Draft if it's Ready
      const flow = queryClient.getQueryData<Flow>(flowKeys.detail(flowId));
      if (flow && flow.props && flow.props.readyState === ReadyState.Ready) {
        await FlowService.updateFlowReadyState.execute({
          flowId,
          readyState: ReadyState.Draft
        });
      }
      
      return targetApiType;
    },
    
    onMutate: async (targetApiType) => {
      // Cancel queries
      await queryClient.cancelQueries({ 
        queryKey: agentKeys.prompt(agentId)
      });
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.detail(flowId)
      });
      
      const previousPrompt = queryClient.getQueryData(
        agentKeys.prompt(agentId)
      );
      const previousFlow = queryClient.getQueryData(
        flowKeys.detail(flowId)
      );
      
      // Optimistic update
      queryClient.setQueryData(
        agentKeys.prompt(agentId),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            targetApiType
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
      
      return { previousPrompt, previousFlow };
    },
    
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousPrompt) {
        queryClient.setQueryData(
          agentKeys.prompt(agentId),
          context.previousPrompt
        );
      }
      if (context?.previousFlow) {
        queryClient.setQueryData(
          flowKeys.detail(flowId),
          context.previousFlow
        );
      }
    },
    
    onSuccess: () => {
      Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: agentKeys.prompt(agentId)
        }),
        // Invalidate the full agent detail to refresh all agent data (including preview)
        queryClient.invalidateQueries({ 
          queryKey: agentKeys.detail(agentId)
        })
      ]);
    }
  });
};

/**
 * Hook for updating prompt messages (chat mode)
 * Includes debounce handling for text input
 */
export const useUpdateAgentPromptMessages = (flowId: string, agentId: string) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [hasCursor, setHasCursor] = useState(false);
  const editTimeoutRef = useRef<NodeJS.Timeout>();
  const cursorTimeoutRef = useRef<NodeJS.Timeout>();
  
  const startEditing = useCallback(() => {
    setIsEditing(true);
    if (editTimeoutRef.current) {
      clearTimeout(editTimeoutRef.current);
    }
  }, []);
  
  const endEditing = useCallback(() => {
    if (editTimeoutRef.current) {
      clearTimeout(editTimeoutRef.current);
    }
    editTimeoutRef.current = setTimeout(() => {
      setIsEditing(false);
    }, 500);
  }, []);
  
  const setCursorActive = useCallback((active: boolean) => {
    setHasCursor(active);
  }, []);
  
  const mutation = useMutation({
    mutationFn: async (promptMessages: PromptMessage[]) => {
      const result = await AgentService.updateAgentPrompt.execute({
        agentId,
        promptMessages
      });
      
      if (result.isFailure) {
        throw new Error(result.getError());
      }
      
      // Update flow ready state to Draft if it's Ready
      const flow = queryClient.getQueryData<Flow>(flowKeys.detail(flowId));
      if (flow && flow.props && flow.props.readyState === ReadyState.Ready) {
        await FlowService.updateFlowReadyState.execute({
          flowId,
          readyState: ReadyState.Draft
        });
      }
      
      return promptMessages;
    },
    
    onMutate: async (promptMessages) => {
      startEditing();
      
      // Cancel queries
      await queryClient.cancelQueries({ 
        queryKey: agentKeys.prompt(agentId)
      });
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.detail(flowId)
      });
      
      const previousPrompt = queryClient.getQueryData(
        agentKeys.prompt(agentId)
      );
      const previousFlow = queryClient.getQueryData(
        flowKeys.detail(flowId)
      );
      
      // Check for other pending mutations
      const mutations = queryClient.getMutationCache().getAll();
      const hasPendingAgentMutations = mutations.some(
        m => m.state.status === 'pending' && 
             m.options.mutationKey?.includes(agentId)
      );
      
      if (hasPendingAgentMutations) {
        console.warn('Other mutations pending for agent:', agentId);
        // Skip optimistic update during concurrent edits
        return { previousPrompt, previousFlow, skipOptimistic: true };
      }
      
      // Optimistic update
      queryClient.setQueryData(
        agentKeys.prompt(agentId),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            promptMessages
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
      
      return { previousPrompt, previousFlow };
    },
    
    onSuccess: () => {
      endEditing();
      // TODO: Query invalidation causes editor jitter - investigate better solution
      // Possible approaches:
      // 1. Use uncontrolled editor component
      // 2. Delay invalidation until after cursor leaves editor
      // 3. Use separate cache key for editor state vs display state
      Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: agentKeys.prompt(agentId)
        }),
        // Invalidate the full agent detail to refresh all agent data (including preview)
        queryClient.invalidateQueries({ 
          queryKey: agentKeys.detail(agentId)
        })
      ]);
    },
    
    onError: (error, variables, context) => {
      console.error("Failed to update prompt messages:", error);
      
      // Skip rollback if we skipped optimistic update
      if (context?.skipOptimistic) {
        setIsEditing(false);
        if (editTimeoutRef.current) {
          clearTimeout(editTimeoutRef.current);
        }
        return;
      }
      
      // Rollback on error
      if (context?.previousPrompt) {
        queryClient.setQueryData(
          agentKeys.prompt(agentId),
          context.previousPrompt
        );
      }
      if (context?.previousFlow) {
        queryClient.setQueryData(
          flowKeys.detail(flowId),
          context.previousFlow
        );
      }
      
      setIsEditing(false);
      if (editTimeoutRef.current) {
        clearTimeout(editTimeoutRef.current);
      }
    }
  });
  
  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isEditing,
    hasCursor,
    setCursorActive
  };
};

/**
 * Hook for updating text prompt (text mode)
 * Includes debounce handling for text input
 */
export const useUpdateAgentTextPrompt = (flowId: string, agentId: string) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [hasCursor, setHasCursor] = useState(false);
  const editTimeoutRef = useRef<NodeJS.Timeout>();
  
  const startEditing = useCallback(() => {
    setIsEditing(true);
    if (editTimeoutRef.current) {
      clearTimeout(editTimeoutRef.current);
    }
  }, []);
  
  const endEditing = useCallback(() => {
    if (editTimeoutRef.current) {
      clearTimeout(editTimeoutRef.current);
    }
    editTimeoutRef.current = setTimeout(() => {
      setIsEditing(false);
    }, 500);
  }, []);
  
  const setCursorActive = useCallback((active: boolean) => {
    setHasCursor(active);
  }, []);
  
  const mutation = useMutation({
    mutationFn: async (textPrompt: string) => {
      const result = await AgentService.updateAgentPrompt.execute({
        agentId,
        textPrompt
      });
      
      if (result.isFailure) {
        throw new Error(result.getError());
      }
      
      // Update flow ready state to Draft if it's Ready
      const flow = queryClient.getQueryData<Flow>(flowKeys.detail(flowId));
      if (flow && flow.props && flow.props.readyState === ReadyState.Ready) {
        await FlowService.updateFlowReadyState.execute({
          flowId,
          readyState: ReadyState.Draft
        });
      }
      
      return textPrompt;
    },
    
    onMutate: async (textPrompt) => {
      startEditing();
      
      // Cancel queries
      await queryClient.cancelQueries({ 
        queryKey: agentKeys.prompt(agentId)
      });
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.detail(flowId)
      });
      
      const previousPrompt = queryClient.getQueryData(
        agentKeys.prompt(agentId)
      );
      const previousFlow = queryClient.getQueryData(
        flowKeys.detail(flowId)
      );
      
      // Check for other pending mutations
      const mutations = queryClient.getMutationCache().getAll();
      const hasPendingAgentMutations = mutations.some(
        m => m.state.status === 'pending' && 
             m.options.mutationKey?.includes(agentId)
      );
      
      if (hasPendingAgentMutations) {
        console.warn('Other mutations pending for agent:', agentId);
        // Skip optimistic update during concurrent edits
        return { previousPrompt, previousFlow, skipOptimistic: true };
      }
      
      // Optimistic update
      queryClient.setQueryData(
        agentKeys.prompt(agentId),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            textPrompt
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
      
      return { previousPrompt, previousFlow };
    },
    
    onSuccess: () => {
      endEditing();
      // TODO: Query invalidation causes editor jitter - investigate better solution
      // Possible approaches:
      // 1. Use uncontrolled editor component
      // 2. Delay invalidation until after cursor leaves editor
      // 3. Use separate cache key for editor state vs display state
      Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: agentKeys.prompt(agentId)
        }),
        // Invalidate the full agent detail to refresh all agent data (including preview)
        queryClient.invalidateQueries({ 
          queryKey: agentKeys.detail(agentId)
        })
      ]);
    },
    
    onError: (error, variables, context) => {
      console.error("Failed to update text prompt:", error);
      
      // Skip rollback if we skipped optimistic update
      if (context?.skipOptimistic) {
        setIsEditing(false);
        if (editTimeoutRef.current) {
          clearTimeout(editTimeoutRef.current);
        }
        return;
      }
      
      // Rollback on error
      if (context?.previousPrompt) {
        queryClient.setQueryData(
          agentKeys.prompt(agentId),
          context.previousPrompt
        );
      }
      if (context?.previousFlow) {
        queryClient.setQueryData(
          flowKeys.detail(flowId),
          context.previousFlow
        );
      }
      
      setIsEditing(false);
      if (editTimeoutRef.current) {
        clearTimeout(editTimeoutRef.current);
      }
    }
  });
  
  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isEditing,
    hasCursor,
    setCursorActive
  };
};