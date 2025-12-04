/**
 * Workflow Builder Tools (Simplified)
 *
 * Only 3 tools for configuring pre-connected templates:
 * - upsert_prompt_messages
 * - upsert_output_fields
 * - update_data_store_node_fields
 */

import { tool } from "ai";
import { z } from "zod";

import { SchemaFieldType, type SchemaField } from "@/entities/agent/domain/agent";
import { variableList, VariableGroup } from "@/shared/prompt/domain/variable";

import {
  type WorkflowBuilderContext,
  type WorkflowState,
  type WorkflowAgent,
  type WorkflowDataStoreNode,
} from "./types";
import {
  generateUniqueId,
  toSnakeCase,
  createPlainMessage,
  createPromptBlock,
} from "./helpers";

// Tool descriptions for progress display
export const TOOL_DESCRIPTIONS: Record<string, string> = {
  query_available_variables: "Querying available variables",
  upsert_prompt_messages: "Configuring prompt messages",
  upsert_output_fields: "Configuring output fields",
  update_data_store_node_fields: "Configuring data store fields",
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
    upsert_prompt_messages: tool({
      description: "Add, update, or delete prompt messages for an agent. For each message: if messageId is provided, updates or deletes existing; otherwise creates new.",
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
      description: "Add, update, or delete output fields in the agent's structured output schema. For each field: if exists, updates it; if delete=true, removes it; otherwise creates new.",
      inputSchema: z.object({
        agentId: z.string().describe("ID of the agent"),
        fields: z.array(z.object({
          name: z.string().describe("Field name in snake_case (e.g., 'response', 'health_change')"),
          type: z.enum(["string", "integer", "number", "boolean"]).optional().describe("Field type (required when creating)"),
          description: z.string().optional().describe("Description of what this field contains (required when creating)"),
          required: z.boolean().optional().describe("Whether this field is required (default: true)"),
          minimum: z.number().optional().describe("Minimum value for integer/number fields"),
          maximum: z.number().optional().describe("Maximum value for integer/number fields"),
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
      description: "Configure which data store fields this node updates. Use {{field_name}} for data store values, {{agent_name.field}} for agent outputs.",
      inputSchema: z.object({
        nodeId: z.string().describe("ID of the data store node"),
        fields: z.array(z.object({
          schemaFieldId: z.string().describe("The schema field ID or name"),
          logic: z.string().describe("Expression to compute the value. Examples: '{{agent.response}}', 'Math.max(0, {{health}} - 10)'"),
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

        // Validate and resolve schemaFieldIds
        const validIds = new Set(context.dataStoreSchema.map((f) => f.id));
        const invalidFields: string[] = [];
        const validatedFields: Array<{ schemaFieldId: string; logic: string; fieldName: string }> = [];

        for (const f of fields) {
          if (validIds.has(f.schemaFieldId)) {
            const schemaField = context.dataStoreSchema.find((sf) => sf.id === f.schemaFieldId);
            validatedFields.push({
              schemaFieldId: f.schemaFieldId,
              logic: f.logic,
              fieldName: schemaField?.name || "unknown",
            });
          } else {
            // Try to resolve by field name
            const fieldByName = context.dataStoreSchema.find((sf) => sf.name === f.schemaFieldId);
            if (fieldByName) {
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

        // Merge fields: update existing, add new
        const existingFieldsBySchemaId = new Map(
          dsNode.fields.map((f) => [f.schemaFieldId, f])
        );

        let updatedCount = 0;
        let createdCount = 0;

        for (const f of validatedFields) {
          const existing = existingFieldsBySchemaId.get(f.schemaFieldId);
          if (existing) {
            existing.logic = f.logic;
            updatedCount++;
          } else {
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
          currentFields,
        };
      },
    }),
    query_available_variables: tool({
      description: "Returns all variables available for use in prompts. Call this to know what {{variables}} you can reference.",
      inputSchema: z.object({
        scope: z.enum(["all", "system"]).describe("'all' for all variables, 'system' for built-in system variables only"),
      }),
      execute: async ({ scope }) => {
        // 1. Data store variables (from schema)
        const dataStoreVariables = context.dataStoreSchema.map((f) => ({
          variable: `{{${toSnakeCase(f.name)}}}`,
          name: f.name,
          type: f.type,
          description: f.description || `Data store field: ${f.name}`,
          source: "data_store",
          initialValue: f.initial,
        }));

        // 2. Built-in system variables from VariableLibrary
        const builtInVariables = variableList
          .filter((v) => v.group !== VariableGroup.Filters) // Exclude filters
          .map((v) => ({
            variable: `{{${v.variable}}}`,
            name: v.variable,
            type: v.dataType,
            description: v.description,
            source: "system",
            group: v.group,
          }));

        if (scope === "system") {
          return {
            success: true,
            builtInVariables,
            summary: {
              totalVariables: builtInVariables.length,
            },
          };
        }

        // scope === "all"
        // 3. Agent output variables (all agents with structured output)
        const agentOutputVariables: Array<{
          variable: string;
          name: string;
          type: string;
          description: string;
          source: string;
          agentName: string;
        }> = [];

        for (const agent of state.agents.values()) {
          if (agent.enabledStructuredOutput && agent.schemaFields.length > 0) {
            const agentSnakeName = agent.name.toLowerCase().replace(/\s+/g, "_");
            for (const field of agent.schemaFields) {
              agentOutputVariables.push({
                variable: `{{${agentSnakeName}.${field.name}}}`,
                name: field.name,
                type: field.type as string,
                description: field.description || `Output from ${agent.name}`,
                source: "agent_output",
                agentName: agent.name,
              });
            }
          }
        }

        return {
          success: true,
          dataStoreVariables,
          agentOutputVariables,
          builtInVariables,
          summary: {
            totalVariables: dataStoreVariables.length + agentOutputVariables.length + builtInVariables.length,
            dataStoreFields: dataStoreVariables.length,
            agentOutputs: agentOutputVariables.length,
            builtIn: builtInVariables.length,
          },
        };
      },
    }),
  };
}
