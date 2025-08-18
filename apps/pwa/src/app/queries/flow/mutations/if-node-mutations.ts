/**
 * If Node Mutation Hooks
 * 
 * Mutations for If node condition operations
 */

import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FlowService } from "@/app/services/flow-service";
import { Flow, Node } from "@/modules/flow/domain/flow";
import { IfCondition, IfNodeData } from "@/flow-multi/nodes/if-node";
import * as optimistic from "../optimistic-updates";
import { flowKeys } from "../query-factory";

/**
 * Hook for updating If node logic operator (AND/OR)
 */
export const useUpdateIfNodeOperator = (flowId: string, nodeId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (logicOperator: 'AND' | 'OR') => {
      const flow = queryClient.getQueryData<Flow>(flowKeys.detail(flowId));
      if (!flow) throw new Error("Flow not found");
      
      const nodes = [...flow.props.nodes];
      const nodeIndex = nodes.findIndex(n => n.id === nodeId);
      if (nodeIndex === -1) throw new Error("Node not found");
      
      const node = nodes[nodeIndex];
      if (node.type !== 'if') throw new Error("Not an if node");
      
      const updatedNode = {
        ...node,
        data: {
          ...node.data,
          logicOperator
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
    
    onMutate: async (logicOperator) => {
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.node(flowId, nodeId) 
      });
      
      const previousNode = queryClient.getQueryData(
        flowKeys.node(flowId, nodeId)
      );
      
      optimistic.updateNode(queryClient, flowId, nodeId, (old) => ({
        ...old,
        data: {
          ...old.data,
          logicOperator
        }
      }));
      
      return { previousNode };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousNode) {
        queryClient.setQueryData(
          flowKeys.node(flowId, nodeId),
          context.previousNode
        );
      }
    },
    
    onSettled: async () => {
      await queryClient.invalidateQueries({ 
        queryKey: flowKeys.node(flowId, nodeId) 
      });
    },
  });
};

/**
 * Hook for updating a single condition in an If node
 * Has edit mode for text fields (value1, value2)
 */
export const useUpdateIfNodeCondition = (flowId: string, nodeId: string) => {
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
      conditionId, 
      updates 
    }: { 
      conditionId: string; 
      updates: Partial<IfCondition> 
    }) => {
      const flow = queryClient.getQueryData<Flow>(flowKeys.detail(flowId));
      if (!flow) throw new Error("Flow not found");
      
      const nodes = [...flow.props.nodes];
      const nodeIndex = nodes.findIndex(n => n.id === nodeId);
      if (nodeIndex === -1) throw new Error("Node not found");
      
      const node = nodes[nodeIndex];
      if (node.type !== 'if') throw new Error("Not an if node");
      
      const nodeData = node.data as IfNodeData;
      const conditions = nodeData.conditions || [];
      const conditionIndex = conditions.findIndex(c => c.id === conditionId);
      
      if (conditionIndex === -1) {
        throw new Error(`Condition with id ${conditionId} not found`);
      }
      
      const updatedConditions = [...conditions];
      updatedConditions[conditionIndex] = {
        ...updatedConditions[conditionIndex],
        ...updates
      };
      
      const updatedNode = {
        ...node,
        data: {
          ...node.data,
          conditions: updatedConditions
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
    
    onMutate: async ({ conditionId, updates }) => {
      // Start edit mode if updating text fields
      if (updates.value1 !== undefined || updates.value2 !== undefined) {
        startEditing();
      }
      
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.node(flowId, nodeId) 
      });
      
      const previousNode = queryClient.getQueryData(
        flowKeys.node(flowId, nodeId)
      );
      
      optimistic.updateNode(queryClient, flowId, nodeId, (old) => {
        const nodeData = old.data as IfNodeData;
        const conditions = nodeData.conditions || [];
        const updatedConditions = conditions.map(c => 
          c.id === conditionId ? { ...c, ...updates } : c
        );
        
        return {
          ...old,
          data: {
            ...old.data,
            conditions: updatedConditions
          }
        };
      });
      
      return { previousNode, conditionId };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousNode) {
        queryClient.setQueryData(
          flowKeys.node(flowId, nodeId),
          context.previousNode
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
      
      await queryClient.invalidateQueries({ 
        queryKey: flowKeys.node(flowId, nodeId) 
      });
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
 * Hook for adding a new condition to an If node
 */
export const useAddIfNodeCondition = (flowId: string, nodeId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (condition: IfCondition) => {
      const flow = queryClient.getQueryData<Flow>(flowKeys.detail(flowId));
      if (!flow) throw new Error("Flow not found");
      
      const nodes = [...flow.props.nodes];
      const nodeIndex = nodes.findIndex(n => n.id === nodeId);
      if (nodeIndex === -1) throw new Error("Node not found");
      
      const node = nodes[nodeIndex];
      if (node.type !== 'if') throw new Error("Not an if node");
      
      const nodeData = node.data as IfNodeData;
      const conditions = nodeData.conditions || [];
      
      // Check if condition with this ID already exists
      if (conditions.some(c => c.id === condition.id)) {
        throw new Error("Condition with this ID already exists");
      }
      
      const updatedNode = {
        ...node,
        data: {
          ...node.data,
          conditions: [...conditions, condition]
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
    
    onMutate: async (condition) => {
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.node(flowId, nodeId) 
      });
      
      const previousNode = queryClient.getQueryData(
        flowKeys.node(flowId, nodeId)
      );
      
      optimistic.updateNode(queryClient, flowId, nodeId, (old) => {
        const nodeData = old.data as IfNodeData;
        const conditions = nodeData.conditions || [];
        
        return {
          ...old,
          data: {
            ...old.data,
            conditions: [...conditions, condition]
          }
        };
      });
      
      return { previousNode };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousNode) {
        queryClient.setQueryData(
          flowKeys.node(flowId, nodeId),
          context.previousNode
        );
      }
    },
    
    onSettled: async () => {
      await queryClient.invalidateQueries({ 
        queryKey: flowKeys.node(flowId, nodeId) 
      });
    },
  });
};

/**
 * Hook for removing a condition from an If node
 */
export const useRemoveIfNodeCondition = (flowId: string, nodeId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (conditionId: string) => {
      const flow = queryClient.getQueryData<Flow>(flowKeys.detail(flowId));
      if (!flow) throw new Error("Flow not found");
      
      const nodes = [...flow.props.nodes];
      const nodeIndex = nodes.findIndex(n => n.id === nodeId);
      if (nodeIndex === -1) throw new Error("Node not found");
      
      const node = nodes[nodeIndex];
      if (node.type !== 'if') throw new Error("Not an if node");
      
      const nodeData = node.data as IfNodeData;
      const conditions = nodeData.conditions || [];
      
      const updatedNode = {
        ...node,
        data: {
          ...node.data,
          conditions: conditions.filter(c => c.id !== conditionId)
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
    
    onMutate: async (conditionId) => {
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.node(flowId, nodeId) 
      });
      
      const previousNode = queryClient.getQueryData(
        flowKeys.node(flowId, nodeId)
      );
      
      optimistic.updateNode(queryClient, flowId, nodeId, (old) => {
        const nodeData = old.data as IfNodeData;
        const conditions = nodeData.conditions || [];
        
        return {
          ...old,
          data: {
            ...old.data,
            conditions: conditions.filter(c => c.id !== conditionId)
          }
        };
      });
      
      return { previousNode, conditionId };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousNode) {
        queryClient.setQueryData(
          flowKeys.node(flowId, nodeId),
          context.previousNode
        );
      }
    },
    
    onSettled: async () => {
      await queryClient.invalidateQueries({ 
        queryKey: flowKeys.node(flowId, nodeId) 
      });
    },
  });
};

