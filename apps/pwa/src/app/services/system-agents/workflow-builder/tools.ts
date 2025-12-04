/**
 * Workflow Builder Tools
 *
 * AI agent tools for building workflow graphs with agents, conditions, and data store nodes.
 */

import { tool } from "ai";
import { z } from "zod";

import { NodeType } from "@/entities/flow/model/node-types";
import { TemplateRenderer } from "@/shared/lib/template-renderer";
import type { Node, Edge } from "@/entities/flow/domain/flow";
import { SchemaFieldType, type SchemaField } from "@/entities/agent/domain/agent";
import type { ConditionDataType, ConditionOperator } from "@/features/flow/types/condition-types";
import { getDefaultOperatorForDataType, getOperatorsForDataType } from "@/features/flow/types/condition-types";
import { variableList, VariableGroup } from "@/shared/prompt/domain/variable";

import {
  type WorkflowBuilderContext,
  type WorkflowState,
  type WorkflowAgent,
  type WorkflowIfNode,
  type WorkflowDataStoreNode,
  ModelTier,
} from "./types";
import {
  generateUniqueId,
  toSnakeCase,
  createPlainMessage,
  createPromptBlock,
} from "./helpers";

// ============================================================================
// Tool Factories
// ============================================================================

// Tool descriptions for progress display
export const TOOL_DESCRIPTIONS: Record<string, string> = {
  add_edges: "Connecting nodes",
  remove_edges: "Removing connections",
  add_agent_block: "Creating agent block",
  remove_agent_block: "Removing agent block",
  upsert_prompt_messages: "Configuring prompt messages",
  upsert_output_fields: "Configuring output fields",
  update_data_store_node_fields: "Configuring data store fields",
  update_if_node: "Updating conditional node",
  query_current_state: "Inspecting workflow state",
  query_available_variables: "Querying available variables",
  query_condition_operators: "Querying condition operators",
  validate_workflow: "Validating workflow",
  mock_render_workflow: "Testing workflow rendering with mock values",
};

