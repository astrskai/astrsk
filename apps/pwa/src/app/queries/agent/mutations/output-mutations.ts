/**
 * Agent Output Mutations
 * 
 * Mutations for agent output configuration using efficient database access
 * Similar to parameter-mutations but for output fields
 */

import { useRef, useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AgentService } from "@/app/services/agent-service";
import { FlowService } from "@/app/services/flow-service";
import { OutputFormat, SchemaField } from "@/modules/agent/domain/agent";
import { agentKeys } from "../query-factory";
import { flowKeys } from "@/app/queries/flow/query-factory";
import { Flow, ReadyState } from "@/modules/flow/domain/flow";

/**
 * Hook for updating agent output configuration
 * Updates output format, streaming, and schema fields directly in database
 * Includes isEditing flag to prevent refetching while user is typing
 */
export const useUpdateAgentOutput = (flowId: string, agentId: string) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
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
  
  const mutation = useMutation({
    mutationFn: async (outputData: {
      enabledStructuredOutput?: boolean;
      outputFormat?: OutputFormat;
      outputStreaming?: boolean;
      schemaName?: string;
      schemaDescription?: string;
      schemaFields?: SchemaField[];
    }) => {
      const result = await AgentService.updateAgentOutput.execute({
        agentId,
        ...outputData
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
      
      return outputData;
    },
    
    onMutate: async (outputData) => {
      startEditing();
      
      // Cancel queries
      await queryClient.cancelQueries({ 
        queryKey: [...agentKeys.all, "output", agentId]
      });
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.detail(flowId)
      });
      
      const previousOutput = queryClient.getQueryData(
        [...agentKeys.all, "output", agentId]
      );
      const previousFlow = queryClient.getQueryData(
        flowKeys.detail(flowId)
      );
      
      // Optimistic update
      queryClient.setQueryData(
        [...agentKeys.all, "output", agentId],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            ...outputData
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
      
      return { previousOutput, previousFlow };
    },
    
    onSuccess: () => {
      endEditing();
      // Invalidate only the output query
      queryClient.invalidateQueries({ 
        queryKey: [...agentKeys.all, "output", agentId]
      });
    },
    
    onError: (error, variables, context) => {
      console.error("Failed to update agent output:", error);
      
      // Rollback on error
      if (context?.previousOutput) {
        queryClient.setQueryData(
          [...agentKeys.all, "output", agentId],
          context.previousOutput
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
    isEditing
  };
};

/**
 * Hook for updating just the output format and streaming settings
 */
export const useUpdateAgentOutputFormat = (flowId: string, agentId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      outputFormat, 
      outputStreaming 
    }: { 
      outputFormat: OutputFormat; 
      outputStreaming: boolean;
    }) => {
      const result = await AgentService.updateAgentOutput.execute({
        agentId,
        outputFormat,
        outputStreaming
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
      
      return { outputFormat, outputStreaming };
    },
    
    onMutate: async ({ outputFormat, outputStreaming }) => {
      // Cancel queries
      await queryClient.cancelQueries({ 
        queryKey: [...agentKeys.all, "output", agentId]
      });
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.detail(flowId)
      });
      
      const previousOutput = queryClient.getQueryData(
        [...agentKeys.all, "output", agentId]
      );
      const previousFlow = queryClient.getQueryData(
        flowKeys.detail(flowId)
      );
      
      // Optimistic update
      queryClient.setQueryData(
        [...agentKeys.all, "output", agentId],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            outputFormat,
            outputStreaming
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
      
      return { previousOutput, previousFlow };
    },
    
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousOutput) {
        queryClient.setQueryData(
          [...agentKeys.all, "output", agentId],
          context.previousOutput
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
      queryClient.invalidateQueries({ 
        queryKey: [...agentKeys.all, "output", agentId]
      });
      // Don't invalidate detail query - causes jittering
      // queryClient.invalidateQueries({ 
      //   queryKey: agentKeys.detail(agentId) 
      // });
    }
  });
};

/**
 * Hook for updating schema fields
 * Handles add, update, remove, and reorder operations
 * Includes isEditing flag to prevent refetching while user is typing
 */
export const useUpdateAgentSchemaFields = (flowId: string, agentId: string) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
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
  
  const mutation = useMutation({
    mutationFn: async (schemaFields: SchemaField[]) => {
      const result = await AgentService.updateAgentOutput.execute({
        agentId,
        schemaFields,
        enabledStructuredOutput: schemaFields.length > 0
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
      
      return schemaFields;
    },
    
    onMutate: async (schemaFields) => {
      startEditing();
      
      // Cancel queries
      await queryClient.cancelQueries({ 
        queryKey: [...agentKeys.all, "output", agentId]
      });
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.detail(flowId)
      });
      
      const previousOutput = queryClient.getQueryData(
        [...agentKeys.all, "output", agentId]
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
        return { previousOutput, previousFlow, skipOptimistic: true };
      }
      
      // Optimistic update
      queryClient.setQueryData(
        [...agentKeys.all, "output", agentId],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            schemaFields,
            enabledStructuredOutput: schemaFields.length > 0
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
      
      return { previousOutput, previousFlow };
    },
    
    onSuccess: () => {
      endEditing();
      queryClient.invalidateQueries({ 
        queryKey: [...agentKeys.all, "output", agentId]
      });
      queryClient.invalidateQueries({ 
        queryKey: agentKeys.detail(agentId) 
      });
    },
    
    onError: (error, variables, context) => {
      console.error("Failed to update schema fields:", error);
      
      // Skip rollback if we skipped optimistic update
      if (context?.skipOptimistic) {
        setIsEditing(false);
        if (editTimeoutRef.current) {
          clearTimeout(editTimeoutRef.current);
        }
        return;
      }
      
      // Rollback on error
      if (context?.previousOutput) {
        queryClient.setQueryData(
          [...agentKeys.all, "output", agentId],
          context.previousOutput
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
    isEditing
  };
};