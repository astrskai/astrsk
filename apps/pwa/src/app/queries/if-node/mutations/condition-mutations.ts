import { useState, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IfNodeService } from "@/app/services/if-node-service";
import { ifNodeKeys } from "../query-factory";
import { IfCondition } from "@/flow-multi/nodes/if-node";
import { ConditionDataType, ConditionOperator } from "@/flow-multi/types/condition-types";

// Type for conditions that may be incomplete (during editing)
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
      await queryClient.cancelQueries({ queryKey: ifNodeKeys.detail(flowId, nodeId) });
      
      // Optimistically update the cache
      const previousData = queryClient.getQueryData(ifNodeKeys.detail(flowId, nodeId));
      if (previousData) {
        queryClient.setQueryData(ifNodeKeys.detail(flowId, nodeId), {
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
        queryClient.setQueryData(ifNodeKeys.detail(flowId, nodeId), context.previousData);
      }
      setIsEditing(false);
      if (editTimeoutRef.current) {
        clearTimeout(editTimeoutRef.current);
      }
    },
    onSettled: () => {
      endEditing();
      // Invalidate to ensure consistency after delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ifNodeKeys.detail(flowId, nodeId) });
      }, 600);
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
      await queryClient.cancelQueries({ queryKey: ifNodeKeys.detail(flowId, nodeId) });
      
      // Optimistically update the detail query cache
      const previousData = queryClient.getQueryData(ifNodeKeys.detail(flowId, nodeId));
      if (previousData) {
        queryClient.setQueryData(ifNodeKeys.detail(flowId, nodeId), {
          ...previousData,
          logicOperator,
        });
      }
      
      return { previousData };
    },
    onError: (err, logicOperator, context) => {
      // Revert optimistic update on error
      if (context?.previousData) {
        queryClient.setQueryData(ifNodeKeys.detail(flowId, nodeId), context.previousData);
      }
      setIsEditing(false);
      if (editTimeoutRef.current) {
        clearTimeout(editTimeoutRef.current);
      }
    },
    onSettled: () => {
      endEditing();
      // Invalidate to ensure consistency after delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ifNodeKeys.detail(flowId, nodeId) });
      }, 600);
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