export function createWorkflowTools(
  state: WorkflowState,
  context: WorkflowBuilderContext,
  callbacks: {
    onStateChange: (state: WorkflowState) => void;
    onToolCall?: (toolName: string, args: unknown) => void;
    onToolResult?: (toolName: string, result: unknown) => void;
  }
) {
  // Helper to get default position (auto-layout will organize nodes later)
  const getNextPosition = (): { x: number; y: number } => {
    return { x: 0, y: 0 };
  };

  // Helper to find node by ID
  const findNode = (nodeId: string): Node | undefined => {
    return state.nodes.find((n) => n.id === nodeId);
  };

  // Helper to find agent by ID (either agent ID or node ID)
  const findAgent = (agentId: string): WorkflowAgent | undefined => {
    // Try direct lookup first
    if (state.agents.has(agentId)) {
      return state.agents.get(agentId);
    }
    // Try finding by node ID
    for (const agent of state.agents.values()) {
      if (agent.nodeId === agentId) {
        return agent;
      }
    }
    return undefined;
  };

  return {
    add_edges: tool({
      description: "Connect nodes with one or more edges. Use ifBranch for if-node branches only.",
      inputSchema: z.object({
        edges: z.array(z.object({
          sourceId: z.string().describe("ID of the source node"),
          targetId: z.string().describe("ID of the target node"),
          ifBranch: z.boolean().optional().describe("Only for If nodes: true for 'true' branch, false for 'false' branch. Omit for non-If nodes."),
        })).describe("Array of edges to create"),
      }),
      execute: async ({ edges }) => {
        const created: Array<{ edgeId: string; source: string; target: string; branch?: string }> = [];
        const failed: Array<{ source: string; target: string; reason: string }> = [];

        for (const { sourceId, targetId, ifBranch } of edges) {
          const sourceNode = findNode(sourceId);
          const targetNode = findNode(targetId);

          if (!sourceNode) {
            failed.push({ source: sourceId, target: targetId, reason: `Source node '${sourceId}' not found` });
            continue;
          }
          if (!targetNode) {
            failed.push({ source: sourceId, target: targetId, reason: `Target node '${targetId}' not found` });
            continue;
          }

          // Derive sourceHandle and label from ifBranch
          const sourceHandle = ifBranch !== undefined ? (ifBranch ? "true" : "false") : null;
          const label = ifBranch !== undefined ? (ifBranch ? "True" : "False") : undefined;

          const edgeId = generateUniqueId();
          const edge: Edge = {
            id: edgeId,
            source: sourceId,
            target: targetId,
            sourceHandle,
            targetHandle: null,
            label,
          };

          state.edges.push(edge);
          created.push({
            edgeId,
            source: sourceId,
            target: targetId,
            branch: ifBranch !== undefined ? (ifBranch ? "true" : "false") : undefined,
          });
        }

        if (created.length > 0) {
          callbacks.onStateChange(state);
        }

        if (failed.length > 0 && created.length === 0) {
          const availableNodes = state.nodes.map((n) => ({ id: n.id, type: n.type }));
          return {
            success: false,
            message: `All ${failed.length} edge(s) failed to create`,
            failed,
            availableNodes,
          };
        }

        return {
          success: true,
          message: `Created ${created.length} edge(s)${failed.length > 0 ? `, ${failed.length} failed` : ""}`,
          created,
          failed: failed.length > 0 ? failed : undefined,
        };
      },
    }),

    remove_edges: tool({
      description: "Remove edges by their IDs (one or more). Call query_current_state first if you need to find edge IDs.",
      inputSchema: z.object({
        edgeIds: z.array(z.string()).describe("Array of edge IDs to remove"),
      }),
      execute: async ({ edgeIds }) => {
        const removed: string[] = [];
        const notFound: string[] = [];

        for (const edgeId of edgeIds) {
          const edgeIndex = state.edges.findIndex((e) => e.id === edgeId);
          if (edgeIndex === -1) {
            notFound.push(edgeId);
          } else {
            state.edges.splice(edgeIndex, 1);
            removed.push(edgeId);
          }
        }

        if (removed.length > 0) {
          callbacks.onStateChange(state);
        }

        if (notFound.length > 0 && removed.length === 0) {
          // Provide current edges to help AI retry
          const currentEdges = state.edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
          }));
          return {
            success: false,
            message: `Edge(s) not found: ${notFound.join(", ")}`,
            hint: "Call query_current_state to get current edge IDs",
            currentEdges,
          };
        }

        return {
          success: true,
          message: `Removed ${removed.length} edge(s)`,
          removed,
          notFound: notFound.length > 0 ? notFound : undefined,
        };
      },
    }),

    add_agent_block: tool({
      description: "Create a complete Agent Block: [If?] → Agent → DataStore with all internal edges connected. Only creates nodes and edges - use other tools to configure If conditions, prompts, output fields, and datastore field mappings. Returns variableName (snake_case) for use as {{variableName.field}} in prompts.",
      inputSchema: z.object({
        name: z.string().describe("Name for the agent. Use Title Case with spaces (e.g., 'Intent Analyzer', 'Combat Handler'). Will be converted to snake_case for variable reference (e.g., 'intent_analyzer')."),
        description: z.string().describe("What this agent does and its purpose"),
        modelTier: z.enum(["light", "heavy"]).describe("Model tier: 'light' for fast tasks, 'heavy' for complex reasoning"),
        withIfNode: z.boolean().describe("CRITICAL for optimization! Set TRUE to add an If Node gate that can skip this agent when conditions aren't met. Only set FALSE for agents that MUST run on every message (e.g., intent analyzer). Most specialized agents (romance, combat, world state) should use TRUE."),
      }),
      execute: async ({ name, description, modelTier, withIfNode }) => {
        const createdNodes: { type: string; nodeId: string; configId?: string }[] = [];
        const createdEdges: string[] = [];

        // Convert name to snake_case for consistent variable references
        const snakeCaseName = toSnakeCase(name);

        // Track positions for layout
        let currentPosition = getNextPosition();
        const positionOffset = 250;

        // Generate IDs upfront so we can reference them in node data
        const agentId = generateUniqueId();
        const dataStoreId = generateUniqueId();
        let ifNodeId: string | undefined;
        if (withIfNode) {
          ifNodeId = generateUniqueId();
        }

        // Block metadata to store in each node's data field
        // This allows clean deletion of the entire block later
        const blockMetadata = {
          isFromTemplate: false,
          blockAgentId: agentId, // The agent ID that owns this block
          blockNodeIds: {
            agentId,
            dataStoreId,
            ifNodeId: ifNodeId || null,
          },
        };

        // 1. Create If Node (optional)
        // Node ID = Config ID (simplified model)
        if (withIfNode && ifNodeId) {
          const ifNode: Node = {
            id: ifNodeId,
            type: NodeType.IF,
            position: { ...currentPosition },
            data: { ...blockMetadata },
          };

          const ifNodeData: WorkflowIfNode = {
            id: ifNodeId,
            nodeId: ifNodeId,
            name: `gate_${snakeCaseName}`,
            logicOperator: "AND",
            conditions: [], // Configure with update_if_node
          };

          state.nodes.push(ifNode);
          state.ifNodes.set(ifNodeId, ifNodeData);
          createdNodes.push({ type: "if", nodeId: ifNodeId });

          currentPosition = { x: currentPosition.x + positionOffset, y: currentPosition.y };
        }

        // 2. Create Agent Node (always)
        // Node ID = Agent ID (simplified model)
        const agentNode: Node = {
          id: agentId,
          type: NodeType.AGENT,
          position: { ...currentPosition },
          data: { ...blockMetadata },
        };

        const agent: WorkflowAgent = {
          id: agentId,
          nodeId: agentId,
          name: snakeCaseName,
          description,
          modelTier: modelTier === "heavy" ? ModelTier.Heavy : ModelTier.Light,
          promptMessages: [],
          historyEnabled: false,
          historyCount: 10,
          enabledStructuredOutput: true,
          schemaFields: [],
        };

        state.nodes.push(agentNode);
        state.agents.set(agentId, agent);
        createdNodes.push({ type: "agent", nodeId: agentId });

        currentPosition = { x: currentPosition.x + positionOffset, y: currentPosition.y };

        // 3. Create DataStore Node (always)
        // Node ID = DataStore ID (simplified model)
        const dsNode: Node = {
          id: dataStoreId,
          type: NodeType.DATA_STORE,
          position: { ...currentPosition },
          data: { ...blockMetadata },
        };

        const dsNodeData: WorkflowDataStoreNode = {
          id: dataStoreId,
          nodeId: dataStoreId,
          name: `save_${snakeCaseName}_output`,
          fields: [], // Configure with update_data_store_node_fields
        };

        state.nodes.push(dsNode);
        state.dataStoreNodes.set(dataStoreId, dsNodeData);
        createdNodes.push({ type: "dataStore", nodeId: dataStoreId });

        // 4. Create internal edges
        // If Node 'true' → Agent
        if (withIfNode && ifNodeId) {
          const edgeId = generateUniqueId();
          state.edges.push({
            id: edgeId,
            source: ifNodeId,
            target: agentId,
            sourceHandle: "true",
            targetHandle: null,
          });
          createdEdges.push(edgeId);
        }

        // Agent → DataStore
        const agentToDsEdgeId = generateUniqueId();
        state.edges.push({
          id: agentToDsEdgeId,
          source: agentId,
          target: dataStoreId,
          sourceHandle: null,
          targetHandle: null,
        });
        createdEdges.push(agentToDsEdgeId);

        callbacks.onStateChange(state);

        // Determine entry and exit points for this block
        // Node ID = Config ID in the simplified model
        const entryNodeId = withIfNode ? ifNodeId! : agentId;
        const exitNodeId = dataStoreId;

        // Build instruction for connecting this block
        let connectionInstruction = `Connect to this block: add_edges([{ sourceId: <previous_node>, targetId: '${entryNodeId}' }])`;
        const pendingConnections: string[] = [];

        // DataStore exit edge (required for serial flows)
        pendingConnections.push(
          `DataStore Node '${dataStoreId}' needs an outgoing edge. ` +
          `CRITICAL: Connect it to the next block or End node using: ` +
          `add_edges([{ sourceId: '${dataStoreId}', targetId: <next_node> }])`
        );

        if (withIfNode) {
          pendingConnections.push(
            `If Node '${ifNodeId}' has an unconnected 'false' branch. ` +
            `After creating all blocks, connect it to the skip target (next block's entry or End node) using: ` +
            `add_edges([{ sourceId: '${ifNodeId}', targetId: <skip_target>, ifBranch: false }])`
          );
        }

        return {
          success: true,
          message: `Created agent block '${snakeCaseName}' with ${createdNodes.length} node(s)`,
          block: {
            entryNodeId,
            exitNodeId,
            skipHandle: withIfNode ? "false" : undefined,
            agentId,
            agentName: snakeCaseName,
            variableName: snakeCaseName,
            ifNodeId: withIfNode ? ifNodeId : undefined,
            ifNodeName: withIfNode ? `gate_${snakeCaseName}` : undefined,
            dataStoreId,
            dataStoreName: `save_${snakeCaseName}_output`,
          },
          createdNodes,
          createdEdges,
          connectionInstruction,
          pendingConnections,
        };
      },
    }),

    remove_agent_block: tool({
      description: "Remove an entire Agent Block (If Node + Agent + DataStore) and all its edges. NOTE: Template nodes (marked with isFromTemplate: true) CANNOT be deleted - they will be skipped with a warning.",
      inputSchema: z.object({
        agentId: z.string().describe("ID of the agent in the block to remove"),
      }),
      execute: async ({ agentId }) => {
        const agent = state.agents.get(agentId);
        if (!agent) {
          return { success: false, message: `Agent '${agentId}' not found` };
        }

        // Find the agent node to get block metadata
        const agentNode = state.nodes.find((n) => n.id === agentId);
        if (!agentNode) {
          return { success: false, message: `Agent node '${agentId}' not found` };
        }

        // Type for block metadata stored in node.data
        type BlockMetadata = {
          isFromTemplate?: boolean;
          blockAgentId?: string;
          blockNodeIds?: {
            agentId: string;
            dataStoreId: string;
            ifNodeId: string | null;
          };
        };

        const nodeData = agentNode.data as BlockMetadata;

        // Check if this is a template node - template nodes cannot be deleted
        if (nodeData.isFromTemplate) {
          return {
            success: false,
            message: `Cannot delete agent block '${agent.name}' - it is a template node that cannot be removed.`,
            isTemplateNode: true,
          };
        }

        // Get all node IDs in this block from the stored metadata
        const blockNodeIds = nodeData.blockNodeIds;
        if (!blockNodeIds) {
          // Fallback for nodes created before block metadata was added
          // Just delete the agent node itself
          state.agents.delete(agentId);
          state.nodes = state.nodes.filter((n) => n.id !== agentId);
          state.edges = state.edges.filter(
            (e) => e.source !== agentId && e.target !== agentId
          );
          callbacks.onStateChange(state);
          return {
            success: true,
            message: `Removed agent '${agent.name}' (legacy node without block metadata)`,
            removedNodes: [agentId],
          };
        }

        // Collect all node IDs to remove
        const nodesToRemove: string[] = [blockNodeIds.agentId, blockNodeIds.dataStoreId];
        if (blockNodeIds.ifNodeId) {
          nodesToRemove.push(blockNodeIds.ifNodeId);
        }

        // Remove from Maps
        state.agents.delete(blockNodeIds.agentId);
        state.dataStoreNodes.delete(blockNodeIds.dataStoreId);
        if (blockNodeIds.ifNodeId) {
          state.ifNodes.delete(blockNodeIds.ifNodeId);
        }

        // Remove all nodes in the block
        state.nodes = state.nodes.filter((n) => !nodesToRemove.includes(n.id));

        // Remove all edges connected to any node in the block
        state.edges = state.edges.filter(
          (e) => !nodesToRemove.includes(e.source) && !nodesToRemove.includes(e.target)
        );

        callbacks.onStateChange(state);

        return {
          success: true,
          message: `Removed agent block '${agent.name}' (${nodesToRemove.length} nodes)`,
          removedNodes: nodesToRemove,
        };
      },
    }),

    upsert_prompt_messages: tool({
      description: "Add, update, or delete prompt messages for an agent (one or more). For each message: if messageId is provided, updates or deletes existing; otherwise creates new.",
      inputSchema: z.object({
        agentId: z.string().describe("ID of the agent"),
        messages: z.array(z.object({
          role: z.enum(["system", "user", "assistant"]).optional().describe("Message role (required when creating)"),
          content: z.string().optional().describe("Message content (required when creating, can include {{variables}})"),
          messageId: z.string().optional().describe("ID of existing message to update/delete. Omit to create new message."),
          index: z.number().optional().describe("Position to insert new message (default: end). Ignored when updating."),
          delete: z.boolean().optional().describe("Set to true to delete the message (requires messageId)"),
        })).describe("Array of messages to add, update, or delete"),
      }),
      execute: async ({ agentId, messages }) => {
        const agent = findAgent(agentId);
        if (!agent) {
          const availableAgents = Array.from(state.agents.values()).map((a) => ({ id: a.id, name: a.name }));
          return { success: false, message: `Agent '${agentId}' not found`, availableAgents };
        }

        const results: Array<{ action: string; messageId?: string; role?: string; error?: string }> = [];

        for (const { role, content, messageId, index, delete: shouldDelete } of messages) {
          // Delete mode
          if (shouldDelete) {
            if (!messageId) {
              results.push({ action: "failed", error: "messageId is required to delete a message" });
              continue;
            }
            const msgIndex = agent.promptMessages.findIndex((m) => m.id === messageId);
            if (msgIndex === -1) {
              results.push({ action: "failed", messageId, error: `Message '${messageId}' not found` });
              continue;
            }

            const deletedMsg = agent.promptMessages[msgIndex];
            agent.promptMessages.splice(msgIndex, 1);

            // If we deleted a history message, update historyEnabled flag
            if (deletedMsg.type === "history") {
              agent.historyEnabled = false;
            }

            results.push({ action: "deleted", messageId });
            continue;
          }

          // Update existing message
          if (messageId) {
            const msg = agent.promptMessages.find((m) => m.id === messageId);
            if (!msg) {
              results.push({ action: "failed", messageId, error: `Message '${messageId}' not found` });
              continue;
            }

            if (msg.type === "history") {
              results.push({ action: "failed", messageId, error: "Cannot update history message content directly. Delete and recreate if needed." });
              continue;
            }

            // Update role and content
            if (msg.type === "plain") {
              if (role !== undefined) {
                msg.role = role;
              }
              if (content !== undefined) {
                if (msg.promptBlocks.length > 0) {
                  msg.promptBlocks[0].template = content;
                } else {
                  msg.promptBlocks.push(createPromptBlock(content, `${msg.role} block`));
                }
              }
            }

            results.push({ action: "updated", messageId });
            continue;
          }

          // Create new message - require role and content
          if (!role) {
            results.push({ action: "failed", error: "'role' is required to create a new message" });
            continue;
          }
          if (!content) {
            results.push({ action: "failed", role, error: "'content' is required to create a new message" });
            continue;
          }

          const message = createPlainMessage(role, content);

          if (index !== undefined && index >= 0 && index < agent.promptMessages.length) {
            agent.promptMessages.splice(index, 0, message);
          } else {
            agent.promptMessages.push(message);
          }

          results.push({ action: "created", messageId: message.id, role });
        }

        // Post-processing: Enforce that system messages can only be at index 0
        // Convert any system message after the first position to user role
        let systemRoleFixed = 0;
        for (let i = 1; i < agent.promptMessages.length; i++) {
          const msg = agent.promptMessages[i];
          if (msg.type === "plain" && msg.role === "system") {
            msg.role = "user";
            systemRoleFixed++;
          }
        }

        callbacks.onStateChange(state);

        const created = results.filter((r) => r.action === "created").length;
        const updated = results.filter((r) => r.action === "updated").length;
        const deleted = results.filter((r) => r.action === "deleted").length;
        const failed = results.filter((r) => r.action === "failed").length;

        return {
          success: failed === 0,
          message: `Processed ${messages.length} message(s): ${created} created, ${updated} updated, ${deleted} deleted${failed > 0 ? `, ${failed} failed` : ""}${systemRoleFixed > 0 ? ` (${systemRoleFixed} system message(s) converted to user - system role only allowed at first position)` : ""}`,
          results,
          systemRoleFixed: systemRoleFixed > 0 ? systemRoleFixed : undefined,
        };
      },
    }),

    upsert_output_fields: tool({
      description: "Add, update, or delete output fields in the agent's structured output schema (one or more). For each field: if exists, updates it; if delete=true, removes it; otherwise creates new.",
      inputSchema: z.object({
        agentId: z.string().describe("ID of the agent"),
        fields: z.array(z.object({
          name: z.string().describe("Field name in snake_case. Use only lowercase letters, numbers, and underscores (e.g., 'response', 'health_change', 'new_location'). No spaces or special characters."),
          type: z.enum(["string", "integer", "number", "boolean"]).optional().describe("Field type (required when creating)"),
          description: z.string().optional().describe("Description of what this field contains (required when creating)"),
          required: z.boolean().optional().describe("Whether this field is required (default: true)"),
          minimum: z.number().optional().describe("Minimum value for integer/number fields (inclusive)"),
          maximum: z.number().optional().describe("Maximum value for integer/number fields (inclusive)"),
          delete: z.boolean().optional().describe("Set to true to delete this field"),
        })).describe("Array of fields to add, update, or delete"),
      }),
      execute: async ({ agentId, fields }) => {
        const agent = findAgent(agentId);
        if (!agent) {
          const availableAgents = Array.from(state.agents.values()).map((a) => ({ id: a.id, name: a.name }));
          return { success: false, message: `Agent '${agentId}' not found`, availableAgents };
        }

        const results: Array<{ action: string; name: string; type?: string; error?: string }> = [];

        for (const { name, type, description, required, minimum, maximum, delete: shouldDelete } of fields) {
          // Sanitize the name to snake_case for consistent matching
          const sanitizedName = toSnakeCase(name);
          const existingFieldIndex = agent.schemaFields.findIndex((f) => f.name === sanitizedName);
          const existingField = existingFieldIndex !== -1 ? agent.schemaFields[existingFieldIndex] : undefined;

          // Delete mode
          if (shouldDelete) {
            if (!existingField) {
              results.push({ action: "failed", name: sanitizedName, error: `Field '${sanitizedName}' not found` });
              continue;
            }
            agent.schemaFields.splice(existingFieldIndex, 1);
            results.push({ action: "deleted", name: sanitizedName });
            continue;
          }

          // Update mode (field exists)
          if (existingField) {
            if (description !== undefined) {
              existingField.description = description;
            }
            if (type !== undefined) {
              existingField.type = {
                string: SchemaFieldType.String,
                integer: SchemaFieldType.Integer,
                number: SchemaFieldType.Number,
                boolean: SchemaFieldType.Boolean,
              }[type];
            }
            if (required !== undefined) {
              existingField.required = required;
            }
            if (minimum !== undefined) {
              existingField.minimum = minimum;
            }
            if (maximum !== undefined) {
              existingField.maximum = maximum;
            }
            results.push({ action: "updated", name, type });
            continue;
          }

          // Create mode (field doesn't exist)
          if (!type) {
            results.push({ action: "failed", name, error: `Field '${name}' doesn't exist and 'type' is required to create it` });
            continue;
          }
          if (!description) {
            results.push({ action: "failed", name, error: `Field '${name}' doesn't exist and 'description' is required to create it` });
            continue;
          }

          const fieldType = {
            string: SchemaFieldType.String,
            integer: SchemaFieldType.Integer,
            number: SchemaFieldType.Number,
            boolean: SchemaFieldType.Boolean,
          }[type];

          const field: SchemaField = {
            name: sanitizedName,
            type: fieldType,
            description,
            required: required ?? true,
            array: false,
            minimum,
            maximum,
          };

          agent.schemaFields.push(field);
          results.push({ action: "created", name: sanitizedName, type });
        }

        callbacks.onStateChange(state);

        const created = results.filter((r) => r.action === "created").length;
        const updated = results.filter((r) => r.action === "updated").length;
        const deleted = results.filter((r) => r.action === "deleted").length;
        const failed = results.filter((r) => r.action === "failed").length;

        return {
          success: failed === 0,
          message: `Processed ${fields.length} field(s): ${created} created, ${updated} updated, ${deleted} deleted${failed > 0 ? `, ${failed} failed` : ""}`,
          results,
        };
      },
    }),

    update_data_store_node_fields: tool({
      description: "Configure which data store fields this node updates. Logic uses Jinja+JS: {{field_name}} for data store values, {{agent_name.field}} for agent outputs.",
      inputSchema: z.object({
        nodeId: z.string().describe("ID of the data store node"),
        fields: z.array(z.object({
          schemaFieldId: z.string().describe("The schema field ID or name (e.g., 'connection_level' or its ID from system prompt)"),
          logic: z.string().describe("Jinja+JS expression. Use {{field_name}} for data store, {{agent_name.field}} for agent output. Examples: '{{romance_engine.connection_delta}}', 'Math.max(0, {{health}} - 10)'"),
        })).describe("Fields to update with their logic expressions"),
      }),
      execute: async ({ nodeId, fields }) => {
        // Find by nodeId or dataStoreNodeId
        let dsNode: WorkflowDataStoreNode | undefined;
        for (const node of state.dataStoreNodes.values()) {
          if (node.nodeId === nodeId || node.id === nodeId) {
            dsNode = node;
            break;
          }
        }

        if (!dsNode) {
          return { success: false, message: `Data store node '${nodeId}' not found` };
        }

        // Validate and resolve schemaFieldIds - accept either ID or field name
        const validIds = new Set(context.dataStoreSchema.map((f) => f.id));
        const invalidFields: string[] = [];
        const validatedFields: Array<{ schemaFieldId: string; logic: string; fieldName: string }> = [];

        for (const f of fields) {
          if (validIds.has(f.schemaFieldId)) {
            // Direct ID match
            const schemaField = context.dataStoreSchema.find((sf) => sf.id === f.schemaFieldId);
            validatedFields.push({
              schemaFieldId: f.schemaFieldId,
              logic: f.logic,
              fieldName: schemaField?.name || "unknown",
            });
          } else {
            // Try to resolve by field name (auto-fix common mistake)
            const fieldByName = context.dataStoreSchema.find((sf) => sf.name === f.schemaFieldId);
            if (fieldByName) {
              // Auto-resolve name to ID
              validatedFields.push({
                schemaFieldId: fieldByName.id,
                logic: f.logic,
                fieldName: fieldByName.name,
              });
            } else {
              invalidFields.push(`'${f.schemaFieldId}' is not a valid schema field ID or name.`);
            }
          }
        }

        if (invalidFields.length > 0) {
          const availableFields = context.dataStoreSchema.map((f) => ({ id: f.id, name: f.name }));
          return {
            success: false,
            message: `Invalid field(s): ${invalidFields.join("; ")}`,
            availableFields,
          };
        }

        // Merge fields: update existing by schemaFieldId, add new ones
        // This prevents duplicates when the tool is called multiple times
        const existingFieldsBySchemaId = new Map(
          dsNode.fields.map((f) => [f.schemaFieldId, f])
        );

        let updatedCount = 0;
        let createdCount = 0;

        for (const f of validatedFields) {
          const existing = existingFieldsBySchemaId.get(f.schemaFieldId);
          if (existing) {
            // Update existing field's logic
            existing.logic = f.logic;
            updatedCount++;
          } else {
            // Add new field
            dsNode.fields.push({
              id: generateUniqueId(),
              schemaFieldId: f.schemaFieldId,
              logic: f.logic,
            });
            createdCount++;
          }
        }

        callbacks.onStateChange(state);

        const parts: string[] = [];
        if (createdCount > 0) parts.push(`${createdCount} created`);
        if (updatedCount > 0) parts.push(`${updatedCount} updated`);

        // Return current state of all fields on this node so AI knows what exists
        const currentFields = dsNode.fields.map((f) => {
          const schemaField = context.dataStoreSchema.find((sf) => sf.id === f.schemaFieldId);
          return {
            schemaFieldId: f.schemaFieldId,
            fieldName: schemaField?.name || "unknown",
            logic: f.logic,
          };
        });

        return {
          success: true,
          message: `Configured ${validatedFields.length} field(s) (${parts.join(", ")}): ${validatedFields.map((f) => f.fieldName).join(", ")}`,
          currentFields, // Shows all fields currently on this node
        };
      },
    }),

    update_if_node: tool({
      description: "Update an existing if node's logic operator or conditions.",
      inputSchema: z.object({
        nodeId: z.string().describe("ID of the if node"),
        logicOperator: z.enum(["AND", "OR"]).optional().describe("New logic operator"),
        conditions: z.array(z.object({
          dataType: z.enum(["string", "number", "integer", "boolean"]).describe("Data type for comparison"),
          value1: z.string().describe("Field reference to check, e.g., '{{health}}' (data store) or '{{analyzer.intent}}' (agent output)"),
          operator: z.string().describe("Comparison operator (e.g., 'integer_greater_than', 'string_equals')"),
          value2: z.string().describe("Value to compare against (as string)"),
        })).optional().describe("New conditions"),
      }),
      execute: async ({ nodeId, logicOperator, conditions }) => {
        // Find by nodeId or ifNodeId
        let ifNode: WorkflowIfNode | undefined;
        for (const node of state.ifNodes.values()) {
          if (node.nodeId === nodeId || node.id === nodeId) {
            ifNode = node;
            break;
          }
        }

        if (!ifNode) {
          return { success: false, message: `If node '${nodeId}' not found` };
        }

        if (logicOperator !== undefined) {
          ifNode.logicOperator = logicOperator;
        }
        if (conditions !== undefined) {
          // Convert input conditions to proper IfCondition format
          ifNode.conditions = conditions.map((c) => ({
            id: generateUniqueId(),
            dataType: c.dataType as ConditionDataType,
            value1: c.value1,
            operator: c.operator as ConditionOperator,
            value2: c.value2,
          }));
        }

        callbacks.onStateChange(state);

        return { success: true, message: `Updated if node '${ifNode.name}'` };
      },
    }),

    query_current_state: tool({
      description: "Get the current in-memory workflow state. Use this to inspect what has been created so far and validate the workflow structure.",
      inputSchema: z.object({
        include_all: z.boolean().describe("Set to true to include all state (nodes, edges, agents, ifNodes, dataStoreNodes). Set to false and use 'include' for specific parts."),
        include: z.array(z.enum(["nodes", "edges", "agents", "ifNodes", "dataStoreNodes", "summary"])).optional()
          .describe("What to include in response when include_all=false"),
      }),
      execute: async ({ include_all, include }) => {
        const includeAll = include_all || !include || include.length === 0;
        const result: Record<string, any> = {};

        // Nodes summary
        // In simplified model: node ID = config ID
        if (includeAll || include?.includes("nodes") || include?.includes("summary")) {
          const nodesSummary = state.nodes.map((n) => {
            const base: Record<string, any> = { id: n.id, type: n.type };
            if (n.type === NodeType.AGENT) {
              // Node ID = Agent ID in simplified model
              const agent = state.agents.get(n.id);
              base.agentName = agent?.name;
            } else if (n.type === NodeType.IF) {
              // Node ID = If Node ID in simplified model
              const ifNode = state.ifNodes.get(n.id);
              base.ifNodeName = ifNode?.name;
            } else if (n.type === NodeType.DATA_STORE) {
              // Node ID = DataStore ID in simplified model
              const dsNode = state.dataStoreNodes.get(n.id);
              base.dataStoreNodeName = dsNode?.name;
            }
            return base;
          });
          if (includeAll || include?.includes("nodes")) {
            result.nodes = nodesSummary;
          }
        }

        // Edges
        if (includeAll || include?.includes("edges")) {
          result.edges = state.edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
            label: e.label,
          }));
        }

        // Agents with full config
        if (includeAll || include?.includes("agents")) {
          result.agents = Array.from(state.agents.values()).map((a) => ({
            id: a.id,
            nodeId: a.nodeId,
            name: a.name,
            description: a.description,
            modelTier: a.modelTier,
            historyEnabled: a.historyEnabled,
            enabledStructuredOutput: a.enabledStructuredOutput,
            promptMessageCount: a.promptMessages.length,
            schemaFieldCount: a.schemaFields.length,
            schemaFields: a.schemaFields.map((f) => ({ name: f.name, type: f.type })),
          }));
        }

        // If Nodes
        if (includeAll || include?.includes("ifNodes")) {
          result.ifNodes = Array.from(state.ifNodes.values()).map((n) => ({
            id: n.id,
            nodeId: n.nodeId,
            name: n.name,
            logicOperator: n.logicOperator,
            conditionCount: n.conditions.length,
            conditions: n.conditions.map((c) => ({
              dataType: c.dataType,
              value1: c.value1,
              operator: c.operator,
              value2: c.value2,
            })),
          }));
        }

        // Data Store Nodes
        if (includeAll || include?.includes("dataStoreNodes")) {
          result.dataStoreNodes = Array.from(state.dataStoreNodes.values()).map((n) => ({
            id: n.id,
            nodeId: n.nodeId,
            name: n.name,
            fieldCount: n.fields.length,
            fields: n.fields.map((f) => ({
              schemaFieldId: f.schemaFieldId,
              logic: f.logic,
            })),
          }));
        }

        // Summary
        if (includeAll || include?.includes("summary")) {
          result.summary = {
            nodeCount: state.nodes.length,
            edgeCount: state.edges.length,
            agentCount: state.agents.size,
            ifNodeCount: state.ifNodes.size,
            dataStoreNodeCount: state.dataStoreNodes.size,
            dataStoreSchemaFieldCount: context.dataStoreSchema.length,
          };
        }

        return result;
      },
    }),

    query_available_variables: tool({
      description: "IMPORTANT: Call this BEFORE creating agent prompts. Returns all variables available for use in prompts, including system variables (data store) and agent output variables from upstream agents. Use this to know what {{variables}} you can reference.",
      inputSchema: z.object({
        forAgentId: z.string().describe("ID of the agent you're creating prompts for. Used to determine which upstream agents' outputs are available."),
      }),
      execute: async ({ forAgentId }) => {
        // Find the target agent
        const targetAgent = findAgent(forAgentId);
        if (!targetAgent) {
          return { success: false, message: `Agent '${forAgentId}' not found` };
        }

        // 1. System variables (data store fields) - always available
        // IMPORTANT: Variable names must be snake_case (e.g., "Connection Level" -> "connection_level")
        const systemVariables = context.dataStoreSchema.map((f) => ({
          variable: `{{${toSnakeCase(f.name)}}}`,
          name: f.name,
          variableName: toSnakeCase(f.name),
          type: f.type,
          description: f.description || `Data store field: ${f.name}`,
          source: "data_store",
          initialValue: f.initial,
        }));

        // 2. Get execution order to find upstream agents
        const getUpstreamAgents = (): WorkflowAgent[] => {
          const startNode = state.nodes.find((n) => n.type === NodeType.START);
          if (!startNode) return [];

          const visited = new Set<string>();
          const upstreamAgents: WorkflowAgent[] = [];
          const queue = [startNode.id];

          while (queue.length > 0) {
            const nodeId = queue.shift()!;
            if (visited.has(nodeId)) continue;
            visited.add(nodeId);

            // Check if we reached the target agent - stop here
            if (nodeId === targetAgent.nodeId) {
              break;
            }

            // If this is an agent node, add it to upstream agents
            // In simplified model: node ID = agent ID
            const node = state.nodes.find((n) => n.id === nodeId);
            if (node?.type === NodeType.AGENT) {
              const agent = state.agents.get(node.id);
              if (agent && agent.id !== targetAgent.id) {
                upstreamAgents.push(agent);
              }
            }

            // Find outgoing edges and continue traversal
            const outgoing = state.edges.filter((e) => e.source === nodeId);
            for (const edge of outgoing) {
              if (!visited.has(edge.target)) {
                queue.push(edge.target);
              }
            }
          }

          return upstreamAgents;
        };

        const upstreamAgents = getUpstreamAgents();

        // 3. Agent output variables from upstream agents with structured output
        const agentOutputVariables: Array<{
          variable: string;
          name: string;
          type: string;
          description: string;
          source: string;
          agentName: string;
          agentId: string;
        }> = [];

        for (const agent of upstreamAgents) {
          if (agent.enabledStructuredOutput && agent.schemaFields.length > 0) {
            const agentSnakeName = agent.name.toLowerCase().replace(/\s+/g, "_");
            for (const field of agent.schemaFields) {
              agentOutputVariables.push({
                variable: `{{${agentSnakeName}.${field.name}}}`,
                name: field.name,
                type: field.type,
                description: field.description || `Output from ${agent.name}`,
                source: "agent_output",
                agentName: agent.name,
                agentId: agent.id,
              });
            }
          }
        }

        // 4. Built-in system variables from VariableLibrary (always available)
        const builtInVariables = variableList
          .filter((v) => v.group !== VariableGroup.Filters) // Exclude filters
          .map((v) => ({
            variable: `{{${v.variable}}}`,
            name: v.variable,
            type: v.dataType,
            description: v.description,
            source: "system",
            group: v.group,
            template: v.template,
          }));

        return {
          success: true,
          forAgent: {
            id: targetAgent.id,
            name: targetAgent.name,
          },
          systemVariables,
          agentOutputVariables,
          builtInVariables,
          summary: {
            totalVariables: systemVariables.length + agentOutputVariables.length + builtInVariables.length,
            dataStoreFields: systemVariables.length,
            agentOutputs: agentOutputVariables.length,
            builtIn: builtInVariables.length,
            upstreamAgentsWithOutput: upstreamAgents.filter((a) => a.enabledStructuredOutput).map((a) => a.name),
          },
        };
      },
    }),

    query_condition_operators: tool({
      description: "Get available operators for If Node conditions based on data type. Call this before creating If Nodes to know valid operators.",
      inputSchema: z.object({
        dataType: z.enum(["string", "number", "integer", "boolean"]).describe("Data type to get operators for"),
      }),
      execute: async ({ dataType }) => {
        const operators = getOperatorsForDataType(dataType as ConditionDataType);
        const defaultOperator = getDefaultOperatorForDataType(dataType as ConditionDataType);

        // Group operators by category
        const operatorInfo = operators.map((op) => {
          let category = "comparison";
          if (op.includes("exists") || op.includes("empty")) {
            category = "existence";
          } else if (op.includes("contains") || op.includes("starts") || op.includes("ends") || op.includes("regex")) {
            category = "pattern";
          }

          return {
            operator: op,
            category,
            requiresValue2: !op.includes("exists") && !op.includes("empty") && !op.includes("is_true") && !op.includes("is_false"),
          };
        });

        return {
          dataType,
          operators: operatorInfo,
          defaultOperator,
          hint: `For ${dataType} type, use operators like '${defaultOperator}'. Operators ending in '_exists', '_empty', '_is_true', '_is_false' don't need value2.`,
        };
      },
    }),

    // ========================================================================
    // 8. Validation / Compiler Tools
    // ========================================================================

    validate_workflow: tool({
      description: "Run validation check on the workflow. Set run_all=true for comprehensive check, or specify categories for targeted validation.",
      inputSchema: z.object({
        run_all: z.boolean().describe("Set to true to run ALL validation checks (recommended). Set to false and use categories for targeted checks."),
        categories: z.array(z.enum([
          "connectivity",  // Orphan nodes, Start/End edges, DataStore outgoing
          "paths",         // End reachability, PATH_NOT_TO_END
          "agents",        // Prompts, structured output, history usage
          "if_nodes",      // Branches, conditions
          "schema",        // Data store field coverage
          "naming",        // Snake_case naming
          "duplicates",    // Duplicate edges
        ])).optional().describe("Specific categories to validate when run_all=false."),
      }),
      execute: async ({ run_all, categories }) => {
        // Determine which categories to run
        // run_all=true means run ALL checks, otherwise use categories array
        const runAllCategories = run_all || !categories || categories.length === 0;
        const shouldRun = (cat: string) => runAllCategories || categories?.includes(cat as typeof categories[number]);
        const errors: Array<{ code: string; severity: "error" | "warning"; message: string; fix?: string }> = [];

        // Helper to get execution order via BFS from all start nodes
        const getExecutionOrder = (): string[] => {
          const allStartNodes = state.nodes.filter((n) => n.type === NodeType.START);
          if (allStartNodes.length === 0) return [];

          const visited = new Set<string>();
          const order: string[] = [];
          // Initialize queue with all start node IDs
          const queue = allStartNodes.map((n) => n.id);

          while (queue.length > 0) {
            const nodeId = queue.shift()!;
            if (visited.has(nodeId)) continue;
            visited.add(nodeId);
            order.push(nodeId);

            // Find outgoing edges
            const outgoing = state.edges.filter((e) => e.source === nodeId);
            for (const edge of outgoing) {
              if (!visited.has(edge.target)) {
                queue.push(edge.target);
              }
            }
          }

          return order;
        };

        // Common node references (needed by multiple categories)
        // Support multiple start nodes (character, user, scenario variants)
        const startNodes = state.nodes.filter((n) => n.type === NodeType.START);
        const endNode = state.nodes.find((n) => n.type === NodeType.END);

        // =========================
        // CATEGORY: connectivity
        // =========================
        if (shouldRun("connectivity")) {
          // 1. Check for orphan nodes (no connections)
          const connectedNodes = new Set<string>();
          for (const edge of state.edges) {
            connectedNodes.add(edge.source);
            connectedNodes.add(edge.target);
          }
          for (const node of state.nodes) {
            if (!connectedNodes.has(node.id) && node.type !== NodeType.START && node.type !== NodeType.END) {
              errors.push({
                code: "ORPHAN_NODE",
                severity: "error",
                message: `Node '${node.id}' (${node.type}) is not connected to any other node`,
                fix: `Use add_edges to connect this node to the flow`,
              });
            }
          }

          // 3. Check if ALL Start nodes have outgoing edges
          for (const startNode of startNodes) {
            const variant = (startNode.data as { nodeVariant?: string })?.nodeVariant || "character";
            const startEdges = state.edges.filter((e) => e.source === startNode.id);
            if (startEdges.length === 0) {
              errors.push({
                code: "START_NO_OUTGOING",
                severity: "error",
                message: `Start node (${variant}) has no outgoing edges`,
                fix: `Use add_edges to connect Start (${variant}) to its corresponding RP agent (rp_agent_${variant} or rp_response_${variant})`,
              });
            }
          }

          // 4. Check if End has incoming edges
          if (endNode) {
            const endEdges = state.edges.filter((e) => e.target === endNode.id);
            if (endEdges.length === 0) {
              errors.push({
                code: "END_NO_INCOMING",
                severity: "error",
                message: "End node has no incoming edges",
                fix: "Use add_edges to connect the last agent/node to End",
              });
            }
          }

          // 4b. Check DataStore nodes have outgoing edges (serial flow requirement)
          for (const dsNode of state.dataStoreNodes.values()) {
            const outgoingEdges = state.edges.filter((e) => e.source === dsNode.nodeId);
            if (outgoingEdges.length === 0) {
              errors.push({
                code: "DATA_STORE_NO_OUTGOING",
                severity: "error",
                message: `DataStore Node '${dsNode.name}' (${dsNode.nodeId}) has no outgoing edge - flow will dead-end here`,
                fix: `CRITICAL: Use add_edges([{ sourceId: '${dsNode.nodeId}', targetId: <next_node> }]) to connect this DataStore to the next node or End`,
              });
            }
          }

          // 9. Check that agent nodes have incoming edges (are reachable)
          for (const agent of state.agents.values()) {
            const hasIncoming = state.edges.some((e) => e.target === agent.nodeId);
            if (!hasIncoming) {
              errors.push({
                code: "AGENT_NO_INCOMING",
                severity: "error",
                message: `Agent '${agent.name}' has no incoming edge - it will never be executed`,
                fix: `Use add_edges to connect a previous node to agent '${agent.nodeId}'`,
              });
            }
          }
        }

        // =========================
        // CATEGORY: paths
        // =========================
        if (shouldRun("paths")) {
          // 2. Check if any Start node leads to End node (reachability)
          if (startNodes.length > 0 && endNode) {
            const reachable = getExecutionOrder();
            if (!reachable.includes(endNode.id)) {
              errors.push({
                code: "END_NOT_REACHABLE",
                severity: "error",
                message: "End node is not reachable from any Start node",
                fix: "Ensure there's a path from Start nodes to End through edges",
              });
            }
          }

          // 2b. Check if ALL paths eventually lead to End node (no dead-end paths)
          if (startNodes.length > 0 && endNode) {
          // Helper: Check if a node can reach End via DFS
          const canReachEnd = (nodeId: string, visited: Set<string> = new Set()): boolean => {
            if (nodeId === endNode.id) return true;
            if (visited.has(nodeId)) return false;
            visited.add(nodeId);

            const outgoing = state.edges.filter((e) => e.source === nodeId);
            if (outgoing.length === 0) return false;

            // For a node to reach End, at least one outgoing path must reach End
            for (const edge of outgoing) {
              if (canReachEnd(edge.target, new Set(visited))) {
                return true;
              }
            }
            return false;
          };

          // Find nodes that are reachable from Start but don't lead to End
          const reachableFromStart = getExecutionOrder();
          const deadEndNodes: string[] = [];
          const startNodeIds = new Set(startNodes.map((n) => n.id));

          for (const nodeId of reachableFromStart) {
            // Skip Start and End nodes themselves
            if (startNodeIds.has(nodeId) || nodeId === endNode.id) continue;

            // Check if this node has outgoing edges
            const outgoing = state.edges.filter((e) => e.source === nodeId);

            // For each outgoing edge, verify the path leads to End
            for (const edge of outgoing) {
              if (!canReachEnd(edge.target)) {
                // Find readable name for the node
                let nodeName = nodeId;
                const node = state.nodes.find((n) => n.id === nodeId);
                if (node?.type === NodeType.AGENT) {
                  nodeName = state.agents.get(nodeId)?.name || nodeId;
                } else if (node?.type === NodeType.IF) {
                  nodeName = state.ifNodes.get(nodeId)?.name || nodeId;
                } else if (node?.type === NodeType.DATA_STORE) {
                  nodeName = state.dataStoreNodes.get(nodeId)?.name || nodeId;
                }

                const branchInfo = edge.sourceHandle ? ` (${edge.sourceHandle} branch)` : "";
                const targetNode = state.nodes.find((n) => n.id === edge.target);
                let targetName = edge.target;
                if (targetNode?.type === NodeType.AGENT) {
                  targetName = state.agents.get(edge.target)?.name || edge.target;
                } else if (targetNode?.type === NodeType.IF) {
                  targetName = state.ifNodes.get(edge.target)?.name || edge.target;
                } else if (targetNode?.type === NodeType.DATA_STORE) {
                  targetName = state.dataStoreNodes.get(edge.target)?.name || edge.target;
                }

                if (!deadEndNodes.includes(`${nodeId}${branchInfo}`)) {
                  deadEndNodes.push(`${nodeId}${branchInfo}`);
                  errors.push({
                    code: "PATH_NOT_TO_END",
                    severity: "error",
                    message: `Path from '${nodeName}'${branchInfo} → '${targetName}' does not lead to End node`,
                    fix: `Ensure this path eventually connects to the End node. Add edge from the last node in this path to End.`,
                  });
                }
              }
            }
          }
        }
        } // end paths category

        // =========================
        // CATEGORY: agents
        // =========================
        if (shouldRun("agents")) {
        // 5. Check agent configurations
        for (const agent of state.agents.values()) {
          // Check for empty prompts
          if (agent.promptMessages.length === 0) {
            errors.push({
              code: "AGENT_NO_PROMPTS",
              severity: "error",
              message: `Agent '${agent.name}' has no prompt messages`,
              fix: `Use upsert_prompt_messages to add system and user prompts to agent '${agent.id}'`,
            });
          }

          // Check for structured output without fields
          if (agent.enabledStructuredOutput && agent.schemaFields.length === 0) {
            errors.push({
              code: "AGENT_STRUCTURED_NO_FIELDS",
              severity: "warning",
              message: `Agent '${agent.name}' has structured output enabled but no fields defined`,
              fix: `Use upsert_output_fields to define output fields for agent '${agent.id}'`,
            });
          }

          // Check for raw {{history}} usage in prompts (not allowed - too slow)
          for (const msg of agent.promptMessages) {
            if (msg.type === "plain") {
              for (const block of msg.promptBlocks) {
                // Check for raw {{history}} without slicing (e.g., history[-3:])
                if (block.template.includes("{{history}}") || block.template.match(/\{\{\s*history\s*\}\}/)) {
                  errors.push({
                    code: "RAW_HISTORY_NOT_ALLOWED",
                    severity: "error",
                    message: `Agent '${agent.name}' uses raw {{history}} which loads ALL messages (too slow)`,
                    fix: `Use sliced history instead: {% for turn in history[-5:] %}{{turn.char_name}}: {{turn.content}}{% endfor %} (max 10 messages)`,
                  });
                }
                // Check for history loops without slicing: {% for x in history %} (unsliced)
                // Valid: {% for x in history[-5:] %} or {% for x in history[:10] %}
                if (block.template.match(/\{%\s*for\s+\w+\s+in\s+history\s*%\}/)) {
                  errors.push({
                    code: "HISTORY_LOOP_NOT_SLICED",
                    severity: "error",
                    message: `Agent '${agent.name}' loops over history without slicing (too slow)`,
                    fix: `Add slice to limit history: {% for turn in history[-5:] %} (max 10 messages)`,
                  });
                }
              }
            }
          }
        }
        } // end agents category

        // =========================
        // CATEGORY: if_nodes
        // =========================
        if (shouldRun("if_nodes")) {
        // 6. Check If Node branches and conditions
        for (const ifNode of state.ifNodes.values()) {
          const node = state.nodes.find((n) => n.id === ifNode.nodeId);
          if (node) {
            const outEdges = state.edges.filter((e) => e.source === node.id);
            const hasTrue = outEdges.some((e) => e.sourceHandle === "true");
            const hasFalse = outEdges.some((e) => e.sourceHandle === "false");

            if (!hasTrue) {
              errors.push({
                code: "IF_NO_TRUE_BRANCH",
                severity: "error",
                message: `If node '${ifNode.name}' has no 'true' branch`,
                fix: `Use add_edges with ifBranch=true to connect the true branch`,
              });
            }
            if (!hasFalse) {
              errors.push({
                code: "IF_NO_FALSE_BRANCH",
                severity: "error",
                message: `If node '${ifNode.name}' has no 'false' branch`,
                fix: `Use add_edges with ifBranch=false to connect the false branch`,
              });
            }

            // Check if If Node has conditions configured
            if (ifNode.conditions.length === 0) {
              errors.push({
                code: "IF_NO_CONDITIONS",
                severity: "error",
                message: `If node '${ifNode.name}' has no conditions configured`,
                fix: `Use update_if_node to add conditions (e.g., check {{history_count}} > 5 for interval-based execution)`,
              });
            }

            // Check if conditions reference valid data store fields
            for (const condition of ifNode.conditions) {
              // Extract field name from value1 (e.g., "{{health}}" -> "health")
              // Also support legacy "{{data.health}}" pattern for backwards compatibility
              const value1Match = condition.value1?.match(/\{\{(?:data\.)?(\w+)\}\}/);
              if (value1Match) {
                const fieldName = value1Match[1];
                const fieldExists = context.dataStoreSchema.some((f) => f.name === fieldName);
                if (!fieldExists) {
                  errors.push({
                    code: "IF_INVALID_FIELD",
                    severity: "error",
                    message: `If node '${ifNode.name}' references non-existent data store field '${fieldName}'`,
                    fix: `Update the condition to use a valid data store field name`,
                  });
                }
              }
            }
          }
        }
        } // end if_nodes category

        // =========================
        // CATEGORY: schema
        // =========================
        if (shouldRun("schema")) {
        // 7. Check Data Store Schema coverage
        const schemaFieldNames = new Set(context.dataStoreSchema.map((f) => f.name));
        const updatedByDataStoreNodes = new Set<string>();
        const definedByAgentOutputs = new Set<string>();

        // Collect fields updated by data store nodes
        for (const dsNode of state.dataStoreNodes.values()) {
          for (const field of dsNode.fields) {
            const schemaField = context.dataStoreSchema.find((f) => f.id === field.schemaFieldId);
            if (schemaField) {
              updatedByDataStoreNodes.add(schemaField.name);
            }
          }
        }

        // Collect fields defined by agent structured outputs
        for (const agent of state.agents.values()) {
          if (agent.enabledStructuredOutput) {
            for (const field of agent.schemaFields) {
              definedByAgentOutputs.add(field.name);
            }
          }
        }

        // Check for schema fields that are never updated
        for (const fieldName of schemaFieldNames) {
          if (!updatedByDataStoreNodes.has(fieldName)) {
            // Find schemaFieldId for the fix message
            const schemaField = context.dataStoreSchema.find((f) => f.name === fieldName);
            errors.push({
              code: "SCHEMA_FIELD_NOT_UPDATED",
              severity: "error",
              message: `Data store field '${fieldName}' is never updated by any Data Store Node`,
              fix: schemaField
                ? `Use update_data_store_node_fields to add '${fieldName}' (schemaFieldId: '${schemaField.id}') to a Data Store Node`
                : `Add this field to a Data Store Node using update_data_store_node_fields`,
            });
          }
        }
        } // end schema category

        // =========================
        // CATEGORY: duplicates
        // =========================
        if (shouldRun("duplicates")) {
        // 8. Check for duplicate edges (same source, target, and sourceHandle)
        const edgeKeys = new Set<string>();
        for (const edge of state.edges) {
          const key = `${edge.source}|${edge.target}|${edge.sourceHandle || ""}`;
          if (edgeKeys.has(key)) {
            errors.push({
              code: "DUPLICATE_EDGE",
              severity: "error",
              message: `Duplicate edge from '${edge.source}' to '${edge.target}'${edge.sourceHandle ? ` (${edge.sourceHandle} branch)` : ""}`,
              fix: `Use remove_edges to remove the duplicate edge with id '${edge.id}'`,
            });
          }
          edgeKeys.add(key);
        }
        } // end duplicates category

        // =========================
        // CATEGORY: naming
        // =========================
        if (shouldRun("naming")) {
        // 10. Check that agent output fields are used in DataStore mappings
        for (const agent of state.agents.values()) {
          if (agent.enabledStructuredOutput && agent.schemaFields.length > 0) {
            const agentSnakeName = agent.name.toLowerCase().replace(/\s+/g, "_");

            for (const field of agent.schemaFields) {
              const expectedRef = `{{${agentSnakeName}.${field.name}}}`;

              // Check if any DataStore node uses this output
              let isUsed = false;
              for (const dsNode of state.dataStoreNodes.values()) {
                for (const dsField of dsNode.fields) {
                  if (dsField.logic && dsField.logic.includes(`${agentSnakeName}.${field.name}`)) {
                    isUsed = true;
                    break;
                  }
                }
                if (isUsed) break;
              }

              if (!isUsed) {
                errors.push({
                  code: "AGENT_OUTPUT_NOT_USED",
                  severity: "warning",
                  message: `Agent '${agent.name}' output field '${field.name}' is never used in any DataStore node`,
                  fix: `Use update_data_store_node_fields to map '${expectedRef}' to a schema field`,
                });
              }
            }
          }
        }

        // 11. Check variable naming conventions (snake_case)
        for (const agent of state.agents.values()) {
          // Check agent name
          if (agent.name !== toSnakeCase(agent.name)) {
            errors.push({
              code: "AGENT_NAME_NOT_SNAKE_CASE",
              severity: "warning",
              message: `Agent name '${agent.name}' should be snake_case for consistent variable references`,
              fix: `Agent names are auto-converted to snake_case, but consider using '${toSnakeCase(agent.name)}' for clarity`,
            });
          }

          // Check output field names
          for (const field of agent.schemaFields) {
            if (field.name !== toSnakeCase(field.name)) {
              errors.push({
                code: "OUTPUT_FIELD_NOT_SNAKE_CASE",
                severity: "error",
                message: `Agent '${agent.name}' output field '${field.name}' must be snake_case`,
                fix: `Rename the field to '${toSnakeCase(field.name)}' using upsert_output_fields`,
              });
            }
          }
        }
        } // end naming category

        // Build summary
        const errorCount = errors.filter((e) => e.severity === "error").length;
        const warningCount = errors.filter((e) => e.severity === "warning").length;

        return {
          valid: errorCount === 0,
          errorCount,
          warningCount,
          issues: errors,
          summary: errorCount === 0
            ? warningCount > 0
              ? `Workflow is valid with ${warningCount} warning(s)`
              : "Workflow is valid!"
            : `Found ${errorCount} error(s) and ${warningCount} warning(s). Fix errors before workflow can run.`,
        };
      },
    }),

    mock_render_workflow: tool({
      description: "Test all workflow templates (agent prompts, if-node conditions, data store logic) with mock values to catch rendering errors before the workflow runs. This validates Jinja syntax, variable references, and JavaScript expressions using the same rendering pipeline as actual execution.",
      inputSchema: z.object({
        include_successful: z.boolean().optional().describe("Include successful renders in output (default: false, only shows errors)"),
      }),
      execute: async ({ include_successful }) => {
        const results: Array<{
          location: string;
          template: string;
          status: "success" | "error";
          rendered?: string;
          error?: string;
        }> = [];

        // Build comprehensive mock context with sample values for all known variables
        // This mirrors the RenderContext used in session-play-service
        const mockCharacter = {
          id: "mock-char-id",
          name: "TestCharacter",
          description: "A brave adventurer",
          example_dialog: "<START>\n{{user}}: Hi\n{{char}}: Hello!",
          entries: ["Character lore entry 1", "Character lore entry 2"],
          // Extended character fields (used by some templates)
          personality: "Friendly and curious",
          first_mes: "Hello there, traveler!",
          mes_example: "<START>\n{{user}}: Hi\n{{char}}: Hello!",
          creator_notes: "Test character for workflow validation",
          system_prompt: "You are TestCharacter.",
          post_history_instructions: "",
          alternate_greetings: ["Hey!", "Greetings!"],
          tags: ["fantasy", "adventure"],
          creator: "System",
          character_version: "1.0",
          extensions: {},
        };

        const mockUser = {
          id: "mock-user-id",
          name: "TestUser",
          description: "The player character",
          example_dialog: "",
          entries: ["User background entry"],
          persona: "A curious explorer",
        };

        const mockContext: Record<string, any> = {
          // ===== Character Variables (from RenderContext.Character) =====
          char: mockCharacter,
          user: mockUser,

          // ===== Cast Variables (from RenderContext.cast) =====
          cast: {
            all: [mockCharacter, mockUser],
            active: mockCharacter,
            inactive: [],
          },

          // ===== Session Variables (from RenderContext.session) =====
          session: {
            id: "mock-session-id",
            scenario: "A test scenario in a fantasy world",
            char_entries: ["Session-specific character entry"],
            plot_entries: ["Plot point 1", "Plot point 2"],
            entries: ["General session entry"],
            duration: { asSeconds: () => 3600, humanize: () => "1 hour" },
            idle_duration: { asSeconds: () => 60, humanize: () => "1 minute" },
          },

          // ===== History Variables (from RenderContext.history) =====
          history_count: 5,
          // Mock history array for slicing (matches HistoryItem structure)
          history: [
            { char_id: "mock-char-id", char_name: "TestCharacter", content: "Hello, adventurer!", variables: {} },
            { char_id: "mock-user-id", char_name: "TestUser", content: "Hi there! What brings you here?", variables: {} },
            { char_id: "mock-char-id", char_name: "TestCharacter", content: "I'm looking for quests.", variables: {} },
            { char_id: "mock-user-id", char_name: "TestUser", content: "I have just the thing!", variables: {} },
            { char_id: "mock-char-id", char_name: "TestCharacter", content: "Tell me more.", variables: {} },
          ],

          // ===== Toggle Variables (from RenderContext.toggle) =====
          toggle: {
            enabled: new Map([["feature_x", true], ["feature_y", false]]),
            values: new Map([["setting_a", "value_a"], ["setting_b", "value_b"]]),
          },

          // ===== Response Variable (from RenderContext.response) =====
          response: "This is a mock model response for testing.",

          // ===== Data Store Variable (from RenderContext.dataStore) =====
          // This is populated below with actual schema fields
          dataStore: [] as Array<{ id: string; name: string; type: string; value: string }>,

          // ===== Additional Common Variables =====
          now: new Date().toISOString(),
          scenario: "A test scenario in a fantasy world",
          world: {
            name: "TestWorld",
            description: "A fantasy realm",
          },
        };

        // Add data store schema fields with mock values based on type and initial value
        for (const field of context.dataStoreSchema) {
          const varName = toSnakeCase(field.name);
          const initialValue = field.initial;
          let mockValue: string | number | boolean;

          switch (field.type) {
            case "integer":
              mockValue = initialValue !== undefined && initialValue !== ""
                ? parseInt(String(initialValue))
                : 50;
              break;
            case "number":
              mockValue = initialValue !== undefined && initialValue !== ""
                ? parseFloat(String(initialValue))
                : 50.0;
              break;
            case "boolean":
              mockValue = initialValue === "true" || initialValue === true;
              break;
            case "string":
            default:
              mockValue = initialValue !== undefined && initialValue !== ""
                ? String(initialValue)
                : `mock_${varName}`;
              break;
          }

          // Add to flat context (for {{field_name}} syntax)
          mockContext[varName] = mockValue;

          // Also add to dataStore array (for {{dataStore}} iteration)
          mockContext.dataStore.push({
            id: field.id,
            name: field.name,
            type: field.type,
            value: String(mockValue),
          });
        }

        // Helper to execute JavaScript code safely (mirrors session-play-service)
        const executeJavaScriptCode = (code: string, ctx: Record<string, any>): unknown => {
          try {
            const dangerousPatterns = [
              /\beval\b/, /\bFunction\b/, /\bsetTimeout\b/, /\bsetInterval\b/,
              /\bimport\b/, /\brequire\b/, /\bprocess\b/, /\bglobal\b/,
              /\bwindow\b/, /\bdocument\b/,
              /\bconstructor\b/, /\b__proto__\b/, /\bprototype\b/,
              /\bthis\b/, /\bProxy\b/, /\bReflect\b/,
            ];

            // Check for Unicode escapes and bracket notation (bypass attempts)
            if (/\\u[0-9a-fA-F]{4}/.test(code) || /\[['"`]/.test(code)) {
              throw new Error(`Suspicious pattern detected in code: ${code.substring(0, 50)}`);
            }

            if (dangerousPatterns.some((pattern) => pattern.test(code))) {
              throw new Error(`Dangerous pattern detected in code: ${code.substring(0, 50)}`);
            }

            const contextKeys = Object.keys(ctx);
            const contextValues = Object.values(ctx);
            const func = new Function(...contextKeys, `"use strict"; return (${code})`);
            return func(...contextValues);
          } catch (error) {
            throw new Error(`JavaScript execution failed: ${error instanceof Error ? error.message : String(error)}`);
          }
        };

        // Helper to generate mock agent output values
        const generateMockAgentOutput = (agent: WorkflowAgent): Record<string, any> => {
          const agentOutputs: Record<string, any> = {};
          for (const field of agent.schemaFields) {
            switch (field.type) {
              case SchemaFieldType.Integer:
                agentOutputs[field.name] = 10;
                break;
              case SchemaFieldType.Number:
                agentOutputs[field.name] = 10.5;
                break;
              case SchemaFieldType.Boolean:
                agentOutputs[field.name] = true;
                break;
              case SchemaFieldType.String:
              default:
                agentOutputs[field.name] = `mock_${field.name}`;
                break;
            }
          }
          return agentOutputs;
        };

        // Helper to try rendering a Jinja template
        const tryRenderTemplate = (template: string, location: string): boolean => {
          try {
            const rendered = TemplateRenderer.render(template, mockContext);
            results.push({
              location,
              template: template.length > 100 ? template.substring(0, 100) + "..." : template,
              status: "success",
              rendered: rendered.length > 200 ? rendered.substring(0, 200) + "..." : rendered,
            });
            return true;
          } catch (error) {
            results.push({
              location,
              template: template.length > 100 ? template.substring(0, 100) + "..." : template,
              status: "error",
              error: error instanceof Error ? error.message : String(error),
            });
            return false;
          }
        };

        // Helper to try rendering data store logic (Jinja + optional JS execution)
        // Returns the computed value so we can update the mock context
        const tryRenderDataStoreLogic = (logic: string, location: string): unknown => {
          try {
            // Step 1: Render Jinja template
            const renderedValue = TemplateRenderer.render(logic, mockContext);

            // Step 2: Check if JS execution is needed (same heuristic as session-play-service)
            const jsOperatorPattern = /[+\-*/%<>=?:&|!]/;
            const needsJsExecution = jsOperatorPattern.test(renderedValue);

            let finalValue: unknown;
            if (needsJsExecution) {
              // Execute as JavaScript for math/logic expressions
              finalValue = executeJavaScriptCode(renderedValue, mockContext);
            } else {
              // Use rendered value directly
              finalValue = renderedValue;
            }

            results.push({
              location,
              template: logic.length > 100 ? logic.substring(0, 100) + "..." : logic,
              status: "success",
              rendered: `${String(finalValue)}${needsJsExecution ? " (JS executed)" : ""}`,
            });

            return finalValue;
          } catch (error) {
            results.push({
              location,
              template: logic.length > 100 ? logic.substring(0, 100) + "..." : logic,
              status: "error",
              error: error instanceof Error ? error.message : String(error),
            });
            return undefined;
          }
        };

        // ============================================================
        // EXECUTION ORDER SIMULATION
        // Process nodes in the order they would execute in the actual flow
        // This ensures agent outputs are available before data stores use them
        // For If nodes, we traverse BOTH branches to test all paths
        // ============================================================

        // Track which nodes have been processed (for rendering tests)
        const processedNodes = new Set<string>();
        const executionSteps: Array<{ step: number; nodeId: string; nodeType: string; name: string; path?: string }> = [];
        let stepCounter = 0;

        // Process a single node - returns true if node was processed
        const processNode = (nodeId: string, pathLabel: string): boolean => {
          const node = state.nodes.find((n) => n.id === nodeId);
          if (!node) return false;

          // Skip start and end nodes for processing (they have no templates)
          if (node.type === NodeType.START || node.type === NodeType.END) {
            return true;
          }

          // Check if already processed - skip duplicate processing but still traverse
          const alreadyProcessed = processedNodes.has(nodeId);
          if (alreadyProcessed) {
            return true; // Continue traversal but don't re-test
          }
          processedNodes.add(nodeId);

          const currentStep = stepCounter++;

          if (node.type === NodeType.AGENT) {
            const agent = state.agents.get(nodeId);
            if (agent) {
              executionSteps.push({ step: currentStep, nodeId, nodeType: "agent", name: agent.name, path: pathLabel });

              // Test agent prompts with current context
              for (let i = 0; i < agent.promptMessages.length; i++) {
                const msg = agent.promptMessages[i];
                if (msg.type === "plain") {
                  for (let j = 0; j < msg.promptBlocks.length; j++) {
                    const block = msg.promptBlocks[j];
                    if (block.template) {
                      tryRenderTemplate(
                        block.template,
                        `[Step ${currentStep}${pathLabel}] Agent "${agent.name}" → ${msg.role} message → block[${j}]`
                      );
                    }
                  }
                }
              }

              // After agent executes, add its mock output to context for downstream nodes
              if (agent.enabledStructuredOutput && agent.schemaFields.length > 0) {
                const agentSnakeName = toSnakeCase(agent.name);
                mockContext[agentSnakeName] = generateMockAgentOutput(agent);
              }
            }
          } else if (node.type === NodeType.IF) {
            const ifNode = state.ifNodes.get(nodeId);
            if (ifNode) {
              executionSteps.push({ step: currentStep, nodeId, nodeType: "if", name: ifNode.name, path: pathLabel });

              for (let i = 0; i < ifNode.conditions.length; i++) {
                const condition = ifNode.conditions[i];
                if (condition.value1) {
                  tryRenderTemplate(
                    condition.value1,
                    `[Step ${currentStep}${pathLabel}] If "${ifNode.name}" → condition[${i}].value1`
                  );
                }
                if (condition.value2) {
                  tryRenderTemplate(
                    condition.value2,
                    `[Step ${currentStep}${pathLabel}] If "${ifNode.name}" → condition[${i}].value2`
                  );
                }
              }
            }
          } else if (node.type === NodeType.DATA_STORE) {
            const dsNode = state.dataStoreNodes.get(nodeId);
            if (dsNode) {
              executionSteps.push({ step: currentStep, nodeId, nodeType: "dataStore", name: dsNode.name, path: pathLabel });

              for (let i = 0; i < dsNode.fields.length; i++) {
                const field = dsNode.fields[i];
                if (field.logic) {
                  const schemaField = context.dataStoreSchema.find((f) => f.id === field.schemaFieldId);
                  const fieldName = schemaField?.name || field.schemaFieldId;
                  const varName = schemaField ? toSnakeCase(schemaField.name) : undefined;

                  const computedValue = tryRenderDataStoreLogic(
                    field.logic,
                    `[Step ${currentStep}${pathLabel}] DataStore "${dsNode.name}" → field "${fieldName}"`
                  );

                  if (varName && computedValue !== undefined) {
                    mockContext[varName] = computedValue;
                  }
                }
              }
            }
          }

          return true;
        };

        // Traverse all paths from a node, processing each node and following all branches
        const traverseAllPaths = (nodeId: string, pathLabel: string, visited: Set<string>): void => {
          // Prevent infinite loops
          if (visited.has(nodeId)) return;
          visited.add(nodeId);

          const node = state.nodes.find((n) => n.id === nodeId);
          if (!node) return;

          // Process this node
          processNode(nodeId, pathLabel);

          // Find all outgoing edges
          const outgoingEdges = state.edges.filter((e) => e.source === nodeId);

          if (node.type === NodeType.IF) {
            // For If nodes, traverse BOTH true and false branches
            const trueEdge = outgoingEdges.find((e) => e.sourceHandle === "true");
            const falseEdge = outgoingEdges.find((e) => e.sourceHandle === "false");

            // Traverse true branch first
            if (trueEdge) {
              traverseAllPaths(trueEdge.target, `${pathLabel}→true`, new Set(visited));
            }

            // Traverse false branch
            if (falseEdge) {
              traverseAllPaths(falseEdge.target, `${pathLabel}→false`, new Set(visited));
            }
          } else {
            // For other nodes, follow all outgoing edges
            for (const edge of outgoingEdges) {
              traverseAllPaths(edge.target, pathLabel, visited);
            }
          }
        };

        // Start traversal from Start node
        const startNode = state.nodes.find((n) => n.type === NodeType.START);
        if (startNode) {
          traverseAllPaths(startNode.id, "", new Set());
        }

        // Also test schema initial values (these run at flow start before execution)
        for (const field of context.dataStoreSchema) {
          if (field.initial && String(field.initial).includes("{{")) {
            tryRenderDataStoreLogic(
              String(field.initial),
              `[Init] Schema field "${field.name}" → initial value`
            );
          }
        }

        // Build summary
        const errorResults = results.filter((r) => r.status === "error");
        const successResults = results.filter((r) => r.status === "success");

        return {
          success: errorResults.length === 0,
          totalRendered: results.length,
          errorCount: errorResults.length,
          successCount: successResults.length,
          executionOrder: executionSteps.map((s) => `[${s.step}] ${s.nodeType}: ${s.name}`),
          errors: errorResults.map((r) => ({
            location: r.location,
            template: r.template,
            error: r.error,
          })),
          successful: include_successful ? successResults.map((r) => ({
            location: r.location,
            rendered: r.rendered,
          })) : undefined,
          mockContext: {
            dataStoreFields: context.dataStoreSchema.map((f) => ({
              name: toSnakeCase(f.name),
              type: f.type,
              mockValue: mockContext[toSnakeCase(f.name)],
            })),
            agentOutputs: Array.from(state.agents.values())
              .filter((a) => a.enabledStructuredOutput && a.schemaFields.length > 0)
              .map((a) => ({
                agent: toSnakeCase(a.name),
                fields: a.schemaFields.map((f) => f.name),
                mockValues: mockContext[toSnakeCase(a.name)],
              })),
          },
          summary: errorResults.length === 0
            ? `All ${results.length} workflow expression(s) rendered successfully with mock values in ${executionSteps.length} execution steps`
            : `${errorResults.length} of ${results.length} workflow expression(s) failed to render. Fix the errors before the workflow can run.`,
        };
      },
    }),
  };
}