/**
 * Hook for reordering conditions in an If node
 */
export const useReorderIfNodeConditions = (flowId: string, nodeId: string) => {
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
      if (node.type !== 'if') throw new Error("Not an if node");
      
      const nodeData = node.data as IfNodeData;
      const conditions = [...(nodeData.conditions || [])];
      
      // Reorder conditions
      const [movedCondition] = conditions.splice(oldIndex, 1);
      conditions.splice(newIndex, 0, movedCondition);
      
      const updatedNode = {
        ...node,
        data: {
          ...node.data,
          conditions
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
    
    onMutate: async ({ oldIndex, newIndex }) => {
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.node(flowId, nodeId) 
      });
      
      const previousNode = queryClient.getQueryData(
        flowKeys.node(flowId, nodeId)
      );
      
      optimistic.updateNode(queryClient, flowId, nodeId, (old) => {
        const nodeData = old.data as IfNodeData;
        const conditions = [...(nodeData.conditions || [])];
        
        const [movedCondition] = conditions.splice(oldIndex, 1);
        conditions.splice(newIndex, 0, movedCondition);
        
        return {
          ...old,
          data: {
            ...old.data,
            conditions
          }
        };
      });
      
      return { previousNode };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousNode) {
        queryClient.setQueryData(
          flowKeys.node(flowId, nodeId),
          context.previousNode
        );
      }
    },
    
    onSettled: async () => {
      await queryClient.invalidateQueries({ 
        queryKey: flowKeys.node(flowId, nodeId) 
      });
    },
  });
};

/**
 * Hook for updating If node label/color
 */
export const useUpdateIfNodeMetadata = (flowId: string, nodeId: string) => {
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
      label, 
      color 
    }: { 
      label?: string; 
      color?: string;
    }) => {
      const flow = queryClient.getQueryData<Flow>(flowKeys.detail(flowId));
      if (!flow) throw new Error("Flow not found");
      
      const nodes = [...flow.props.nodes];
      const nodeIndex = nodes.findIndex(n => n.id === nodeId);
      if (nodeIndex === -1) throw new Error("Node not found");
      
      const node = nodes[nodeIndex];
      if (node.type !== 'if') throw new Error("Not an if node");
      
      const updatedNode = {
        ...node,
        data: {
          ...node.data,
          ...(label !== undefined && { label }),
          ...(color !== undefined && { color })
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
    
    onMutate: async (updates) => {
      if (updates.label !== undefined) {
        startEditing();
      }
      
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.node(flowId, nodeId) 
      });
      
      const previousNode = queryClient.getQueryData(
        flowKeys.node(flowId, nodeId)
      );
      
      optimistic.updateNode(queryClient, flowId, nodeId, (old) => ({
        ...old,
        data: {
          ...old.data,
          ...updates
        }
      }));
      
      return { previousNode };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousNode) {
        queryClient.setQueryData(
          flowKeys.node(flowId, nodeId),
          context.previousNode
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
      
      await queryClient.invalidateQueries({ 
        queryKey: flowKeys.node(flowId, nodeId) 
      });
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