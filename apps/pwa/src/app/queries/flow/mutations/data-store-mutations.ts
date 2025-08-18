/**
 * Data Store Mutation Hooks
 * 
 * Mutations for data store schema and node field operations
 */

import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FlowService } from "@/app/services/flow-service";
import { UniqueEntityID } from "@/shared/domain";
import { 
  Flow,
  DataStoreSchemaField,
  DataStoreField,
  DataStoreSchema 
} from "@/modules/flow/domain/flow";
import * as optimistic from "../optimistic-updates";
import { flowKeys } from "../query-factory";

/**
 * Hook for updating the entire data store schema
 * Use this for batch updates to avoid multiple saves
 * 
 * @returns mutation with isEditing state for preventing race conditions
 */
export const useUpdateDataStoreSchema = (flowId: string) => {
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
    mutationFn: async (schema: DataStoreSchema) => {
      // Use dedicated method that only updates the data store schema
      // This avoids race conditions where we might overwrite other fields
      const result = await FlowService.updateDataStoreSchema.execute({
        flowId,
        schema
      });
      
      if (result.isFailure) {
        throw new Error(result.getError());
      }
      
      return schema;
    },
    
    onMutate: async (schema) => {
      startEditing();
      
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.dataStoreSchema(flowId) 
      });
      
      const previousSchema = queryClient.getQueryData(
        flowKeys.dataStoreSchema(flowId)
      );
      
      // No optimistic update - let the mutation complete
      
      return { previousSchema };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousSchema !== undefined) {
        queryClient.setQueryData(
          flowKeys.dataStoreSchema(flowId),
          context.previousSchema
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
      
      // Only invalidate the data store schema query - we only changed the schema
      await queryClient.invalidateQueries({ queryKey: flowKeys.dataStoreSchema(flowId) });
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
 * Hook for updating a single data store schema field
 * Use this for updating field properties (name, type, initial value)
 * 
 * @returns mutation with isEditing state for text field updates
 */
export const useUpdateDataStoreSchemaField = (flowId: string) => {
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
      fieldId, 
      updates 
    }: { 
      fieldId: string; 
      updates: Partial<DataStoreSchemaField> 
    }) => {
      // Get current schema
      const flowOrError = await FlowService.getFlow.execute(
        new UniqueEntityID(flowId)
      );
      if (flowOrError.isFailure) {
        throw new Error(flowOrError.getError());
      }
      
      const flow = flowOrError.getValue();
      const currentSchema = flow.props.dataStoreSchema;
      if (!currentSchema) throw new Error("No data store schema found");
      
      const updatedFields = currentSchema.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      );
      
      const updatedSchema: DataStoreSchema = {
        ...currentSchema,
        fields: updatedFields
      };
      
      // Use targeted schema update instead of saveFlow
      const saveResult = await FlowService.updateDataStoreSchema.execute({
        flowId,
        schema: updatedSchema
      });
      
      if (saveResult.isFailure) {
        throw new Error(saveResult.getError());
      }
      
      return updatedSchema;
    },
    
    onMutate: async ({ fieldId, updates }) => {
      startEditing();
      
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.dataStoreField(flowId, fieldId) 
      });
      
      const previousField = queryClient.getQueryData(
        flowKeys.dataStoreField(flowId, fieldId)
      );
      
      optimistic.updateDataStoreField(queryClient, flowId, fieldId, (old) => ({
        ...old,
        ...updates
      }));
      
      return { previousField, fieldId };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousField) {
        queryClient.setQueryData(
          flowKeys.dataStoreField(flowId, variables.fieldId),
          context.previousField
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
        queryClient.invalidateQueries({ queryKey: flowKeys.dataStoreSchema(flowId) }),
        queryClient.invalidateQueries({ queryKey: flowKeys.dataStoreFields(flowId) })
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
 * Hook for adding a new data store schema field
 */
export const useAddDataStoreSchemaField = (flowId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (field: DataStoreSchemaField) => {
      // Get current schema
      const flowOrError = await FlowService.getFlow.execute(
        new UniqueEntityID(flowId)
      );
      if (flowOrError.isFailure) {
        throw new Error(flowOrError.getError());
      }
      
      const flow = flowOrError.getValue();
      const currentSchema = flow.props.dataStoreSchema || { fields: [] };
      
      const updatedSchema: DataStoreSchema = {
        ...currentSchema,
        fields: [...currentSchema.fields, field]
      };
      
      // Use targeted schema update instead of saveFlow
      const saveResult = await FlowService.updateDataStoreSchema.execute({
        flowId,
        schema: updatedSchema
      });
      
      if (saveResult.isFailure) {
        throw new Error(saveResult.getError());
      }
      
      return updatedSchema;
    },
    
    onMutate: async (field) => {
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.dataStoreFields(flowId) 
      });
      
      const previousFields = queryClient.getQueryData(
        flowKeys.dataStoreFields(flowId)
      );
      
      queryClient.setQueryData<DataStoreSchemaField[]>(
        flowKeys.dataStoreFields(flowId),
        (old) => [...(old || []), field]
      );
      
      return { previousFields };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousFields) {
        queryClient.setQueryData(
          flowKeys.dataStoreFields(flowId),
          context.previousFields
        );
      }
    },
    
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: flowKeys.dataStoreSchema(flowId) }),
        queryClient.invalidateQueries({ queryKey: flowKeys.dataStoreFields(flowId) })
      ]);
    },
  });
};

