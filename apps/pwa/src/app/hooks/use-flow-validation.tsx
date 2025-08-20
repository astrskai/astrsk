import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { UniqueEntityID } from "@/shared/domain";

import { useApiConnectionsWithModels } from "@/app/hooks/use-api-connections-with-models";
import { useFlow } from "@/app/hooks/use-flow";
import { flowQueries } from "@/app/queries/flow-queries";
import { AgentService } from "@/app/services/agent-service";
import { useValidationStore } from "@/app/stores/validation-store";
import {
  isAgentValid,
} from "@/flow-multi/utils/flow-validation";
import { Agent } from "@/modules/agent/domain/agent";

export function useFlowValidation(flowId?: UniqueEntityID | null) {
  // Get flow and api connections with models
  const { data: flow } = useFlow(flowId || undefined);
  if (!flow) {
    return { isValid: false, invalidAgents: [] };
  }else{
    return { isValid: true, invalidAgents: [] };
  }
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
      const { traverseFlowCached } = await import(
        "@/flow-multi/utils/flow-traversal"
      );
      const traversalResult = traverseFlowCached(flow);

      for (const agentId of flow.agentIds) {
        try {
          const agentResult = await AgentService.getAgent.execute(agentId);
          if (agentResult.isSuccess) {
            const agent = agentResult.getValue();
            agents.set(agentId.toString(), agent);

            // TEMPORARILY DISABLED: Agent validation commented out
            /*
            // Only validate agents that are connected from start to end
            const position = traversalResult.agentPositions.get(agentId.toString());
            if (position && position.isConnectedToStart && position.isConnectedToEnd) {
              // Check individual agent validity only for connected agents
              if (!isAgentValid(agent)) {
                invalidAgents.push(agentId.toString());
              }
            }
            */
          } else {
            // Agent not found or failed to load
            console.warn(`Agent not found: ${agentId}`);
            // TEMPORARILY DISABLED: Agent validation commented out
            /*
            // Only mark as invalid if it's connected
            const position = traversalResult.agentPositions.get(agentId.toString());
            if (position && position.isConnectedToStart && position.isConnectedToEnd) {
              invalidAgents.push(agentId.toString());
            }
            */
          }
        } catch (error) {
          console.warn(`Failed to load agent ${agentId}:`, error);
          // TEMPORARILY DISABLED: Agent validation commented out
          /*
          // Only mark as invalid if it's connected
          const position = traversalResult.agentPositions.get(agentId.toString());
          if (position && position.isConnectedToStart && position.isConnectedToEnd) {
            invalidAgents.push(agentId.toString());
          }
          */
        }
      }

      // TEMPORARILY DISABLED: Individual node validation commented out
      // Validate if nodes and data store nodes
      let invalidIfNodes = 0;
      let invalidDataStoreNodes = 0;
      const invalidNodeReasons: Record<string, string[]> = {};
      
      /*
      // Check all nodes in the connected sequence
      for (const nodeId of traversalResult.connectedSequence) {
        const node = flow.props.nodes.find(n => n.id === nodeId);
        if (!node) continue;
        
        // Validate if nodes - must have at least one valid condition
        if (node.type === 'if') {
          const nodeData = node.data as any;
          const nodeName = nodeData?.label || nodeId;
          const conditions = nodeData?.conditions || [];
          const hasValidCondition = conditions.some((c: any) => 
            c.value1 && c.value1.trim() !== '' && c.operator && c.dataType
          );
          if (!hasValidCondition) {
            invalidIfNodes++;
            invalidNodeReasons[nodeId] = [`If node "${nodeName}" must have at least one complete condition with value, operator, and data type`];
          }
        }
        
        // Validate data store nodes - comprehensive validation
        if (node.type === 'dataStore') {
          const nodeData = node.data as any;
          const nodeName = nodeData?.label || nodeId;
          const dataStoreFields = nodeData?.dataStoreFields || [];
          const schema = flow.props.dataStoreSchema;
          const reasons: string[] = [];
          
          
          // A data store node is valid if:
          // 1. It has at least one field configured
          // 2. That field exists in the schema
          
          if (dataStoreFields.length === 0) {
            reasons.push(`Data store "${nodeName}" must have at least one field configured`);
          } else if (!schema) {
            // No schema defined but node exists
            reasons.push(`Data store "${nodeName}" schema is not defined`);
          } else {
            // Check if at least one configured field exists in schema
            let hasValidField = false;
            
            for (const field of dataStoreFields) {
              const schemaField = schema.fields.find(sf => sf.id === field.schemaFieldId);
              if (schemaField) {
                // Found at least one valid field that exists in schema
                hasValidField = true;
                
                // Check if field has logic - if it has logic, we don't validate the value
                // as it will be computed at runtime
                if (!field.logic || field.logic.trim() === '') {
                  // Only validate the field value if there's no logic
                  if (field.value !== undefined && field.value !== '') {
                    const value = field.value;
                    const type = schemaField.type;
                    
                    
                    // Validate based on type
                    if (type === 'number' || type === 'integer') {
                      const numValue = Number(value);
                      if (isNaN(numValue)) {
                        reasons.push(`Field '${schemaField.name}' expects ${type} but got '${value}'`);
                      } else if (type === 'integer' && !Number.isInteger(numValue)) {
                        reasons.push(`Field '${schemaField.name}' expects integer but got decimal '${value}'`);
                      }
                    } else if (type === 'boolean') {
                      if (value !== 'true' && value !== 'false') {
                        reasons.push(`Field '${schemaField.name}' expects boolean but got '${value}'`);
                      }
                    }
                    // string type accepts any value, so no validation needed
                  }
                }
              }
            }
            
            if (!hasValidField) {
              reasons.push('Data store must have at least one field that exists in the schema');
            }
          }
          
          if (reasons.length > 0) {
            invalidDataStoreNodes++;
            invalidNodeReasons[nodeId] = reasons;
          }
        }
      }
      */
      
      // Check if the flow has a valid path from start to end
      let isValid = traversalResult.hasValidFlow;
      
      
      // TEMPORARILY DISABLED: Flow validity check based on invalid nodes commented out
      /*
      // If the flow is connected, check if any connected nodes are invalid
      if (isValid) {
        // If there are any invalid connected agents, if nodes, or data store nodes, the flow is invalid
        if (invalidAgents.length > 0 || invalidIfNodes > 0 || invalidDataStoreNodes > 0) {
          isValid = false;
        }
      }
      */
      

      // TEMPORARILY DISABLED: API connection validation for agents commented out
      /*
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
      */


      return { 
        isValid, 
        invalidAgents,
        invalidDataStoreNodes,
        invalidIfNodes,
        invalidNodeReasons 
      };
    },
    enabled: !!flow && !!apiConnectionsWithModels,
  });


  // Update validation store
  const isValid = data?.isValid ?? false;
  const invalidAgents = data?.invalidAgents ?? [];
  const invalidDataStoreNodes = data?.invalidDataStoreNodes ?? 0;
  const invalidIfNodes = data?.invalidIfNodes ?? 0;
  const invalidNodeReasons = data?.invalidNodeReasons ?? {};
  const { setInvalid } = useValidationStore();

  useEffect(() => {
    if (!flowId) {
      return;
    }
    setInvalid("flows", flowId, !isValid);
  }, [flowId, isValid, setInvalid]);

  return { 
    isValid, 
    invalidAgents, 
    invalidDataStoreNodes,
    invalidIfNodes,
    invalidNodeReasons,
    isFetched 
  } as const;
}
