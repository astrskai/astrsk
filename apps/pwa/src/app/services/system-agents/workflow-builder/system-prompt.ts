/**
 * Workflow Builder System Prompt
 *
 * Builds the system prompt for the AI agent based on context and initial state.
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
    contextInfo += `\n\n## Data Store Schema (${context.dataStoreSchema.length} PRE-DEFINED fields to update):`;
    contextInfo += `\nThese fields already exist. Your job is to create agents that UPDATE them via DataStore nodes.`;
    contextInfo += `\nEach field MUST be updated by at least one DataStore node (created automatically with each agent block).`;
    context.dataStoreSchema.forEach((field, i) => {
      const varName = toSnakeCase(field.name);
      contextInfo += `\n${i + 1}. **${field.name}** (${field.type})`;
      contextInfo += `\n   - schemaFieldId: \`${field.id}\``;
      contextInfo += `\n   - Variable syntax: \`{{${varName}}}\``;
      if (field.description) {
        contextInfo += `\n   - Description: ${field.description}`;
      }
      contextInfo += `\n   - Initial: ${field.initial}`;
      if (field.type === "integer" && field.min !== undefined && field.max !== undefined) {
        contextInfo += ` [${field.min}-${field.max}]`;
      }
    });
  }

  // Add initial flow schema (simplified model: node ID = config ID)
  // Identify template nodes for special handling
  const templateNodes: string[] = [];
  const templateAgentNodes: string[] = [];

  initialState.nodes.forEach((node) => {
    const isFromTemplate = (node.data as { isFromTemplate?: boolean })?.isFromTemplate === true;
    if (isFromTemplate) {
      templateNodes.push(node.id);
      if (node.type === NodeType.AGENT) {
        templateAgentNodes.push(node.id);
      }
    }
  });

  contextInfo += `\n\n## Template Nodes (${templateNodes.length} PRE-EXISTING nodes - CANNOT be deleted):`;
  contextInfo += `\nThese nodes are from a pre-built template. They have preserved positions and CANNOT be deleted.`;
  contextInfo += `\nYou must connect NEW agents to these existing template nodes.`;

  // Identify start nodes by their variant (character, user, scenario)
  const startNodes: { id: string; variant: string }[] = [];
  initialState.nodes.forEach((node) => {
    if (node.type === NodeType.START) {
      const variant = (node.data as { nodeVariant?: string })?.nodeVariant || "character";
      startNodes.push({ id: node.id, variant });
    }
  });

  initialState.nodes.forEach((node) => {
    const isFromTemplate = (node.data as { isFromTemplate?: boolean })?.isFromTemplate === true;
    if (node.type === NodeType.START) {
      const variant = (node.data as { nodeVariant?: string })?.nodeVariant || "character";
      contextInfo += `\n- **Start (${variant})**: \`${node.id}\`${isFromTemplate ? " (template)" : ""}`;
    } else if (node.type === NodeType.END) {
      contextInfo += `\n- **End**: \`${node.id}\`${isFromTemplate ? " (template)" : ""}`;
    } else if (node.type === NodeType.AGENT) {
      const agent = initialState.agents.get(node.id);
      if (agent) {
        contextInfo += `\n- **${agent.name}**: \`${node.id}\`${isFromTemplate ? " (template, configure prompts only)" : ""}`;
      }
    } else if (node.type === NodeType.IF) {
      const ifNode = initialState.ifNodes.get(node.id);
      if (ifNode && isFromTemplate) {
        contextInfo += `\n- **If: ${ifNode.name}**: \`${node.id}\` (template)`;
      }
    } else if (node.type === NodeType.DATA_STORE) {
      const dsNode = initialState.dataStoreNodes.get(node.id);
      if (dsNode && isFromTemplate) {
        contextInfo += `\n- **DataStore: ${dsNode.name}**: \`${node.id}\` (template)`;
      }
    }
  });

  // Show existing edges from template to help AI understand structure
  if (initialState.edges.length > 0) {
    contextInfo += `\n\n## Existing Template Edges (DO NOT MODIFY):`;
    contextInfo += `\nThese edges are pre-configured. DO NOT add duplicate edges between these nodes.`;
    initialState.edges.forEach((edge) => {
      let sourceLabel = edge.source;
      let targetLabel = edge.target;

      // Try to get readable names
      const sourceAgent = initialState.agents.get(edge.source);
      const targetAgent = initialState.agents.get(edge.target);
      const sourceNode = initialState.nodes.find((n) => n.id === edge.source);
      const targetNode = initialState.nodes.find((n) => n.id === edge.target);

      if (sourceAgent) sourceLabel = sourceAgent.name;
      else if (sourceNode?.type === NodeType.START) sourceLabel = "Start";
      else if (sourceNode?.type === NodeType.END) sourceLabel = "End";
      else if (sourceNode?.type === NodeType.IF) {
        const ifNode = initialState.ifNodes.get(edge.source);
        sourceLabel = ifNode?.name || "If";
      } else if (sourceNode?.type === NodeType.DATA_STORE) {
        const dsNode = initialState.dataStoreNodes.get(edge.source);
        sourceLabel = dsNode?.name || "DataStore";
      }

      if (targetAgent) targetLabel = targetAgent.name;
      else if (targetNode?.type === NodeType.START) targetLabel = "Start";
      else if (targetNode?.type === NodeType.END) targetLabel = "End";
      else if (targetNode?.type === NodeType.IF) {
        const ifNode = initialState.ifNodes.get(edge.target);
        targetLabel = ifNode?.name || "If";
      } else if (targetNode?.type === NodeType.DATA_STORE) {
        const dsNode = initialState.dataStoreNodes.get(edge.target);
        targetLabel = dsNode?.name || "DataStore";
      }

      const branchLabel = edge.sourceHandle ? ` (${edge.sourceHandle})` : "";
      contextInfo += `\n- ${sourceLabel}${branchLabel} → ${targetLabel}`;
    });
  }

  // Find nodes that need connections (no incoming or no outgoing edges)
  const nodesWithNoIncoming: string[] = [];
  const nodesWithNoOutgoing: string[] = [];

  initialState.nodes.forEach((node) => {
    if (node.type === NodeType.START || node.type === NodeType.END) return;

    const hasIncoming = initialState.edges.some((e) => e.target === node.id);
    const hasOutgoing = initialState.edges.some((e) => e.source === node.id);

    if (!hasIncoming) nodesWithNoIncoming.push(node.id);
    if (!hasOutgoing) nodesWithNoOutgoing.push(node.id);
  });

  // Find start nodes that need connections (no outgoing edges)
  const startNodesNeedingConnection: { id: string; variant: string }[] = [];
  startNodes.forEach((startNode) => {
    const hasOutgoing = initialState.edges.some((e) => e.source === startNode.id);
    if (!hasOutgoing) {
      startNodesNeedingConnection.push(startNode);
    }
  });

  // Find corresponding RP agents for each start variant
  const rpAgentMapping: { variant: string; agentId: string; agentName: string }[] = [];
  initialState.agents.forEach((agent, nodeId) => {
    const nameLower = agent.name.toLowerCase();
    if (nameLower.includes("rp_response_character") || nameLower.includes("rp_agent_character")) {
      rpAgentMapping.push({ variant: "character", agentId: nodeId, agentName: agent.name });
    } else if (nameLower.includes("rp_response_user") || nameLower.includes("rp_agent_user")) {
      rpAgentMapping.push({ variant: "user", agentId: nodeId, agentName: agent.name });
    } else if (nameLower.includes("rp_response_scenario") || nameLower.includes("rp_agent_scenario")) {
      rpAgentMapping.push({ variant: "scenario", agentId: nodeId, agentName: agent.name });
    }
  });

  // Show start nodes that need to be connected
  if (startNodesNeedingConnection.length > 0) {
    contextInfo += `\n\n## START NODE CONNECTIONS NEEDED:`;
    contextInfo += `\nThese start nodes have NO outgoing edges and MUST be connected:`;
    startNodesNeedingConnection.forEach((startNode) => {
      const matchingAgent = rpAgentMapping.find((m) => m.variant === startNode.variant);
      if (matchingAgent) {
        contextInfo += `\n- **Start (${startNode.variant})** \`${startNode.id}\` → **${matchingAgent.agentName}** \`${matchingAgent.agentId}\``;
      } else {
        contextInfo += `\n- **Start (${startNode.variant})** \`${startNode.id}\` → (needs corresponding RP agent)`;
      }
    });
  }

  // Only show before_end_node as needing outgoing connection (that's where NEW blocks attach)
  if (nodesWithNoOutgoing.length > 0) {
    const beforeEndNode = nodesWithNoOutgoing.find((nodeId) => {
      const dsNode = initialState.dataStoreNodes.get(nodeId);
      return dsNode?.name === "before_end_node";
    });

    if (beforeEndNode) {
      contextInfo += `\n\n## YOUR CONNECTION POINT:`;
      contextInfo += `\n**before_end_node** (\`${beforeEndNode}\`) needs connection to your NEW agent blocks or End node.`;
      contextInfo += `\nThis is where you attach your workflow: before_end_node → [NEW AgentBlocks] → End`;
    }
  }

  return `You are a workflow builder for roleplay sessions.
${contextInfo}

## Architecture (3-Way Start Nodes)
The flow has 3 parallel start triggers for roleplay:
\`\`\`
Start (character) → rp_response_character ─┐
Start (user)      → rp_response_user      ─┼→ before_end_node → [AgentBlock]* → End
Start (scenario)  → rp_response_scenario  ─┘
\`\`\`
- **3 Start Nodes**: Each variant (character, user, scenario) triggers its corresponding RP agent
- **AgentBlock**: \`[If?] → Agent → DataStore\` (created via add_agent_block)
- **TemplateAgents**: Pre-existing RP agents from template (configure prompts only)
- **before_end_node**: Template DataStore for initialization - DO NOT modify its fields

## Placement Rules
- **Start node connections**: Connect each Start node to its matching RP agent (if not already connected)
  - Start (character) → rp_response_character or rp_agent_character
  - Start (user) → rp_response_user or rp_agent_user
  - Start (scenario) → rp_response_scenario or rp_agent_scenario
- **Your job**: Connect before_end_node → NEW agent blocks → End
- Use If Nodes (withIfNode: true) to skip agents when not needed

## Variables (ALL names MUST be snake_case: lowercase letters, numbers, underscores only)
- Data Store: \`{{field_name}}\` (e.g., health_points, alert_level)
- Agent Output: \`{{agent_name.field}}\` (e.g., analyzer.health_change)
- System: \`{{char.name}}\`, \`{{user.name}}\`, \`{{session.scenario}}\`

## History Access (Jinja syntax)
**IMPORTANT:** Never use raw \`{{history}}\` - it loads ALL messages and is too slow!
- **History count (EFFICIENT):** \`{{history_count}}\` - total turns, uses session.turnIds.length directly
- Last message: \`{{(history | last).content}}\`
- Recent messages (ALWAYS slice, max 10):
  \`{% for turn in history[-5:] %}{{turn.char_name}}: {{turn.content}}{% endfor %}\`

## If Node with history_count (Interval-Based Execution)
Use \`{{history_count}}\` for If Node conditions to run agents at intervals:
- **Every 5 messages:** \`{{history_count % 5 == 0}}\` (modulo operator)
- **After 10 messages:** \`{{history_count > 10}}\`
- **First message only:** \`{{history_count == 1}}\`
- **Every 3rd message after 5:** \`{{history_count > 5 and history_count % 3 == 0}}\`
This is more efficient than \`{{history | length}}\` as it doesn't load the history array.

## Process (ALL STEPS REQUIRED - DO NOT STOP EARLY)
**You MUST complete ALL 7 steps. The workflow is NOT done until validate_workflow passes.**

1. **Connect Start Nodes**: If START NODE CONNECTIONS NEEDED section shows disconnected start nodes, connect them:
   - Use \`add_edges\` to connect each Start (variant) → corresponding RP agent
   - Start (character) → rp_response_character or rp_agent_character
   - Start (user) → rp_response_user or rp_agent_user
   - Start (scenario) → rp_response_scenario or rp_agent_scenario
2. **Plan**: Decide which NEW agent blocks to create (max 4) to update ALL ${context.dataStoreSchema.length} schema fields
3. **Template agents**: Use \`upsert_prompt_messages\` to add datastore fields to prompts (e.g., "Health: {{health}}/100")
4. **Create NEW agent blocks**: Use \`add_agent_block\` for each planned agent - place AFTER \`before_end_node\`
5. **Configure each NEW agent**:
   - \`upsert_prompt_messages\` - add system/user prompts
   - \`upsert_output_fields\` - define structured output fields
   - \`update_data_store_node_fields\` - map agent outputs to schema fields
6. **Connect NEW edges ONLY** (template edges already exist!):
   - before_end_node → first NEW agent block (or End if no new blocks)
   - Each NEW agent block's DataStore → next NEW agent block (or End)
   - If false branches → skip to next block or End
   - **DO NOT add duplicate edges between already-connected nodes**
7. **Validate**: Run \`validate_workflow\` and fix ALL errors until it passes

**⚠️ CRITICAL: You are NOT done until step 7 passes with 0 errors!**

**Template Node Rules:**
- Template nodes and edges CANNOT be deleted or modified
- Template agents: only configure prompts with datastore fields for roleplay context
- before_end_node: DO NOT modify its dataStoreFields (may have initialization logic)
- NEW agent blocks go AFTER \`before_end_node\` (they update state for NEXT message)

## Flow Examples
**CORRECT (3-Way):**
\`\`\`
Start (character) → rp_response_character ─┐
Start (user)      → rp_response_user      ─┼→ before_end_node → [If?] → Agent → DS → End
Start (scenario)  → rp_response_scenario  ─┘
\`\`\`
**WRONG:** \`Start → Agent → DS → TemplateAgents → End\` (DataStore before before_end_node)`;
}

export function buildUserPrompt(fieldCount: number): string {
return `Create a complete workflow for this scenario. Follow ALL 7 process steps:
1. Connect Start Nodes to their corresponding RP agents (if START NODE CONNECTIONS NEEDED shows any)
2. Plan NEW agent blocks to update ALL ${fieldCount} schema fields
3. Configure template agent prompts with datastore fields (e.g., "Health: {{health}}/100")
4. Create NEW agent blocks after before_end_node using add_agent_block
5. Configure each NEW agent (prompts → output fields → datastore mappings)
6. Connect ONLY NEW edges: before_end_node → NEW blocks → End
7. Run validate_workflow and fix ALL errors until it passes

**IMPORTANT**: Paths can MERGE (multiple start nodes → before_end_node) but cannot DIVERGE.
Each start node (character/user/scenario) connects to its RP agent, which converges at before_end_node.

DO NOT stop until validate_workflow returns 0 errors.`;
}

// ============================================================================
// Stage 2: Fixer/Reviewer System Prompt (Heavy Model)
// ============================================================================

/**
 * Build a shorter system prompt for the fixer stage.
 * The fixer receives the output from the light model and fixes any issues.
 *
 * IMPORTANT: The fixer first EVALUATES the flow by querying its structure,
 * then validates and fixes issues.
 */