/**
 * Hook for removing a data store schema field
 */
export const useRemoveDataStoreSchemaField = (flowId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (fieldId: string) => {
      // Get current schema
      const flowOrError = await FlowService.getFlow.execute(
        new UniqueEntityID(flowId)
      );
      if (flowOrError.isFailure) {
        throw new Error(flowOrError.getError());
      }
      
      const flow = flowOrError.getValue();
      const currentSchema = flow.props.dataStoreSchema;
      if (!currentSchema) throw new Error("No data store schema found");
      
      const updatedSchema: DataStoreSchema = {
        ...currentSchema,
        fields: currentSchema.fields.filter(f => f.id !== fieldId)
      };
      
      // Use targeted schema update instead of saveFlow
      const saveResult = await FlowService.updateDataStoreSchema.execute({
        flowId,
        schema: updatedSchema
      });
      
      if (saveResult.isFailure) {
        throw new Error(saveResult.getError());
      }
      
      return updatedSchema;
    },
    
    onMutate: async (fieldId) => {
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.dataStoreFields(flowId) 
      });
      
      const previousFields = queryClient.getQueryData(
        flowKeys.dataStoreFields(flowId)
      );
      
      queryClient.setQueryData<DataStoreSchemaField[]>(
        flowKeys.dataStoreFields(flowId),
        (old) => old?.filter(f => f.id !== fieldId)
      );
      
      queryClient.removeQueries({ 
        queryKey: flowKeys.dataStoreField(flowId, fieldId) 
      });
      
      return { previousFields, fieldId };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousFields) {
        queryClient.setQueryData(
          flowKeys.dataStoreFields(flowId),
          context.previousFields
        );
      }
    },
    
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: flowKeys.dataStoreSchema(flowId) }),
        queryClient.invalidateQueries({ queryKey: flowKeys.dataStoreFields(flowId) })
      ]);
    },
  });
};

/**
 * Hook for reordering data store schema fields
 */
