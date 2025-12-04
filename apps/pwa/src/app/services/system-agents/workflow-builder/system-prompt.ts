/**
 * Workflow Builder System Prompt (Simplified)
 *
 * For pre-connected templates - only configures prompts, outputs, and datastore fields.
 * No node/edge creation or validation needed.
 */

import { NodeType } from "@/entities/flow/model/node-types";
import { toSnakeCase } from "./helpers";
import type { WorkflowBuilderContext, WorkflowState } from "./types";

export function buildSystemPrompt(context: WorkflowBuilderContext, initialState: WorkflowState): string {
  let contextInfo = "";

  if (context.scenario && context.scenario.trim()) {
    contextInfo += `\n\n## Scenario Background:\n${context.scenario}`;
  }

  if (context.dataStoreSchema.length > 0) {
    contextInfo += `\n\n## Data Store Schema (${context.dataStoreSchema.length} fields to update):`;
    context.dataStoreSchema.forEach((field, i) => {
      const varName = toSnakeCase(field.name);
      contextInfo += `\n${i + 1}. **${field.name}** (${field.type})`;
      contextInfo += `\n   - schemaFieldId: \`${field.id}\``;
      contextInfo += `\n   - Variable: \`{{${varName}}}\``;
      if (field.description) {
        contextInfo += `\n   - Description: ${field.description}`;
      }
      contextInfo += `\n   - Initial: ${field.initial}`;
      if (field.type === "integer" && field.min !== undefined && field.max !== undefined) {
        contextInfo += ` [${field.min}-${field.max}]`;
      }
    });
  }

  // List template agents that need configuration
  contextInfo += `\n\n## Template Agents to Configure:`;
  initialState.nodes.forEach((node) => {
    if (node.type === NodeType.AGENT) {
      const agent = initialState.agents.get(node.id);
      if (agent) {
        contextInfo += `\n- **${agent.name}**: \`${node.id}\``;
        contextInfo += `\n  - Prompts: ${agent.promptMessages.length} messages`;
        contextInfo += `\n  - Output fields: ${agent.schemaFields.length} fields`;
      }
    }
  });

  // List datastore nodes that need field mappings
  contextInfo += `\n\n## DataStore Nodes to Configure:`;
  initialState.nodes.forEach((node) => {
    if (node.type === NodeType.DATA_STORE) {
      const dsNode = initialState.dataStoreNodes.get(node.id);
      if (dsNode) {
        contextInfo += `\n- **${dsNode.name}**: \`${node.id}\``;
        contextInfo += `\n  - Current fields: ${dsNode.fields.length}`;
      }
    }
  });

  return `You are a workflow configurator for roleplay sessions.
${contextInfo}

## Your Task
Configure the template agents for this scenario. The flow structure is already complete.

**You have 4 tools:**
1. \`query_available_variables\` - Get list of all available {{variables}} (call with scope="all")
2. \`upsert_prompt_messages\` - Add/update prompts for agents (customize for scenario)
3. \`upsert_output_fields\` - Define agent output schema fields (ONLY for data_management_agent)
4. \`update_data_store_node_fields\` - Map agent outputs to datastore fields

## Agent Types (IMPORTANT)

### RP Agents (rp_agent_character, rp_agent_user, rp_agent_scenario)
- **Purpose**: Generate roleplay responses as text
- **DO**: Update their prompts with scenario context and datastore values
- **DO NOT**: Add structured output fields - they output plain text responses

### Data Management Agent (data_management_agent)
- **Purpose**: Analyze conversation and update game state
- **DO**: Define structured output fields matching the datastore schema
- **DO**: Map its outputs to datastore node fields
- Output fields should match what needs to be tracked (e.g., mood, health, location)

## Variables Available in Prompts
- Data Store: \`{{field_name}}\` - current value of tracked field
- Agent Output: \`{{agent_name.field}}\` - output from another agent
- System: \`{{char.name}}\`, \`{{char.description}}\`, \`{{user.name}}\`, \`{{user.description}}\`, \`{{session.scenario}}\`
- History count: \`{{history_count}}\`
- Recent messages: \`{% for turn in history[-5:] %}{{turn.char_name}}: {{turn.content}}{% endfor %}\`

**NOTE**: History/conversation messages are ALREADY included automatically in the agent prompts.
You do NOT need to add any history-related prompts or instructions - the system handles this.

## Process
1. **RP Agents** (rp_agent_character, rp_agent_user, rp_agent_scenario):
   - Use \`upsert_prompt_messages\` to update prompts with scenario theme
   - Include datastore values in prompts (e.g., "Current mood: {{mood}}")
   - Reference {{char.name}}, {{char.description}}, {{session.scenario}}
   - DO NOT use \`upsert_output_fields\` on these agents

2. **Data Management Agent** (data_management_agent):
   - Use \`upsert_prompt_messages\` to explain what state changes to track
   - Use \`upsert_output_fields\` to define output fields for each datastore field
   - Use \`update_data_store_node_fields\` to map outputs to datastore

Ensure ALL ${context.dataStoreSchema.length} schema fields are updated via data_management_agent.`;
}

export function buildUserPrompt(fieldCount: number): string {
  return `Configure the workflow for this scenario:

1. **RP Agents** (rp_agent_character, rp_agent_user, rp_agent_scenario):
   - Use \`upsert_prompt_messages\` to add scenario-specific prompts
   - Include datastore values like "Current mood: {{mood}}"
   - DO NOT add output fields - they generate plain text

2. **Data Management Agent** (data_management_agent):
   - Use \`upsert_prompt_messages\` to describe what to analyze
   - Use \`upsert_output_fields\` to define ${fieldCount} output fields matching the datastore schema
   - Use \`update_data_store_node_fields\` to map outputs to datastore

All ${fieldCount} schema fields must be updated via data_management_agent's structured output.`;
}

// Fixer stage is not needed for simplified workflow builder
export function buildFixerSystemPrompt(_context: WorkflowBuilderContext, _state: WorkflowState): string {
  return "";
}

export function buildFixerUserPrompt(): string {
  return "";
}
