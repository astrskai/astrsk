/**
 * Flow Mutation Hooks
 * 
 * Ready-to-use mutation hooks for flow operations.
 * These combine optimistic updates, API calls, and invalidation.
 */

import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FlowService } from "@/app/services/flow-service";
import { UniqueEntityID } from "@/shared/domain";
import { 
  Flow,
  Node, 
  Edge,
  DataStoreSchemaField,
  DataStoreField 
} from "@/modules/flow/domain/flow";
import { flowKeys } from "./query-factory";

/**
 * Hook for adding a node
 */
export const useAddNode = (flowId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (node: Node) => {
      // Get the flow from service to ensure we have a domain object
      const flowResult = await FlowService.getFlow.execute(new UniqueEntityID(flowId));
      if (flowResult.isFailure) {
        throw new Error(flowResult.getError());
      }
      const flow = flowResult.getValue();
      
      const nodes = [...flow.props.nodes, node];
      
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
    
    onMutate: async (node) => {
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.nodes(flowId) 
      });
      
      // No optimistic update - let the mutation complete
      
      return { node };
    },
    
    onError: async () => {
      // On error, invalidate to refetch correct state
      await queryClient.invalidateQueries({ queryKey: flowKeys.nodes(flowId) });
    },
    
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: flowKeys.nodes(flowId) });
    },
  });
};

/**
 * Hook for removing a node
 */
export const useRemoveNode = (flowId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (nodeId: string) => {
      // Get the flow from service to ensure we have a domain object
      const flowResult = await FlowService.getFlow.execute(new UniqueEntityID(flowId));
      if (flowResult.isFailure) {
        throw new Error(flowResult.getError());
      }
      const flow = flowResult.getValue();
      
      // Remove node and any edges connected to it
      const nodes = flow.props.nodes.filter(n => n.id !== nodeId);
      const edges = flow.props.edges.filter(
        e => e.source !== nodeId && e.target !== nodeId
      );
      
      const updatedFlow = flow.update({ nodes, edges });
      if (updatedFlow.isFailure) {
        throw new Error(updatedFlow.getError());
      }
      
      const saveResult = await FlowService.saveFlow.execute(updatedFlow.getValue());
      if (saveResult.isFailure) {
        throw new Error(saveResult.getError());
      }
      
      return saveResult.getValue();
    },
    
    onMutate: async (nodeId) => {
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.detail(flowId) 
      });
      
      // Snapshot nodes and edges
      const previousNodes = queryClient.getQueryData(flowKeys.nodes(flowId));
      const previousEdges = queryClient.getQueryData(flowKeys.edges(flowId));
      
      // No optimistic update - let the mutation complete
      
      return { previousNodes, previousEdges, nodeId };
    },
    
    onError: (err, nodeId, context) => {
      // Rollback
      if (context?.previousNodes) {
        queryClient.setQueryData(flowKeys.nodes(flowId), context.previousNodes);
      }
      if (context?.previousEdges) {
        queryClient.setQueryData(flowKeys.edges(flowId), context.previousEdges);
      }
    },
    
    onSettled: async (data, error, nodeId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: flowKeys.nodes(flowId) }),
        queryClient.invalidateQueries({ queryKey: flowKeys.edges(flowId) })
      ]);
    },
  });
};

/**
 * Hook for updating flow metadata with edit mode support
 * Use this for name/description text fields to prevent race conditions
 * 
 * @returns mutation with isEditing state that can be used to pause query subscriptions
 */