export const useReorderDataStoreSchemaFields = (flowId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      oldIndex, 
      newIndex 
    }: { 
      oldIndex: number; 
      newIndex: number;
    }) => {
      // Get current schema
      const flowOrError = await FlowService.getFlow.execute(
        new UniqueEntityID(flowId)
      );
      if (flowOrError.isFailure) {
        throw new Error(flowOrError.getError());
      }
      
      const flow = flowOrError.getValue();
      const currentSchema = flow.props.dataStoreSchema;
      if (!currentSchema) throw new Error("No data store schema found");
      
      const fields = [...currentSchema.fields];
      const [movedField] = fields.splice(oldIndex, 1);
      fields.splice(newIndex, 0, movedField);
      
      const updatedSchema: DataStoreSchema = {
        ...currentSchema,
        fields
      };
      
      // Use targeted schema update instead of saveFlow
      const saveResult = await FlowService.updateDataStoreSchema.execute({
        flowId,
        schema: updatedSchema
      });
      
      if (saveResult.isFailure) {
        throw new Error(saveResult.getError());
      }
      
      return updatedSchema;
    },
    
    onMutate: async ({ oldIndex, newIndex }) => {
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.dataStoreFields(flowId) 
      });
      
      const previousFields = queryClient.getQueryData<DataStoreSchemaField[]>(
        flowKeys.dataStoreFields(flowId)
      );
      
      if (previousFields) {
        const fields = [...previousFields];
        const [movedField] = fields.splice(oldIndex, 1);
        fields.splice(newIndex, 0, movedField);
        
        queryClient.setQueryData(
          flowKeys.dataStoreFields(flowId),
          fields
        );
      }
      
      return { previousFields };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousFields) {
        queryClient.setQueryData(
          flowKeys.dataStoreFields(flowId),
          context.previousFields
        );
      }
    },
    
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: flowKeys.dataStoreSchema(flowId) }),
        queryClient.invalidateQueries({ queryKey: flowKeys.dataStoreFields(flowId) })
      ]);
    },
  });
};

/**
 * Hook for updating data store node runtime field values
 */
export const useUpdateDataStoreNodeField = (flowId: string, nodeId: string) => {
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
      fieldId,
      value, 
      logic 
    }: { 
      fieldId: string;
      value?: string; 
      logic?: string;
    }) => {
      const flow = queryClient.getQueryData<Flow>(flowKeys.detail(flowId));
      if (!flow) throw new Error("Flow not found");
      
      const nodes = flow.props.nodes;
      const nodeIndex = nodes.findIndex(n => n.id === nodeId);
      if (nodeIndex === -1) throw new Error("Node not found");
      
      const node = nodes[nodeIndex];
      if (node.type !== 'dataStore') throw new Error("Not a data store node");
      
      const currentFields = (node.data as any).dataStoreFields || [];
      const fieldIndex = currentFields.findIndex((f: DataStoreField) => f.id === fieldId);
      
      if (fieldIndex === -1) {
        throw new Error(`Field with id ${fieldId} not found in node ${nodeId}`);
      }
      
      const updatedFields = [...currentFields];
      updatedFields[fieldIndex] = {
        ...updatedFields[fieldIndex],
        ...(value !== undefined && { value }),
        ...(logic !== undefined && { logic })
      };
      
      const updatedNode = {
        ...node,
        data: {
          ...node.data,
          dataStoreFields: updatedFields
        }
      };
      
      const updatedNodes = [...nodes];
      updatedNodes[nodeIndex] = updatedNode;
      
      const updatedFlow = flow.update({ nodes: updatedNodes });
      
      if (updatedFlow.isFailure) {
        throw new Error(updatedFlow.getError());
      }
      
      const saveResult = await FlowService.saveFlow.execute(updatedFlow.getValue());
      if (saveResult.isFailure) {
        throw new Error(saveResult.getError());
      }
      
      return saveResult.getValue();
    },
    
    onMutate: async (variables) => {
      startEditing();
      
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.dataStoreRuntime(flowId, nodeId) 
      });
      
      const previousRuntime = queryClient.getQueryData(
        flowKeys.dataStoreRuntime(flowId, nodeId)
      );
      
      return { previousRuntime };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousRuntime) {
        queryClient.setQueryData(
          flowKeys.dataStoreRuntime(flowId, nodeId),
          context.previousRuntime
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
          queryKey: flowKeys.node(flowId, nodeId) 
        }),
        queryClient.invalidateQueries({ 
          queryKey: flowKeys.dataStoreRuntime(flowId, nodeId) 
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
 * Hook for adding a data store field to a node
 */
export const useAddDataStoreNodeField = (flowId: string, nodeId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (field: DataStoreField) => {
      const flow = queryClient.getQueryData<Flow>(flowKeys.detail(flowId));
      if (!flow) throw new Error("Flow not found");
      
      const nodes = [...flow.props.nodes];
      const nodeIndex = nodes.findIndex(n => n.id === nodeId);
      if (nodeIndex === -1) throw new Error("Node not found");
      
      const node = nodes[nodeIndex];
      if (node.type !== 'dataStore') throw new Error("Not a data store node");
      
      const currentFields = (node.data as any).dataStoreFields || [];
      
      if (currentFields.some((f: DataStoreField) => f.id === field.id)) {
        throw new Error("Field with this ID already exists");
      }
      
      const updatedNode = {
        ...node,
        data: {
          ...node.data,
          dataStoreFields: [...currentFields, field]
        }
      };
      
      nodes[nodeIndex] = updatedNode;
      
      const updatedFlow = flow.update({ nodes });
      
      if (updatedFlow.isFailure) {
        throw new Error(updatedFlow.getError());
      }
      
      const saveResult = await FlowService.saveFlow.execute(updatedFlow.getValue());
      if (saveResult.isFailure) {
        throw new Error(saveResult.getError());
      }
      
      return saveResult.getValue();
    },
    
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: flowKeys.node(flowId, nodeId) 
        }),
        queryClient.invalidateQueries({ 
          queryKey: flowKeys.dataStoreRuntime(flowId, nodeId) 
        })
      ]);
    },
  });
};

