import { useState, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IfNodeService } from "@/app/services/if-node-service";
import { ifNodeKeys } from "../query-factory";
import { IfCondition } from "@/features/flow/nodes/if-node";
import { ConditionDataType, ConditionOperator } from "@/features/flow/types/condition-types";
import { invalidateSingleFlowQueries } from "@/features/flow/utils/invalidate-flow-queries";

// Type for conditions that may be incomplete (during editing)
// Now the same as IfCondition since both support null values
export interface EditableCondition {
  id: string;
  dataType: ConditionDataType | null;
  value1: string;
  operator: ConditionOperator | null;
  value2: string;
}

/**
 * Hook for updating if node conditions with isEditing flag
 * Prevents refetching during editing
 * Supports both conditions and draft conditions for UI state management
 */
export function useUpdateIfNodeConditions(flowId: string, nodeId: string) {
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
    // Add delay before allowing refetch to prevent flicker
    editTimeoutRef.current = setTimeout(() => {
      setIsEditing(false);
    }, 500);
  }, []);

  const mutation = useMutation({
    mutationFn: async (data: {
      conditions: IfCondition[]; // Valid conditions (complete, ready for evaluation)
      draftConditions: EditableCondition[]; // All conditions including incomplete ones
      logicOperator: 'AND' | 'OR';
    }) => {
      // Update conditions
      const conditionsResult = await IfNodeService.updateIfNodeConditions.execute({
        flowId,
        nodeId,
        conditions: data.conditions,
      });
      if (conditionsResult.isFailure) {
        throw new Error(conditionsResult.getError());
      }

      // Update logic operator
      const operatorResult = await IfNodeService.updateIfNodeLogicOperator.execute({
        flowId,
        nodeId,
        logicOperator: data.logicOperator,
      });
      if (operatorResult.isFailure) {
        throw new Error(operatorResult.getError());
      }

      return data;
    },
    onMutate: async (data) => {
      startEditing();
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ifNodeKeys.detail(nodeId) });
      
      // Optimistically update the cache
      const previousData = queryClient.getQueryData(ifNodeKeys.detail(nodeId));
      if (previousData) {
        queryClient.setQueryData(ifNodeKeys.detail(nodeId), {
          ...previousData,
          conditions: data.conditions,
          draftConditions: data.draftConditions,
          logicOperator: data.logicOperator,
        });
      }
      
      return { previousData };
    },
    onError: (err, data, context) => {
      // Revert optimistic update on error
      if (context?.previousData) {
        queryClient.setQueryData(ifNodeKeys.detail(nodeId), context.previousData);
      }
      setIsEditing(false);
      if (editTimeoutRef.current) {
        clearTimeout(editTimeoutRef.current);
      }
    },
    onSettled: async () => {
      endEditing();
      
      // Immediate invalidation for if node queries
      await queryClient.invalidateQueries({ 
        queryKey: ifNodeKeys.detail(nodeId),
        refetchType: 'inactive'
      });
      
      // Also invalidate flow queries since if node conditions affect flow validation
      try {
        await invalidateSingleFlowQueries(flowId);
      } catch (error) {
        console.warn("Failed to invalidate flow queries after if node condition update:", error);
      }
    },
  });

  return {
    ...mutation,
    isEditing,
    setIsEditing,
    startEditing,
    endEditing,
  };
}

/**
 * Hook for updating if node logic operator with isEditing flag
 * Prevents refetching during editing
 */
export function useUpdateIfNodeLogicOperator(flowId: string, nodeId: string) {
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
    // Add delay before allowing refetch to prevent flicker
    editTimeoutRef.current = setTimeout(() => {
      setIsEditing(false);
    }, 500);
  }, []);

  const mutation = useMutation({
    mutationFn: async (logicOperator: 'AND' | 'OR') => {
      const result = await IfNodeService.updateIfNodeLogicOperator.execute({
        flowId,
        nodeId,
        logicOperator,
      });
      if (result.isFailure) {
        throw new Error(result.getError());
      }
    },
    onMutate: async (logicOperator) => {
      startEditing();
      
      // Cancel any outgoing refetches for detail query (no specific logic operator query)
      await queryClient.cancelQueries({ queryKey: ifNodeKeys.detail(nodeId) });
      
      // Optimistically update the detail query cache
      const previousData = queryClient.getQueryData(ifNodeKeys.detail(nodeId));
      if (previousData) {
        queryClient.setQueryData(ifNodeKeys.detail(nodeId), {
          ...previousData,
          logicOperator,
        });
      }
      
      return { previousData };
    },
    onError: (err, logicOperator, context) => {
      // Revert optimistic update on error
      if (context?.previousData) {
        queryClient.setQueryData(ifNodeKeys.detail(nodeId), context.previousData);
      }
      setIsEditing(false);
      if (editTimeoutRef.current) {
        clearTimeout(editTimeoutRef.current);
      }
    },
    onSettled: async () => {
      endEditing();
      
      // Immediate invalidation for if node queries
      await queryClient.invalidateQueries({ 
        queryKey: ifNodeKeys.detail(nodeId),
        refetchType: 'inactive'
      });
      
      // Also invalidate flow queries since if node conditions affect flow validation
      try {
        await invalidateSingleFlowQueries(flowId);
      } catch (error) {
        console.warn("Failed to invalidate flow queries after if node logic operator update:", error);
      }
    },
  });

  return {
    ...mutation,
    isEditing,
    setIsEditing,
    startEditing,
    endEditing,
  };
}