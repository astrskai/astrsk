/**
 * Agent Structured Output Mutations
 * 
 * Mutations for agent structured output and schema configuration
 */

import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FlowService } from "@/app/services/flow-service";
import { AgentService } from "@/app/services/agent-service";
import { Flow } from "@/modules/flow/domain/flow";
import { 
  Agent, 
  OutputFormat, 
  SchemaField,
  SchemaFieldType 
} from "@/modules/agent/domain/agent";
import { UniqueEntityID } from "@/shared/domain";
import { agentKeys } from "../query-factory";
import { flowKeys } from "@/app/queries/flow/query-factory";

/**
 * Hook for toggling structured output on/off
 */
export const useToggleAgentStructuredOutput = (flowId: string, agentId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (enabledStructuredOutput: boolean) => {
      // Get agent
      const agentResult = await AgentService.getAgent.execute(new UniqueEntityID(agentId));
      if (agentResult.isFailure) throw new Error("Agent not found");
      const agent = agentResult.getValue();
      
      // Update agent
      const updatedAgent = agent.update({ 
        enabledStructuredOutput,
        // Set default output format when enabling
        ...(enabledStructuredOutput && !agent.props.outputFormat && {
          outputFormat: OutputFormat.StructuredOutput
        })
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
    
    onMutate: async (enabledStructuredOutput) => {
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
          const updated = old.update({ 
            enabledStructuredOutput,
            ...(enabledStructuredOutput && !old.props.outputFormat && {
              outputFormat: OutputFormat.StructuredOutput
            })
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

/**
 * Hook for updating output format (structured vs text)
 */
export const useUpdateAgentOutputFormat = (flowId: string, agentId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (outputFormat: OutputFormat) => {
      // Get agent
      const agentResult = await AgentService.getAgent.execute(new UniqueEntityID(agentId));
      if (agentResult.isFailure) throw new Error("Agent not found");
      const agent = agentResult.getValue();
      
      // Update agent
      const updatedAgent = agent.update({ outputFormat });
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
    
    onMutate: async (outputFormat) => {
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
          const updated = old.update({ outputFormat });
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
 * Hook for toggling output streaming
 */
export const useToggleAgentOutputStreaming = (flowId: string, agentId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (outputStreaming: boolean) => {
      // Get agent
      const agentResult = await AgentService.getAgent.execute(new UniqueEntityID(agentId));
      if (agentResult.isFailure) throw new Error("Agent not found");
      const agent = agentResult.getValue();
      
      // Update agent
      const updatedAgent = agent.update({ outputStreaming });
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
    
    onMutate: async (outputStreaming) => {
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
          const updated = old.update({ outputStreaming });
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

/**
 * Hook for updating schema metadata (name and description)
 * Has edit mode for text fields
 */
export const useUpdateAgentSchemaMetadata = (flowId: string, agentId: string) => {
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
    mutationFn: async ({ 
      schemaName, 
      schemaDescription 
    }: { 
      schemaName?: string; 
      schemaDescription?: string;
    }) => {
      // Get agent
      const agentResult = await AgentService.getAgent.execute(new UniqueEntityID(agentId));
      if (agentResult.isFailure) throw new Error("Agent not found");
      const agent = agentResult.getValue();
      
      // Update agent
      const updatedAgent = agent.update({ 
        ...(schemaName !== undefined && { schemaName }),
        ...(schemaDescription !== undefined && { schemaDescription })
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
 * Hook for adding a schema field
 */
export const useAddAgentSchemaField = (flowId: string, agentId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (field: SchemaField) => {
      // Get agent
      const agentResult = await AgentService.getAgent.execute(new UniqueEntityID(agentId));
      if (agentResult.isFailure) throw new Error("Agent not found");
      const agent = agentResult.getValue();
      
      // Add field
      const schemaFields = [...(agent.props.schemaFields || []), field];
      
      const updatedAgent = agent.update({ schemaFields });
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
    
    onMutate: async (field) => {
      await queryClient.cancelQueries({ 
      });
      
      const previousAgent = queryClient.getQueryData<Agent>(
        agentKeys.detail(agentId)
      );
      
      // Optimistically add field
      if (previousAgent) {
        const schemaFields = [...(previousAgent.props.schemaFields || []), field];
        queryClient.setQueryData(
          agentKeys.detail(agentId),
          { ...previousAgent, props: { ...previousAgent.props, schemaFields } }
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
 * Hook for updating a schema field
 * Has edit mode for text fields (name, description)
 */
export const useUpdateAgentSchemaField = (flowId: string, agentId: string) => {
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
    mutationFn: async ({ 
      fieldIndex, 
      updates 
    }: { 
      fieldIndex: number; 
      updates: Partial<SchemaField>;
    }) => {
      // Get agent
      const agentResult = await AgentService.getAgent.execute(new UniqueEntityID(agentId));
      if (agentResult.isFailure) throw new Error("Agent not found");
      const agent = agentResult.getValue();
      
      // Update field
      const schemaFields = [...(agent.props.schemaFields || [])];
      if (fieldIndex < 0 || fieldIndex >= schemaFields.length) {
        throw new Error("Field index out of bounds");
      }
      
      schemaFields[fieldIndex] = { ...schemaFields[fieldIndex], ...updates };
      
      const updatedAgent = agent.update({ schemaFields });
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
    
    onMutate: async ({ fieldIndex, updates }) => {
      // Start edit mode if updating text fields
      if (updates.name !== undefined || updates.description !== undefined) {
        startEditing();
      }
      
      await queryClient.cancelQueries({ 
      });
      
      const previousAgent = queryClient.getQueryData<Agent>(
        agentKeys.detail(agentId)
      );
      
      // Optimistically update field
      if (previousAgent) {
        const schemaFields = [...(previousAgent.props.schemaFields || [])];
        if (fieldIndex >= 0 && fieldIndex < schemaFields.length) {
          schemaFields[fieldIndex] = { ...schemaFields[fieldIndex], ...updates };
          queryClient.setQueryData(
            agentKeys.detail(agentId),
            { ...previousAgent, props: { ...previousAgent.props, schemaFields } }
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
 * Hook for removing a schema field
 */
export const useRemoveAgentSchemaField = (flowId: string, agentId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (fieldIndex: number) => {
      // Get agent
      const agentResult = await AgentService.getAgent.execute(new UniqueEntityID(agentId));
      if (agentResult.isFailure) throw new Error("Agent not found");
      const agent = agentResult.getValue();
      
      // Remove field
      const schemaFields = [...(agent.props.schemaFields || [])];
      if (fieldIndex < 0 || fieldIndex >= schemaFields.length) {
        throw new Error("Field index out of bounds");
      }
      
      schemaFields.splice(fieldIndex, 1);
      
      const updatedAgent = agent.update({ schemaFields });
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
    
    onMutate: async (fieldIndex) => {
      await queryClient.cancelQueries({ 
      });
      
      const previousAgent = queryClient.getQueryData<Agent>(
        agentKeys.detail(agentId)
      );
      
      // Optimistically remove field
      if (previousAgent) {
        const schemaFields = [...(previousAgent.props.schemaFields || [])];
        if (fieldIndex >= 0 && fieldIndex < schemaFields.length) {
          schemaFields.splice(fieldIndex, 1);
          queryClient.setQueryData(
            agentKeys.detail(agentId),
            { ...previousAgent, props: { ...previousAgent.props, schemaFields } }
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
          queryKey: flowKeys.validation(flowId)
        })
      ]);
    },
  });
};

/**
 * Hook for reordering schema fields
 */
export const useReorderAgentSchemaFields = (flowId: string, agentId: string) => {
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
      
      // Reorder fields
      const schemaFields = [...(agent.props.schemaFields || [])];
      const [movedField] = schemaFields.splice(oldIndex, 1);
      schemaFields.splice(newIndex, 0, movedField);
      
      const updatedAgent = agent.update({ schemaFields });
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
    
    onMutate: async ({ oldIndex, newIndex }) => {
      await queryClient.cancelQueries({ 
      });
      
      const previousAgent = queryClient.getQueryData<Agent>(
        agentKeys.detail(agentId)
      );
      
      // Optimistically reorder
      if (previousAgent) {
        const schemaFields = [...(previousAgent.props.schemaFields || [])];
        const [movedField] = schemaFields.splice(oldIndex, 1);
        schemaFields.splice(newIndex, 0, movedField);
        
        queryClient.setQueryData(
          agentKeys.detail(agentId),
          { ...previousAgent, props: { ...previousAgent.props, schemaFields } }
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