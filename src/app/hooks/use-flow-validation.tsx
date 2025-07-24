import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { UniqueEntityID } from "@/shared/domain";

import { useApiConnectionsWithModels } from "@/app/hooks/use-api-connections-with-models";
import { useFlow } from "@/app/hooks/use-flow";
import { flowQueries } from "@/app/queries/flow-queries";
import { AgentService } from "@/app/services/agent-service";
import { useValidationStore } from "@/app/stores/validation-store";
import {
  areAllConnectedAgentsValid,
  isAgentValid,
} from "@/flow-multi/utils/flow-validation";
import { Agent } from "@/modules/agent/domain/agent";

export function useFlowValidation(flowId?: UniqueEntityID | null) {
  // Get flow and api connections with models
  const { data: flow } = useFlow(flowId || undefined);
  const [apiConnectionsWithModels] = useApiConnectionsWithModels();

  // Validate flow
  const { data, isFetched } = useQuery({
    queryKey: [
      ...flowQueries.detail(flowId || undefined).queryKey,
      "validation",
    ],
    queryFn: async () => {
      // Check flow and api connections with models exist
      if (!flow || !apiConnectionsWithModels) {
        return { isValid: false, invalidAgents: [] };
      }

      // Check flow has agents
      if (flow.agentIds.length === 0) {
        return { isValid: false, invalidAgents: [] };
      }

      // Load all agents from the flow
      const agents = new Map<string, Agent>();
      const invalidAgents: string[] = [];

      // First, get flow traversal to know which agents are connected
      const { traverseFlow } = await import(
        "@/flow-multi/utils/flow-traversal"
      );
      const traversalResult = traverseFlow(flow);

      for (const agentId of flow.agentIds) {
        try {
          const agentResult = await AgentService.getAgent.execute(agentId);
          if (agentResult.isSuccess) {
            const agent = agentResult.getValue();
            agents.set(agentId.toString(), agent);

            // Only validate agents that are connected from start to end
            const position = traversalResult.agentPositions.get(agentId.toString());
            if (position && position.isConnectedToStart && position.isConnectedToEnd) {
              // Check individual agent validity only for connected agents
              if (!isAgentValid(agent)) {
                invalidAgents.push(agentId.toString());
              }
            }
          } else {
            // Agent not found or failed to load
            console.warn(`Agent not found: ${agentId}`);
            // Only mark as invalid if it's connected
            const position = traversalResult.agentPositions.get(agentId.toString());
            if (position && position.isConnectedToStart && position.isConnectedToEnd) {
              invalidAgents.push(agentId.toString());
            }
          }
        } catch (error) {
          console.warn(`Failed to load agent ${agentId}:`, error);
          // Only mark as invalid if it's connected
          const position = traversalResult.agentPositions.get(agentId.toString());
          if (position && position.isConnectedToStart && position.isConnectedToEnd) {
            invalidAgents.push(agentId.toString());
          }
        }
      }

      // Use the comprehensive flow validation
      let isValid = areAllConnectedAgentsValid(flow, agents);
      
      // If there are any invalid connected agents, the flow is invalid
      if (invalidAgents.length > 0) {
        isValid = false;
      }

      // Also check API connections for connected agents
      if (isValid && apiConnectionsWithModels) {

        // Check each connected agent's API connection
        for (const [agentId, agent] of agents) {
          const position = traversalResult.agentPositions.get(agentId);

          // Only check API connections for connected agents
          if (
            position &&
            position.isConnectedToStart &&
            position.isConnectedToEnd
          ) {
            const agentModelProviderSource = agent.props.apiSource;
            const agentModelName = agent.props.modelName;

            // Skip if no model is set (isAgentValid already checks this)
            if (!agentModelProviderSource || !agentModelName) {
              continue;
            }

            // Check agent model provider exists
            const agentModelProvider = apiConnectionsWithModels.find(
              (item) => item.apiConnection.source === agentModelProviderSource,
            );

            if (!agentModelProvider) {
              console.warn("API connection not found for agent", {
                agentId: agent.id.toString(),
                lookingFor: agentModelProviderSource,
              });
              // Add this agent to invalid list instead of immediate return
              if (!invalidAgents.includes(agentId)) {
                invalidAgents.push(agentId);
              }
              continue;
            }

            // Check agent model exists
            const agentModel = agentModelProvider.models.find(
              (model) => model.props.name === agentModelName,
            );

            if (!agentModel) {
              console.warn("Model not found for agent", {
                agentId: agent.id.toString(),
                agentName: agent.props.name,
                lookingFor: agentModelName,
                inConnection: agentModelProviderSource,
              });
              // Add this agent to invalid list instead of immediate return
              if (!invalidAgents.includes(agentId)) {
                invalidAgents.push(agentId);
              }
              continue;
            }
          }
        }
      }

      return { isValid, invalidAgents };
    },
    enabled: !!flow && !!apiConnectionsWithModels,
  });


  // Update validation store
  const isValid = data?.isValid ?? false;
  const invalidAgents = data?.invalidAgents ?? [];
  const { setInvalid } = useValidationStore();

  useEffect(() => {
    if (!flowId) {
      return;
    }
    setInvalid("flows", flowId, !isValid);
  }, [flowId, isValid, setInvalid]);

  return { isValid, invalidAgents, isFetched } as const;
}
