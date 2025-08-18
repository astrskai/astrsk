/**
 * Agent Node Mutations
 * 
 * Mutations for agent node operations in flows
 * These handle both the flow node and the underlying agent entity
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FlowService } from "@/app/services/flow-service";
import { AgentService } from "@/app/services/agent-service";
import { Flow } from "@/modules/flow/domain/flow";
import { Agent, ApiType } from "@/modules/agent/domain/agent";
import { UniqueEntityID } from "@/shared/domain";
import { flowKeys } from "../query-factory";
import { agentKeys } from "@/app/queries/agent/query-factory";

/**
 * Hook for adding an agent node to a flow
 * Creates a new agent entity and adds a node referencing it
 */
export const useAddAgentNode = (flowId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      position, 
      name,
      color,
      apiType = ApiType.Chat 
    }: { 
      position: { x: number; y: number };
      name: string;
      color?: string;
      apiType?: ApiType;
    }) => {
      // Create new agent
      const agentResult = Agent.create({
        name,
        targetApiType: apiType,
        color: color || "#000000",
      });
      
      if (agentResult.isFailure) {
        throw new Error(agentResult.getError());
      }
      
      const agent = agentResult.getValue();
      
      // Save agent
      const saveAgentResult = await AgentService.saveAgent.execute(agent);
      if (saveAgentResult.isFailure) {
        throw new Error(saveAgentResult.getError());
      }
      
      const savedAgent = saveAgentResult.getValue();
      
      // Get flow and add node
      const flow = queryClient.getQueryData<Flow>(flowKeys.detail(flowId));
      if (!flow) throw new Error("Flow not found");
      
      const newNode = {
        id: savedAgent.id.toString(),
        type: "agent" as const,
        position,
        data: {
          agentId: savedAgent.id.toString(),
        },
      };
      
      const nodes = [...flow.props.nodes, newNode];
      const updatedFlow = flow.update({ nodes });
      
      if (updatedFlow.isFailure) {
        throw new Error(updatedFlow.getError());
      }
      
      // Save flow
      const saveFlowResult = await FlowService.saveFlow.execute(updatedFlow.getValue());
      if (saveFlowResult.isFailure) {
        throw new Error(saveFlowResult.getError());
      }
      
      return { 
        agent: savedAgent, 
        flow: saveFlowResult.getValue() 
      };
    },
    
    onSuccess: ({ agent }) => {
      // Set the agent in cache immediately
      queryClient.setQueryData(
        agentKeys.detail(agent.id.toString()),
        agent
      );
    },
    
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: flowKeys.nodes(flowId) }),
        queryClient.invalidateQueries({ queryKey: flowKeys.detail(flowId) }),
        queryClient.invalidateQueries({ queryKey: agentKeys.lists() }),
      ]);
    },
  });
};

/**
 * Hook for removing an agent node from a flow
 * Removes the node and deletes the associated agent entity
 */