export function buildFixerSystemPrompt(context: WorkflowBuilderContext, state: WorkflowState): string {
  // Build compact schema reference
  let schemaRef = "";
  if (context.dataStoreSchema.length > 0) {
    schemaRef = `\n\n## Schema Fields (${context.dataStoreSchema.length}):`;
    context.dataStoreSchema.forEach((field) => {
      const varName = toSnakeCase(field.name);
      schemaRef += `\n- \`${field.id}\`: {{${varName}}} (${field.type})`;
    });
  }

  // Build compact node list
  let nodeList = `\n\n## Current Nodes:`;
  state.nodes.forEach((node) => {
    const isTemplate = (node.data as { isFromTemplate?: boolean })?.isFromTemplate === true;
    const marker = isTemplate ? " [T]" : "";

    if (node.type === NodeType.START) {
      nodeList += `\n- Start: \`${node.id}\`${marker}`;
    } else if (node.type === NodeType.END) {
      nodeList += `\n- End: \`${node.id}\`${marker}`;
    } else if (node.type === NodeType.AGENT) {
      const agent = state.agents.get(node.id);
      nodeList += `\n- Agent "${agent?.name}": \`${node.id}\`${marker}`;
    } else if (node.type === NodeType.IF) {
      const ifNode = state.ifNodes.get(node.id);
      nodeList += `\n- If "${ifNode?.name}": \`${node.id}\`${marker}`;
    } else if (node.type === NodeType.DATA_STORE) {
      const dsNode = state.dataStoreNodes.get(node.id);
      nodeList += `\n- DataStore "${dsNode?.name}": \`${node.id}\`${marker}`;
    }
  });

  // Build compact edge list
  let edgeList = `\n\n## Current Edges:`;
  state.edges.forEach((edge) => {
    const branch = edge.sourceHandle ? ` (${edge.sourceHandle})` : "";
    edgeList += `\n- \`${edge.source}\`${branch} → \`${edge.target}\``;
  });

  return `You are a workflow fixer and reviewer. The complete flow state is provided above.
${schemaRef}
${nodeList}
${edgeList}

## PROCESS (Optimized)
**You already have the complete flow state above. Start with validation immediately.**

1. **VALIDATE FIRST**: Run \`validate_workflow\` with run_all=true
   - If 0 errors → Run \`mock_render_workflow\` → If 0 errors → DONE!
   - If errors found → proceed to step 2

2. **QUERY ONLY IF NEEDED**: Use \`query_current_state\` only when you need details not shown above:
   - Agent prompt content: include=["agents"]
   - DataStore field mappings: include=["dataStoreNodes"]
   - If node conditions: include=["ifNodes"]

3. **FIX ERRORS**: Use available tools:
   - \`add_edges\` / \`remove_edges\` - fix edge connections
   - \`upsert_prompt_messages\` - fix agent prompts
   - \`upsert_output_fields\` - fix agent output schemas
   - \`update_data_store_node_fields\` - fix datastore field mappings
   - \`update_if_node\` - fix if node conditions

4. **RE-VALIDATE**: Run both \`validate_workflow\` and \`mock_render_workflow\` until 0 errors

## Rules:
- [T] = template node (cannot delete, can configure prompts/outputs)
- before_end_node: DO NOT modify its dataStoreFields
- All schema fields MUST be updated by at least one DataStore node
- DataStore nodes MUST have outgoing edges (serial flow)
- If nodes need both true AND false branches connected
- **ALL paths MUST lead to End node** - every branch must eventually connect to End
- No duplicate edges between same nodes
- All agent nodes must have incoming edges (be reachable)
- Output field names must be snake_case (lowercase, underscores)

**Start with validate_workflow immediately. Skip queries if validation passes.**`;
}

export function buildFixerUserPrompt(): string {
  return `The complete flow state is in the system prompt. Start validation immediately:

1. Run validate_workflow with run_all=true
2. If 0 errors → Run mock_render_workflow → If 0 errors → You're DONE!
3. If errors → Query only what you need to understand the issue, then fix it
4. Repeat validation until 0 errors

DO NOT query first - validate first and query only if needed to fix errors.`;
}