/**
 * Nodes and Edges Batch Mutation Hooks
 * 
 * Mutations for updating nodes and edges together in a single operation
 * Used when multiple nodes/edges change together (e.g., flow editor operations)
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FlowService } from "@/app/services/flow-service";
import { Node, Edge, ReadyState } from "@/entities/flow/domain/flow";
import { InsertFlow } from "@/db/schema/flows";
import { flowKeys } from "../query-factory";

/**
 * Hook for updating nodes and edges together
 * This is more efficient than separate mutations when both change
 */
export const useUpdateNodesAndEdges = (flowId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: [`flow-${flowId}`, 'nodes-edges'],
    mutationFn: async ({ nodes, edges, invalidateAgents }: { 
      nodes: Node[]; 
      edges: Edge[]; 
      invalidateAgents?: boolean;
    }) => {
      
      const result = await FlowService.updateNodesAndEdges.execute({
        flowId,
        nodes,
        edges
      });
      
      if (result.isFailure) {
        throw new Error(result.getError());
      }
      
      // Update flow ready state to Draft if it's Ready
      // Note: queryClient.getQueryData returns cached data in persistence format
      const flow = queryClient.getQueryData<InsertFlow>(flowKeys.detail(flowId));
      if (flow && flow.ready_state === ReadyState.Ready) {
        await FlowService.updateFlowReadyState.execute({
          flowId,
          readyState: ReadyState.Draft
        });
      }
      
      return { nodes, edges };
    },
    
    onMutate: async ({ nodes, edges, invalidateAgents }) => {
      
      // Cancel any in-flight queries to prevent overwriting
      await queryClient.cancelQueries({ queryKey: flowKeys.detail(flowId) });
      await queryClient.cancelQueries({ queryKey: flowKeys.nodes(flowId) });
      await queryClient.cancelQueries({ queryKey: flowKeys.edges(flowId) });
      
      // Get previous values for rollback
      const previousFlow = queryClient.getQueryData(flowKeys.detail(flowId));
      const previousNodes = queryClient.getQueryData(flowKeys.nodes(flowId));
      const previousEdges = queryClient.getQueryData(flowKeys.edges(flowId));
      
      
      // Optimistically update all relevant queries
      // 1. Update nodes query
      queryClient.setQueryData(flowKeys.nodes(flowId), nodes);
      
      // 2. Update edges query
      queryClient.setQueryData(flowKeys.edges(flowId), edges);
      
      // 3. Update flow detail
      // Cache contains persistence format (InsertFlow), not domain format
      queryClient.setQueryData(flowKeys.detail(flowId), (old: InsertFlow | undefined) => {
        if (!old) return old;
        return {
          ...old,
          nodes,
          edges,
          updated_at: new Date()
        };
      });
      
      // 4. Update individual node queries for nodes that changed
      if (nodes && Array.isArray(nodes)) {
        nodes.forEach(node => {
          queryClient.setQueryData(flowKeys.node(flowId, node.id), node);
        });
      }
      
      return { previousFlow, previousNodes, previousEdges, invalidateAgents };
    },
    
    onError: (err, variables, context) => {
      console.error('[NODE] Mutation error - rolling back', err);
      
      // Rollback on error
      if (context?.previousFlow) {
        queryClient.setQueryData(flowKeys.detail(flowId), context.previousFlow);
      }
      if (context?.previousNodes) {
        queryClient.setQueryData(flowKeys.nodes(flowId), context.previousNodes);
      }
      if (context?.previousEdges) {
        queryClient.setQueryData(flowKeys.edges(flowId), context.previousEdges);
      }
    },
    
    onSuccess: async (data, variables, context) => {
      // Only invalidate agents if explicitly requested via flag
      if (data && variables && context?.invalidateAgents) {
        const { nodes } = variables;
        const agentNodes = nodes.filter(node => node.type === 'agent');
        
        if (agentNodes.length > 0) {
          // Small delay to ensure agent persistence is complete
          setTimeout(async () => {
            // Invalidate agent detail queries for agent nodes
            // This ensures the variable panel gets fresh agent data
            const { agentKeys } = await import("@/entities/agent/api/query-factory");
            await Promise.all(
              agentNodes.map(async (node) => {
                const agentId = node.id;
                if (agentId) {
                  await queryClient.invalidateQueries({ 
                    queryKey: agentKeys.detail(agentId),
                    exact: true
                  });
                }
              })
            );
          }, 100); // 100ms delay to allow agent persistence
        }
      }
    },

    onSettled: async () => {
      // Invalidate affected queries to ensure consistency
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: flowKeys.detail(flowId) }), // IMPORTANT: Invalidate flow detail
        queryClient.invalidateQueries({ queryKey: flowKeys.nodes(flowId) }),
        queryClient.invalidateQueries({ queryKey: flowKeys.edges(flowId) }),
        queryClient.invalidateQueries({ queryKey: flowKeys.validation(flowId) })
      ]);
    },
  });
};