/**
 * Hook for removing a data store field from a node
 */
export const useRemoveDataStoreNodeField = (flowId: string, nodeId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (fieldId: string) => {
      const flow = queryClient.getQueryData<Flow>(flowKeys.detail(flowId));
      if (!flow) throw new Error("Flow not found");
      
      const nodes = [...flow.props.nodes];
      const nodeIndex = nodes.findIndex(n => n.id === nodeId);
      if (nodeIndex === -1) throw new Error("Node not found");
      
      const node = nodes[nodeIndex];
      if (node.type !== 'dataStore') throw new Error("Not a data store node");
      
      const currentFields = (node.data as any).dataStoreFields || [];
      
      const updatedNode = {
        ...node,
        data: {
          ...node.data,
          dataStoreFields: currentFields.filter((f: DataStoreField) => f.id !== fieldId)
        }
      };
      
      nodes[nodeIndex] = updatedNode;
      
      const updatedFlow = flow.update({ nodes });
      
      if (updatedFlow.isFailure) {
        throw new Error(updatedFlow.getError());
      }
      
      const saveResult = await FlowService.saveFlow.execute(updatedFlow.getValue());
      if (saveResult.isFailure) {
        throw new Error(saveResult.getError());
      }
      
      return saveResult.getValue();
    },
    
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: flowKeys.node(flowId, nodeId) 
        }),
        queryClient.invalidateQueries({ 
          queryKey: flowKeys.dataStoreRuntime(flowId, nodeId) 
        })
      ]);
    },
  });
};

/**
 * Hook for reordering data store fields in a node
 */
export const useReorderDataStoreNodeFields = (flowId: string, nodeId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      oldIndex, 
      newIndex 
    }: { 
      oldIndex: number; 
      newIndex: number;
    }) => {
      const flow = queryClient.getQueryData<Flow>(flowKeys.detail(flowId));
      if (!flow) throw new Error("Flow not found");
      
      const nodes = [...flow.props.nodes];
      const nodeIndex = nodes.findIndex(n => n.id === nodeId);
      if (nodeIndex === -1) throw new Error("Node not found");
      
      const node = nodes[nodeIndex];
      if (node.type !== 'dataStore') throw new Error("Not a data store node");
      
      const currentFields = [...((node.data as any).dataStoreFields || [])];
      
      const [movedField] = currentFields.splice(oldIndex, 1);
      currentFields.splice(newIndex, 0, movedField);
      
      const updatedNode = {
        ...node,
        data: {
          ...node.data,
          dataStoreFields: currentFields
        }
      };
      
      nodes[nodeIndex] = updatedNode;
      
      const updatedFlow = flow.update({ nodes });
      
      if (updatedFlow.isFailure) {
        throw new Error(updatedFlow.getError());
      }
      
      const saveResult = await FlowService.saveFlow.execute(updatedFlow.getValue());
      if (saveResult.isFailure) {
        throw new Error(saveResult.getError());
      }
      
      return saveResult.getValue();
    },
    
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: flowKeys.node(flowId, nodeId) 
        }),
        queryClient.invalidateQueries({ 
          queryKey: flowKeys.dataStoreRuntime(flowId, nodeId) 
        })
      ]);
    },
  });
};