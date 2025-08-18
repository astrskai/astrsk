/**
 * Edge Mutation Hooks
 * 
 * Mutations for edge operations (connections between nodes)
 * Handles standard edges and special cases like if-node branches
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FlowService } from "@/app/services/flow-service";
import { Flow, Edge } from "@/modules/flow/domain/flow";
import * as optimistic from "../optimistic-updates";
import { flowKeys } from "../query-factory";

/**
 * Hook for adding a new edge
 * Validates that source and target nodes exist
 */
export const useAddEdge = (flowId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (edge: Edge) => {
      const flow = queryClient.getQueryData<Flow>(flowKeys.detail(flowId));
      if (!flow) throw new Error("Flow not found");
      
      // Validate source and target nodes exist
      const sourceExists = flow.props.nodes.some(n => n.id === edge.source);
      const targetExists = flow.props.nodes.some(n => n.id === edge.target);
      
      if (!sourceExists) throw new Error(`Source node ${edge.source} not found`);
      if (!targetExists) throw new Error(`Target node ${edge.target} not found`);
      
      // Check for duplicate edges
      const duplicateExists = flow.props.edges.some(
        e => e.source === edge.source && 
             e.target === edge.target &&
             e.sourceHandle === edge.sourceHandle &&
             e.targetHandle === edge.targetHandle
      );
      
      if (duplicateExists) {
        throw new Error("This connection already exists");
      }
      
      const edges = [...flow.props.edges, edge];
      
      const updatedFlow = flow.update({ edges });
      if (updatedFlow.isFailure) {
        throw new Error(updatedFlow.getError());
      }
      
      const saveResult = await FlowService.saveFlow.execute(updatedFlow.getValue());
      if (saveResult.isFailure) {
        throw new Error(saveResult.getError());
      }
      
      return saveResult.getValue();
    },
    
    onMutate: async (edge) => {
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.edges(flowId) 
      });
      
      const previousEdges = queryClient.getQueryData(flowKeys.edges(flowId));
      
      // Optimistically add the edge
      optimistic.addEdge(queryClient, flowId, edge);
      
      return { previousEdges };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousEdges) {
        queryClient.setQueryData(
          flowKeys.edges(flowId),
          context.previousEdges
        );
      }
    },
    
    onSettled: async () => {
      await queryClient.invalidateQueries({ 
        queryKey: flowKeys.edges(flowId) 
      });
      // Also invalidate validation since flow structure changed
      await queryClient.invalidateQueries({
        queryKey: flowKeys.validation(flowId)
      });
    },
  });
};

/**
 * Hook for removing an edge
 */
export const useRemoveEdge = (flowId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (edgeId: string) => {
      const flow = queryClient.getQueryData<Flow>(flowKeys.detail(flowId));
      if (!flow) throw new Error("Flow not found");
      
      const edges = flow.props.edges.filter(e => e.id !== edgeId);
      
      const updatedFlow = flow.update({ edges });
      if (updatedFlow.isFailure) {
        throw new Error(updatedFlow.getError());
      }
      
      const saveResult = await FlowService.saveFlow.execute(updatedFlow.getValue());
      if (saveResult.isFailure) {
        throw new Error(saveResult.getError());
      }
      
      return saveResult.getValue();
    },
    
    onMutate: async (edgeId) => {
      await queryClient.cancelQueries({ 
        queryKey: flowKeys.edges(flowId) 
      });
      
      const previousEdges = queryClient.getQueryData(flowKeys.edges(flowId));
      
      // Optimistically remove the edge
      optimistic.removeEdge(queryClient, flowId, edgeId);
      
      return { previousEdges, edgeId };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousEdges) {
        queryClient.setQueryData(
          flowKeys.edges(flowId),
          context.previousEdges
        );
      }
    },
    
    onSettled: async () => {
      await queryClient.invalidateQueries({ 
        queryKey: flowKeys.edges(flowId) 
      });
      // Also invalidate validation since flow structure changed
      await queryClient.invalidateQueries({
        queryKey: flowKeys.validation(flowId)
      });
    },
  });
};

