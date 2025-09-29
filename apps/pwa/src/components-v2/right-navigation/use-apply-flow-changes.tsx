/**
 * Hook for applying vibe-edited changes to flows
 *
 * Takes typed edited flow data from vibe backend (EditableFlowData)
 * and applies changes using granular mutations for each field
 *
 * Uses existing mutations that panels already use:
 * - Flow mutations: name, response template, data store schema, nodes/edges
 * - Agent mutations: prompt messages, API type, model, structured output
 * - If-node mutations: conditions, logic operator, name
 * - DataStore node mutations: fields, name
 */

import { useCallback } from "react";
import { toast } from "sonner";
import { useQuery, useMutation } from "@tanstack/react-query";
import { FlowService } from "@/app/services/flow-service";
import { AgentService } from "@/app/services/agent-service";
import { AgentDrizzleMapper } from "@/modules/agent/mappers/agent-drizzle-mapper";
import { stringify } from "superjson";
import { IfNodeService } from "@/app/services/if-node-service";
import { DataStoreNodeService } from "@/app/services/data-store-node-service";
import { UniqueEntityID } from "@/shared/domain";
import { queryClient } from "@/app/queries/query-client";
import { flowQueries } from "@/app/queries/flow-queries";
import { agentKeys } from "@/app/queries/agent/query-factory";
import { ifNodeKeys } from "@/app/queries/if-node/query-factory";
import { dataStoreNodeKeys } from "@/app/queries/data-store-node/query-factory";
import { useUpdateFlowName } from "@/app/queries/flow/mutations/flow-mutations";
import { useUpdateNodesAndEdges } from "@/app/queries/flow/mutations/nodes-edges-mutations";
import { useUpdateDataStoreSchema } from "@/app/queries/flow/mutations/data-store-mutations";
import {
  useUpdateAgentPromptMessages,
  useUpdateAgentApiType,
  useUpdateAgentTextPrompt,
} from "@/app/queries/agent/mutations/prompt-mutations-new";
import {
  useUpdateAgentOutput,
  useUpdateAgentOutputFormat,
} from "@/app/queries/agent/mutations/output-mutations";
import { useUpdateIfNodeConditions } from "@/app/queries/if-node/mutations/condition-mutations";
import { useUpdateIfNodeName } from "@/app/queries/if-node/mutations/name-mutations";
import { useUpdateDataStoreNodeFields } from "@/app/queries/data-store-node/mutations/field-mutations";
import { useUpdateDataStoreNodeName } from "@/app/queries/data-store-node/mutations/name-mutations";
import type {
  EditableFlowData,
  EditableAgentData,
  EditableIfNodeData,
  EditableDataStoreNodeData,
} from "vibe-shared-types";
import { OutputFormat } from "@/modules/agent/domain/agent";

// Helper function to invalidate flow queries
const invalidateSingleFlowQueries = async (
  queryClient: any,
  flowId: string,
) => {
  await queryClient.invalidateQueries({
    queryKey: flowQueries.detail(new UniqueEntityID(flowId)).queryKey,
  });
  await queryClient.invalidateQueries({
    queryKey: flowQueries.list().queryKey,
  });
};

