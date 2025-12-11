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

  // List template agents that need configuration with existing prompts
  contextInfo += `\n\n## Template Agents to Configure:`;
  initialState.nodes.forEach((node) => {
    if (node.type === NodeType.AGENT) {
      const agent = initialState.agents.get(node.id);
      if (agent) {
        contextInfo += `\n- **${agent.name}**: \`${node.id}\``;
        contextInfo += `\n  - Existing prompts: ${agent.promptMessages.length} messages`;

        // Show existing message structure
        if (agent.promptMessages.length > 0) {
          contextInfo += `\n  - Current messages:`;
          agent.promptMessages.forEach((msg, idx) => {
            if (msg.type === "plain") {
              const preview = msg.promptBlocks[0]?.template?.substring(0, 60) || "";
              contextInfo += `\n    ${idx + 1}. [${msg.role}] messageId: \`${msg.id}\` - "${preview}${preview.length >= 60 ? "..." : ""}"`;
            } else if (msg.type === "history") {
              contextInfo += `\n    ${idx + 1}. [HISTORY] (auto-included) - Insert new messages BEFORE this using index: ${idx}`;
            }
          });
        }

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
- **DO**: Define structured output fields based on field type
- **DO**: Map its outputs to datastore node fields using appropriate formulas
- **IMPORTANT**: Use conservative delta ranges for numeric fields to avoid aggressive state changes

**Output Field Patterns by Type**:

1. **String/Enum Fields** (e.g., current_location, mood, weather):
   - Agent outputs the ACTUAL VALUE directly (not a delta)
   - Output field: \`current_location\` (string) - agent decides the new location
   - DataStore mapping formula: \`{{data_management_agent.current_location}}\` (direct override)
   - **IMPORTANT**: List possible values in agent's prompt message in plain text
   - Example prompt text assuming {{possible_locations}} was define previously: "Possible locations: {{possible_locations}}. Based on the conversation, determine the current_location."

2. **Integer/Numeric Fields** (e.g., health, stamina, trust):
   - Agent outputs a small DELTA value with +/- range
   - Output field: \`health_delta\` with range -1 to +1 (NOT health with 0-10)
   - DataStore mapping formula: \`{{health}}+{{data_management_agent.health_delta}}\`
   - Positive delta = increase, Negative delta = decrease
   - This ensures gradual, realistic changes instead of dramatic swings

**Conservative Delta Ranges for Numeric Fields**:
- For fields with range 0-10: use delta range -1 to +1 or -2 to +2
- For fields with range 0-100: use delta range -1 to +3 (RECOMMENDED for most fields)
- For fields with range 0-1000: use delta range -3 to +10
- For fields with range 0-10000: use delta range -4 to +30
- Always use conservative increments to maintain immersion and gradual progression

## Variables Available in Prompts
- Data Store: \`{{field_name}}\` - current value of tracked field
- Agent Output: \`{{agent_name.field}}\` - output from another agent
- System: \`{{char.name}}\`, \`{{char.description}}\`, \`{{user.name}}\`, \`{{user.description}}\`, \`{{session.scenario}}\`
- History count: \`{{history_count}}\`
- Recent messages: \`{% for turn in history[-5:] %}{{turn.char_name}}: {{turn.content}}{% endfor %}\`

**NOTE**: History/conversation messages are ALREADY included automatically in the agent prompts.
You do NOT need to add any history-related prompts or instructions - the system handles this.

## Configuration Process

1. **RP Agents** (rp_agent_character, rp_agent_user, rp_agent_scenario):
   - **Minimal updates only** - RP agents work well by default
   - **Only add datastore field references** to existing prompts if they're missing
   - Use \`upsert_prompt_messages\` with \`messageId\` to update existing messages
   - Add variables like "Current mood: {{mood}}", "Health: {{health}}" etc. where appropriate
   - **REQUIRED**: Ensure the LAST user-role message ends with "Make character response in a concise manner."
   - **Do NOT rewrite or significantly modify existing prompts** - just inject datastore variables
   - Keep the existing structure and tone of the prompts
   - DO NOT use \`upsert_output_fields\` on these agents

2. **Data Management Agent** (data_management_agent):
   - **FOCUS ALL UPDATES HERE** - This is the only agent that needs full configuration
   - Follow the field type patterns described above in "Output Field Patterns by Type"
   - Use \`upsert_prompt_messages\` to explain state tracking (include possible values for string fields)
   - Use \`upsert_output_fields\` to define output fields (string or integer_delta based on type)
   - Use \`update_data_store_node_fields\` to map with appropriate formulas

Ensure ALL ${context.dataStoreSchema.length} schema fields are updated via data_management_agent with correct type-based patterns.`;
}

export function buildUserPrompt(fieldCount: number): string {
  return `Configure the workflow for this scenario:

1. **RP Agents** (rp_agent_character, rp_agent_user, rp_agent_scenario):
   - **Minimal updates**: Only add missing datastore field references to existing prompts
   - Inject variables like "Current mood: {{mood}}", "Health: {{health}}" where appropriate
   - **REQUIRED**: Ensure the LAST user-role message ends with "Make character response in a concise manner."
   - Do NOT rewrite prompts - just add datastore variables to existing text
   - Use \`upsert_prompt_messages\` with \`messageId\` to update existing messages

2. **Data Management Agent** (data_management_agent):
- Use \`upsert_prompt_messages\` to describe what state changes to track based on the scenario
- Use \`upsert_output_fields\` to define ${fieldCount} output fields:
  - **String fields**: Output the actual value (agent decides), list possible values in prompt
  - **Integer fields**: Output delta with \`_delta\` suffix, use conservative ranges based on field scale:
    - 0-10 fields: -1 to +1
    - 0-100 fields: -1 to +3
    - 0-1000 fields: -3 to +10
    - 0-10000 fields: -4 to +30
- Use \`update_data_store_node_fields\` with formulas:
  - **String fields**: \`{{data_management_agent.field_name}}\` (direct override)
  - **Integer fields**: \`{{field_name}}+{{data_management_agent.field_name_delta}}\` (delta calculation)

All ${fieldCount} schema fields must be updated via data_management_agent with correct field type patterns.`;
}

// Fixer stage is not needed for simplified workflow builder
export function buildFixerSystemPrompt(_context: WorkflowBuilderContext, _state: WorkflowState): string {
  return "";
}

export function buildFixerUserPrompt(): string {
  return "";
}