export const useRemoveAgentNode = (flowId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (nodeId: string) => {
      const flow = queryClient.getQueryData<Flow>(flowKeys.detail(flowId));
      if (!flow) throw new Error("Flow not found");
      
      // Find the node to get agentId
      const nodeToRemove = flow.props.nodes.find(n => n.id === nodeId);
      if (!nodeToRemove || nodeToRemove.type !== 'agent') {
        throw new Error("Agent node not found");
      }
      
      const agentId = (nodeToRemove.data as any).agentId;
      if (!agentId) {
        throw new Error("Agent ID not found in node data");
      }
      
      // Remove node and any edges connected to it
      const nodes = flow.props.nodes.filter(n => n.id !== nodeId);
      const edges = flow.props.edges.filter(
        e => e.source !== nodeId && e.target !== nodeId
      );
      
      const updatedFlow = flow.update({ nodes, edges });
      if (updatedFlow.isFailure) {
        throw new Error(updatedFlow.getError());
      }
      
      // Save flow first
      const saveFlowResult = await FlowService.saveFlow.execute(updatedFlow.getValue());
      if (saveFlowResult.isFailure) {
        throw new Error(saveFlowResult.getError());
      }
      
      // Delete the agent entity
      const deleteResult = await AgentService.deleteAgent.execute(
        new UniqueEntityID(agentId)
      );
      if (deleteResult.isFailure) {
        throw new Error(deleteResult.getError());
      }
      
      return { 
        flow: saveFlowResult.getValue(),
        deletedAgentId: agentId 
      };
    },
    
    onSuccess: ({ deletedAgentId }) => {
      // Remove agent from cache
      queryClient.removeQueries({ 
        queryKey: agentKeys.detail(deletedAgentId)
      });
    },
    
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: flowKeys.detail(flowId) }),
        queryClient.invalidateQueries({ queryKey: flowKeys.nodes(flowId) }),
        queryClient.invalidateQueries({ queryKey: flowKeys.edges(flowId) }),
        queryClient.invalidateQueries({ queryKey: agentKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: flowKeys.validation(flowId) }),
      ]);
    },
  });
};

/**
 * Hook for duplicating an agent node
 * Creates a copy of the agent and adds a new node
 */
export const useDuplicateAgentNode = (flowId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      nodeId, 
      position 
    }: { 
      nodeId: string; 
      position: { x: number; y: number };
    }) => {
      const flow = queryClient.getQueryData<Flow>(flowKeys.detail(flowId));
      if (!flow) throw new Error("Flow not found");
      
      // Find the node to duplicate
      const nodeToDuplicate = flow.props.nodes.find(n => n.id === nodeId);
      if (!nodeToDuplicate || nodeToDuplicate.type !== 'agent') {
        throw new Error("Agent node not found");
      }
      
      const originalAgentId = (nodeToDuplicate.data as any).agentId;
      if (!originalAgentId) {
        throw new Error("Agent ID not found in node data");
      }
      
      // Clone the agent
      const cloneResult = await AgentService.cloneAgent.execute(
        new UniqueEntityID(originalAgentId)
      );
      if (cloneResult.isFailure) {
        throw new Error(cloneResult.getError());
      }
      
      const clonedAgent = cloneResult.getValue();
      
      // Update clone name
      const updatedAgent = clonedAgent.update({ 
        name: `${clonedAgent.props.name} (Copy)` 
      });
      if (updatedAgent.isFailure) {
        throw new Error(updatedAgent.getError());
      }
      
      // Save the cloned agent
      const saveResult = await AgentService.saveAgent.execute(updatedAgent.getValue());
      if (saveResult.isFailure) {
        throw new Error(saveResult.getError());
      }
      
      const savedAgent = saveResult.getValue();
      
      // Add new node
      const newNode = {
        id: savedAgent.id.toString(),
        type: "agent" as const,
        position,
        data: {
          agentId: savedAgent.id.toString(),
        },
      };
      
      const nodes = [...flow.props.nodes, newNode];
      const updatedFlow = flow.update({ nodes });
      
      if (updatedFlow.isFailure) {
        throw new Error(updatedFlow.getError());
      }
      
      // Save flow
      const saveFlowResult = await FlowService.saveFlow.execute(updatedFlow.getValue());
      if (saveFlowResult.isFailure) {
        throw new Error(saveFlowResult.getError());
      }
      
      return { 
        agent: savedAgent, 
        flow: saveFlowResult.getValue() 
      };
    },
    
    onSuccess: ({ agent }) => {
      // Set the agent in cache
      queryClient.setQueryData(
        agentKeys.detail(agent.id.toString()),
        agent
      );
    },
    
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: flowKeys.nodes(flowId) }),
        queryClient.invalidateQueries({ queryKey: flowKeys.detail(flowId) }),
        queryClient.invalidateQueries({ queryKey: agentKeys.lists() }),
      ]);
    },
  });
};