interface UseApplyFlowChangesOptions {
  flowId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useApplyFlowChanges = ({
  flowId,
  onSuccess,
  onError,
}: UseApplyFlowChangesOptions) => {
  // Fetch current flow data to compare with edited data
  const { data: currentFlow } = useQuery({
    ...flowQueries.detail(new UniqueEntityID(flowId)),
    enabled: !!flowId,
  });

  // Initialize all mutations at hook level
  const updateFlowName = useUpdateFlowName(flowId);
  const updateDataStoreSchema = useUpdateDataStoreSchema(flowId);
  const updateNodesAndEdges = useUpdateNodesAndEdges(flowId);

  /**
   * Apply agent changes using granular mutations (same ones panels use)
   * We'll need to dynamically call the mutations based on node IDs
   */
  const applyAgentChanges = useCallback(
    async (nodeId: string, agentData: any) => {
      console.log("[APPLY-AGENT-CHANGES] Full agent data received:", {
        nodeId,
        agentData: JSON.stringify(agentData, null, 2),
        hasPromptMessages: !!agentData.promptMessages,
        promptMessagesCount: agentData.promptMessages?.length,
        allFields: Object.keys(agentData),
      });

      try {
        // Convert camelCase to snake_case for the mapper
        const snakeCaseData = {
          id: agentData.id || nodeId,
          name: agentData.name || "Untitled Agent",
          description: agentData.description || "",
          target_api_type: agentData.targetApiType,
          api_source: agentData.apiSource,
          model_id: agentData.modelId,
          model_name: agentData.modelName,
          prompt_messages: agentData.promptMessages
            ? stringify(agentData.promptMessages)
            : "[]",
          text_prompt: agentData.textPrompt || "",
          enabled_parameters: agentData.enabledParameters || {},
          parameter_values: agentData.parameterValues || {},
          enabled_structured_output: agentData.enabledStructuredOutput || false,
          output_format: agentData.outputFormat || OutputFormat.TextOutput,
          output_streaming:
            agentData.outputStreaming !== undefined
              ? agentData.outputStreaming
              : true,
          schema_name: agentData.schemaName,
          schema_description: agentData.schemaDescription,
          schema_fields: agentData.schemaFields,
          token_count: agentData.tokenCount || 0,
          color: agentData.color || "#A5B4FC",
          created_at: agentData.createdAt || new Date(),
          updated_at: new Date(),
        };

        console.log("[APPLY-AGENT-CHANGES] Converted to snake_case:", {
          nodeId,
          snakeCaseKeys: Object.keys(snakeCaseData),
          hasPromptMessages: !!snakeCaseData.prompt_messages,
          hasEnabledParams: !!snakeCaseData.enabled_parameters,
          hasParamValues: !!snakeCaseData.parameter_values,
        });

        // Use the mapper to convert to domain object
        const agent = AgentDrizzleMapper.toDomain(snakeCaseData as any);

        console.log("[APPLY-AGENT-CHANGES] Converted to domain object:", {
          nodeId,
          agentId: agent.id.toString(),
          hasPromptMessages: agent.props.promptMessages
            ? agent.props.promptMessages.length > 0
            : false,
          promptMessageCount: agent.props.promptMessages?.length,
        });

        // Save the complete agent
        const result = await AgentService.saveAgent.execute(agent);

        if (result.isSuccess) {
          console.log(
            "[APPLY-AGENT-CHANGES] Successfully saved complete agent",
          );
          // Invalidate queries to refresh UI
          await queryClient.invalidateQueries({
            queryKey: agentKeys.prompt(nodeId),
          });
          await queryClient.invalidateQueries({
            queryKey: agentKeys.detail(nodeId),
          });
          await queryClient.invalidateQueries({
            queryKey: agentKeys.output(nodeId),
          });
        } else {
          throw new Error(`Failed to save agent: ${result.getError()}`);
        }
      } catch (error: any) {
        console.error("[APPLY-AGENT-CHANGES] Error updating agent:", error);
        throw new Error(`Failed to update agent ${nodeId}: ${error.message}`);
      }

      return ["agent"];
    },
    [queryClient],
  );

  /**
   * Apply if-node changes using granular mutations
   */
  const applyIfNodeChanges = useCallback(
    async (nodeId: string, ifNodeData: EditableIfNodeData) => {
      const changes: string[] = [];

      // Update conditions and logic operator using FlowService (which supports draftConditions)
      if (
        ifNodeData.conditions !== undefined ||
        ifNodeData.logicOperator !== undefined
      ) {
        const result = await FlowService.updateIfNodeConditions.execute({
          flowId,
          nodeId,
          conditions: (ifNodeData.conditions || []) as any, // Type conversion for different condition formats
          draftConditions: (ifNodeData.conditions || []) as any, // Use same conditions for drafts
          logicOperator: ifNodeData.logicOperator || "AND",
        });
        if (result.isSuccess) {
          changes.push("conditions", "logicOperator");
          await queryClient.invalidateQueries({
            queryKey: ifNodeKeys.conditions(nodeId),
          });
          await queryClient.invalidateQueries({
            queryKey: ifNodeKeys.detail(nodeId),
          });
        } else {
          throw new Error(
            `Failed to update if-node conditions: ${result.getError()}`,
          );
        }
      }

      // Update name
      if (ifNodeData.name !== undefined) {
        const result = await IfNodeService.updateIfNodeName.execute({
          flowId,
          nodeId,
          name: ifNodeData.name,
        });
        if (result.isSuccess) {
          changes.push("name");
          await queryClient.invalidateQueries({
            queryKey: ifNodeKeys.name(nodeId),
          });
          await queryClient.invalidateQueries({
            queryKey: ifNodeKeys.detail(nodeId),
          });
        } else {
          throw new Error(
            `Failed to update if-node name: ${result.getError()}`,
          );
        }
      }

      return changes;
    },
    [flowId],
  );

  /**
   * Apply datastore-node changes using granular mutations
   */
  const applyDataStoreNodeChanges = useCallback(
    async (nodeId: string, dataStoreData: EditableDataStoreNodeData) => {
      const changes: string[] = [];

      // Update fields
      if (dataStoreData.dataStoreFields !== undefined) {
        const result =
          await DataStoreNodeService.updateDataStoreNodeFields.execute({
            flowId,
            nodeId,
            fields: dataStoreData.dataStoreFields,
          });
        if (result.isSuccess) {
          changes.push("dataStoreFields");
          await queryClient.invalidateQueries({
            queryKey: dataStoreNodeKeys.fields(nodeId),
          });
          await queryClient.invalidateQueries({
            queryKey: dataStoreNodeKeys.detail(nodeId),
          });
        }
      }

      // Update name
      if (dataStoreData.name !== undefined) {
        const result =
          await DataStoreNodeService.updateDataStoreNodeName.execute({
            flowId,
            nodeId,
            name: dataStoreData.name,
          });
        if (result.isSuccess) {
          changes.push("name");
          await queryClient.invalidateQueries({
            queryKey: dataStoreNodeKeys.name(nodeId),
          });
          await queryClient.invalidateQueries({
            queryKey: dataStoreNodeKeys.detail(nodeId),
          });
        }
      }

      return changes;
    },
    [flowId],
  );

  /**
   * Apply changes to flow using granular mutations
   * Each field is updated separately using the same mutations panels use
   */
  const applyFlowChanges = useCallback(
    async (editedData: EditableFlowData) => {
      const appliedFields: string[] = [];
      const errors: string[] = [];

      try {
        // Apply flow name change using mutation
        if (editedData.name && editedData.name !== currentFlow?.props?.name) {
          try {
            await updateFlowName.mutateAsync(editedData.name);
            appliedFields.push("name");
          } catch (error) {
            errors.push(`Failed to update flow name: ${error}`);
          }
        }

        // Check and apply response template (response design) change
        if (
          editedData.response_template !== undefined &&
          editedData.response_template !== currentFlow?.props?.responseTemplate
        ) {
          try {
            // Response template update - using flow service directly
            const result = await FlowService.updateResponseTemplate.execute({
              flowId,
              responseTemplate: editedData.response_template, // Updated to use 'responseTemplate'
            });
            if (result.isSuccess) {
              appliedFields.push("response_template");
              await invalidateSingleFlowQueries(queryClient, flowId);
            } else {
              throw new Error("Failed to update response template");
            }
          } catch (error) {
            errors.push(`Failed to update response design: ${error}`);
          }
        }

        // Check and apply data store schema changes
        if (editedData.data_store_schema !== undefined) {
          const hasDataStoreChanges =
            JSON.stringify(currentFlow?.props?.dataStoreSchema) !==
            JSON.stringify(editedData.data_store_schema);
          if (hasDataStoreChanges) {
            try {
              await updateDataStoreSchema.mutateAsync(
                editedData.data_store_schema,
              );
              appliedFields.push("data_store_schema");
            } catch (error) {
              errors.push(`Failed to update data store schema: ${error}`);
            }
          }
        }

        // Check for node/edge structure changes (only if they exist in edited data)
        const hasNodeChanges =
          editedData.nodes &&
          !areNodesEqual(currentFlow?.props?.nodes, editedData.nodes);
        const hasEdgeChanges =
          editedData.edges &&
          !areEdgesEqual(currentFlow?.props?.edges, editedData.edges);

        if (hasNodeChanges || hasEdgeChanges) {
          // Update flow structure (nodes and edges)
          try {
            await updateNodesAndEdges.mutateAsync({
              nodes: hasNodeChanges
                ? (editedData.nodes as any)
                : currentFlow?.props?.nodes || [],
              edges: hasEdgeChanges
                ? (editedData.edges as any)
                : currentFlow?.props?.edges || [],
            });
            if (hasNodeChanges) appliedFields.push("nodes");
            if (hasEdgeChanges) appliedFields.push("edges");
          } catch (error) {
            errors.push(`Failed to update flow structure: ${error}`);
          }
        }

        // Apply agent changes using granular mutations
        if (editedData.agents) {
          console.log("[FLOW-CHANGES] Processing agents:", {
            agentCount: Object.keys(editedData.agents).length,
            agentIds: Object.keys(editedData.agents),
            firstAgent: Object.values(editedData.agents)[0],
          });

          for (const [nodeId, agentData] of Object.entries(editedData.agents)) {
            try {
              console.log(`[FLOW-CHANGES] Processing agent ${nodeId}:`, {
                hasData: !!agentData,
                dataKeys: agentData ? Object.keys(agentData) : [],
                fullData: JSON.stringify(agentData, null, 2),
              });

              // Apply agent updates using the same mutations panels use
              await applyAgentChanges(nodeId, agentData);
              appliedFields.push(`agents.${nodeId}`);
            } catch (error) {
              errors.push(`Failed to update agent ${nodeId}: ${error}`);
            }
          }
        }

        // Apply if-node changes using granular mutations
        if (editedData.ifNodes) {
          for (const [nodeId, ifNodeData] of Object.entries(
            editedData.ifNodes,
          )) {
            try {
              await applyIfNodeChanges(
                nodeId,
                ifNodeData as EditableIfNodeData,
              );
              appliedFields.push(`ifNodes.${nodeId}`);
            } catch (error) {
              errors.push(`Failed to update if-node ${nodeId}: ${error}`);
            }
          }
        }

        // Apply datastore-node changes using granular mutations
        if (editedData.dataStoreNodes) {
          for (const [nodeId, dataStoreData] of Object.entries(
            editedData.dataStoreNodes,
          )) {
            try {
              await applyDataStoreNodeChanges(
                nodeId,
                dataStoreData as EditableDataStoreNodeData,
              );
              appliedFields.push(`dataStoreNodes.${nodeId}`);
            } catch (error) {
              errors.push(`Failed to update datastore ${nodeId}: ${error}`);
            }
          }
        }

        return { success: errors.length === 0, appliedFields, errors };
      } catch (error) {
        console.error("Failed to apply flow changes:", error);
        return {
          success: false,
          appliedFields,
          errors: [error?.toString() || "Unknown error"],
        };
      }
    },
    [flowId, currentFlow],
  );

  /**
   * Main apply changes function
   */
  const applyChanges = useCallback(
    async (editedData: EditableFlowData) => {
      const result = await applyFlowChanges(editedData);

      // Invalidate queries to refresh UI
      await invalidateSingleFlowQueries(queryClient, flowId);

      // Report results
      if (result.errors.length === 0) {
        toast.success(
          `Successfully applied ${result.appliedFields.length} flow changes`,
        );
        onSuccess?.();
      } else {
        toast.warning(
          `Applied ${result.appliedFields.length} changes with ${result.errors.length} errors`,
        );
        result.errors.forEach((error) => console.error(error));
        if (result.appliedFields.length === 0) {
          onError?.(new Error(result.errors.join(", ")));
        }
      }

      return result;
    },
    [applyFlowChanges, flowId, onSuccess, onError],
  );

  return {
    applyChanges,
  };
};

/**
 * Helper functions to compare flow structures
 */
function areNodesEqual(current: any[] | undefined, edited: any[]): boolean {
  if (!current && (!edited || edited.length === 0)) return true;
  if (!current || !edited) return false;
  if (current.length !== edited.length) return false;

  // Create a map for quick lookup
  const currentMap = new Map(current.map((n) => [n.id, n]));

  return edited.every((editedNode) => {
    const currentNode = currentMap.get(editedNode.id);
    if (!currentNode) return false;

    return (
      currentNode.type === editedNode.type &&
      currentNode.position?.x === editedNode.position?.x &&
      currentNode.position?.y === editedNode.position?.y &&
      JSON.stringify(currentNode.data) === JSON.stringify(editedNode.data)
    );
  });
}

function areEdgesEqual(current: any[] | undefined, edited: any[]): boolean {
  if (!current && (!edited || edited.length === 0)) return true;
  if (!current || !edited) return false;
  if (current.length !== edited.length) return false;

  // Create a map for quick lookup
  const currentMap = new Map(current.map((e) => [e.id, e]));

  return edited.every((editedEdge) => {
    const currentEdge = currentMap.get(editedEdge.id);
    if (!currentEdge) return false;

    return (
      currentEdge.source === editedEdge.source &&
      currentEdge.target === editedEdge.target &&
      currentEdge.sourceHandle === editedEdge.sourceHandle &&
      currentEdge.targetHandle === editedEdge.targetHandle
    );
  });
}

/**
 * Extract flow fields from vibe response data
 * The vibe response should already be in EditableFlowData format
 */
export const extractFlowFields = (vibeData: any): EditableFlowData => {
  // Check if the data is flattened with paths like "agents.uuid.field"
  const result: EditableFlowData = {
    name: vibeData.name,
    response_template: vibeData.response_template,
    data_store_schema: vibeData.data_store_schema,
    nodes: vibeData.nodes,
    edges: vibeData.edges,
  };

  // Process flattened agent paths
  const agents: Record<string, EditableAgentData> = {};
  const ifNodes: Record<string, EditableIfNodeData> = {};
  const dataStoreNodes: Record<string, EditableDataStoreNodeData> = {};

  Object.keys(vibeData).forEach((key) => {
    if (key.startsWith("agents.")) {
      // Parse "agents.uuid.field" paths
      const parts = key.split(".");
      if (parts.length >= 3) {
        const agentId = parts[1];
        const field = parts.slice(2).join(".");

        if (!agents[agentId]) {
          agents[agentId] = {} as EditableAgentData;
        }

        // Set the field value with proper typing
        const agentField = field as keyof EditableAgentData;
        if (agentField in agents[agentId]) {
          (agents[agentId] as any)[agentField] = vibeData[key];
        } else {
          (agents[agentId] as any)[agentField] = vibeData[key];
        }
      }
    } else if (key.startsWith("ifNodes.")) {
      // Parse "ifNodes.uuid.field" paths
      const parts = key.split(".");
      if (parts.length >= 3) {
        const nodeId = parts[1];
        const field = parts.slice(2).join(".");

        if (!ifNodes[nodeId]) {
          ifNodes[nodeId] = {} as EditableIfNodeData;
        }

        // Use any casting to allow dynamic field assignment
        (ifNodes[nodeId] as any)[field] = vibeData[key];
      }
    } else if (key.startsWith("dataStoreNodes.")) {
      // Parse "dataStoreNodes.uuid.field" paths
      const parts = key.split(".");
      if (parts.length >= 3) {
        const nodeId = parts[1];
        const field = parts.slice(2).join(".");

        if (!dataStoreNodes[nodeId]) {
          dataStoreNodes[nodeId] = {} as EditableDataStoreNodeData;
        }

        // Use any casting to allow dynamic field assignment
        (dataStoreNodes[nodeId] as any)[field] = vibeData[key];
      }
    }
  });

  // Only add these if they have content
  if (Object.keys(agents).length > 0) {
    result.agents = agents;
  }
  if (Object.keys(ifNodes).length > 0) {
    result.ifNodes = ifNodes;
  }
  if (Object.keys(dataStoreNodes).length > 0) {
    result.dataStoreNodes = dataStoreNodes;
  }

  // If the data is already structured properly, return it
  if (vibeData.agents || vibeData.ifNodes || vibeData.dataStoreNodes) {
    return {
      ...result,
      agents: vibeData.agents || result.agents,
      ifNodes: vibeData.ifNodes || result.ifNodes,
      dataStoreNodes: vibeData.dataStoreNodes || result.dataStoreNodes,
    };
  }

  return result;
};