export const useUpdateMetadata = (flowId: string) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const editEndTimerRef = useRef<NodeJS.Timeout>();
  
  // Function to end editing with debounce
  const endEditing = useCallback(() => {
    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }
    
    editEndTimerRef.current = setTimeout(() => {
      setIsEditing(false);
    }, 500);
  }, []);
  
  // Function to start/continue editing
  const startEditing = useCallback(() => {
    setIsEditing(true);
    
    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }
  }, []);
  
  const mutation = useMutation({
    mutationFn: async (metadata: { 
      name?: string; 
      description?: string 
    }) => {
      // Get the flow from service to ensure we have a domain object
      const flowResult = await FlowService.getFlow.execute(new UniqueEntityID(flowId));
      if (flowResult.isFailure) {
        throw new Error(flowResult.getError());
      }
      const flow = flowResult.getValue();
      
      const updatedFlow = flow.update(metadata);
      if (updatedFlow.isFailure) {
        throw new Error(updatedFlow.getError());
      }
      
      const saveResult = await FlowService.saveFlow.execute(updatedFlow.getValue());
      if (saveResult.isFailure) {
        throw new Error(saveResult.getError());
      }
      
      return saveResult.getValue();
    },
    
    onMutate: async (metadata) => {
      // Start edit mode
      startEditing();
      
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.metadata(flowId) 
      });
      
      const previousMetadata = queryClient.getQueryData(
        flowKeys.metadata(flowId)
      );
      
      // No optimistic update - let the mutation complete
      
      return { previousMetadata };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousMetadata) {
        queryClient.setQueryData(
          flowKeys.metadata(flowId),
          context.previousMetadata
        );
      }
      
      // End edit mode on error
      setIsEditing(false);
      if (editEndTimerRef.current) {
        clearTimeout(editEndTimerRef.current);
      }
    },
    
    onSettled: async (data, error) => {
      // Start debounced end of edit mode
      if (!error) {
        endEditing();
      }
      
      // Only invalidate metadata query - we only changed metadata
      await queryClient.invalidateQueries({ queryKey: flowKeys.metadata(flowId) });
    },
  });
  
  // Always return mutation with isEditing state - fully type-safe!
  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isEditing, // Always present, TypeScript knows this exists
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};


/**
 * Hook for updating response template with edit mode support
 * Use this for template editor to prevent race conditions
 * 
 * @returns mutation with isEditing state that can be used to pause query subscriptions
 */
export const useUpdateResponseTemplate = (flowId: string) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const editEndTimerRef = useRef<NodeJS.Timeout>();
  
  // Function to end editing with debounce
  const endEditing = useCallback(() => {
    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }
    
    editEndTimerRef.current = setTimeout(() => {
      setIsEditing(false);
    }, 500);
  }, []);
  
  // Function to start/continue editing
  const startEditing = useCallback(() => {
    setIsEditing(true);
    
    if (editEndTimerRef.current) {
      clearTimeout(editEndTimerRef.current);
    }
  }, []);
  
  const mutation = useMutation({
    mutationFn: async (template: string) => {
      // Use dedicated method that only updates the response template
      // This avoids race conditions where we might overwrite other fields
      const result = await FlowService.updateResponseTemplate.execute({
        flowId,
        template
      });
      
      if (result.isFailure) {
        throw new Error(result.getError());
      }
      
      return template; // Return the template that was saved
    },
    
    onMutate: async (template) => {
      // Start edit mode
      startEditing();
      
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.response(flowId) 
      });
      
      const previousTemplate = queryClient.getQueryData(
        flowKeys.response(flowId)
      );
      
      // No optimistic update - let the mutation complete
      
      return { previousTemplate };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousTemplate !== undefined) {
        queryClient.setQueryData(
          flowKeys.response(flowId),
          context.previousTemplate
        );
      }
      
      // End edit mode on error
      setIsEditing(false);
      if (editEndTimerRef.current) {
        clearTimeout(editEndTimerRef.current);
      }
    },
    
    onSettled: async (data, error) => {
      // Start debounced end of edit mode
      if (!error) {
        endEditing();
      }
      
      // Only invalidate the response query - we only changed the response template
      await queryClient.invalidateQueries({ queryKey: flowKeys.response(flowId) });
    },
  });
  
  // Always return mutation with isEditing state - fully type-safe!
  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isEditing, // Always present, TypeScript knows this exists
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

/**
 * Combined hook that returns all mutations for a flow
 * All text field mutations include isEditing state to prevent race conditions
 * 
 * @param flowId - The flow ID
 * @returns All mutations with isEditing state for text field mutations
 * 
 * @example
 * const mutations = useFlowMutations(flowId);
 * 
 * // Use isEditing to pause query subscription for text fields
 * const { data } = useQuery({
 *   ...flowQueries.node(flowId, nodeId),
 *   enabled: !mutations.updateMetadata.isEditing // TypeScript knows isEditing exists!
 * });
 */
export const useFlowMutations = (flowId: string) => {
  return {
    addNode: useAddNode(flowId), // No isEditing (not needed)
    removeNode: useRemoveNode(flowId), // No isEditing (not needed)
    updateMetadata: useUpdateMetadata(flowId), // Has isEditing
    updateResponseTemplate: useUpdateResponseTemplate(flowId), // Has isEditing
  };
};