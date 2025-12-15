/**
 * Workflow Builder Helpers
 *
 * Utility functions for creating prompt messages, IDs, and string conversions.
 */

import { UniqueEntityID } from "@/shared/domain";
import { ApiType, ModelTier } from "@/entities/agent/domain";
import { NodeType } from "@/entities/flow/model/node-types";
import { AGENT_HEX_COLORS } from "@/features/flow/utils/node-color-assignment";
import type { DefaultModelSelection } from "@/shared/stores/model-store";
import type {
  WorkflowState,
  WorkflowAgent,
  AgentPromptBlock,
  AgentPlainPromptMessage,
  AgentHistoryPromptMessage,
} from "./types";

/**
 * Get a random color from the node color palette
 */
function getRandomNodeColor(): string {
  return AGENT_HEX_COLORS[Math.floor(Math.random() * AGENT_HEX_COLORS.length)];
}

// ============================================================================
// ID Generation
// ============================================================================

export function generateUniqueId(): string {
  return new UniqueEntityID().toString();
}

export function toSnakeCase(name: string): string {
  const sanitized = name
    .replace(/[']/g, "") // Remove apostrophes (e.g., "Ring's" -> "Rings")
    .replace(/[^a-zA-Z0-9\s_-]/g, "") // Remove all other special characters
    .replace(/[\s-]+/g, "_") // Replace spaces and hyphens with underscores
    .replace(/([a-z])([A-Z])/g, "$1_$2") // Handle camelCase -> snake_case
    .replace(/_+/g, "_") // Collapse multiple underscores
    .replace(/^_+|_+$/g, "") // Remove leading/trailing underscores
    .toLowerCase();

  return sanitized || "field";
}

// ============================================================================
// Message Helpers
// ============================================================================

/**
 * Create a prompt block with template content
 */
export function createPromptBlock(template: string, name: string = "Block"): AgentPromptBlock {
  return {
    id: generateUniqueId(),
    name,
    type: "plain",
    template,
    isDeleteUnnecessaryCharacters: false,
  };
}

/**
 * Create a plain prompt message
 */
export function createPlainMessage(
  role: "system" | "user" | "assistant",
  content: string
): AgentPlainPromptMessage {
  return {
    id: generateUniqueId(),
    type: "plain",
    role,
    enabled: true,
    promptBlocks: [createPromptBlock(content, `${role} block`)],
  };
}

/**
 * Create a history prompt message with default settings
 * This includes the last N conversation turns in the agent's context
 */
export function createHistoryMessage(historyCount: number = 10): AgentHistoryPromptMessage {
  return {
    id: generateUniqueId(),
    type: "history",
    enabled: true,
    historyType: "split",
    start: 0,
    end: historyCount,
    countFromEnd: true,
    userPromptBlocks: [
      createPromptBlock("{{turn.char_name}}: {{turn.content}}", "User Turn"),
    ],
    assistantPromptBlocks: [
      createPromptBlock("{{turn.char_name}}: {{turn.content}}", "Assistant Turn"),
    ],
    userMessageRole: "user",
    charMessageRole: "assistant",
    subCharMessageRole: "user",
  };
}

/**
 * Check if agent has a history message
 */
export function hasHistoryMessage(agent: WorkflowAgent): boolean {
  return agent.promptMessages.some((msg) => msg.type === "history");
}

/**
 * Remove history message from agent if exists
 */
export function removeHistoryMessage(agent: WorkflowAgent): void {
  agent.promptMessages = agent.promptMessages.filter((msg) => msg.type !== "history");
}

/**
 * Add history message to agent (at the end, before any assistant prefill)
 */
export function addHistoryMessage(agent: WorkflowAgent, historyCount: number = 10): void {
  removeHistoryMessage(agent);
  agent.promptMessages.push(createHistoryMessage(historyCount));
}

// ============================================================================
// Position Organization
// ============================================================================

// Layout constants based on node size (320px wide x 140px tall)
const NODE_WIDTH = 320;
const NODE_HEIGHT = 140;
const HORIZONTAL_GAP = 80;   // Gap between nodes in a row
const VERTICAL_GAP = 340;    // Gap between rows (doubled for larger agent nodes)
const HORIZONTAL_SPACING = NODE_WIDTH + HORIZONTAL_GAP; // 400px between nodes in a row
const ROW_SPACING = NODE_HEIGHT + VERTICAL_GAP;         // 480px between rows
const START_X = 400;  // Center starting point
const START_Y = 100;

/**
 * Automatically arrange all nodes in a clean vertical layout (top to bottom).
 * Each agent block (If → Agent → DataStore) is on its own row.
 * Mutates the state.nodes positions in place.
 *
 * IMPORTANT: Template nodes (isFromTemplate: true) preserve their original positions.
 * Only newly created nodes are repositioned.
 */
export function organizeNodePositions(state: WorkflowState): void {
  // Find start and end nodes
  const startNode = state.nodes.find((n) => n.type === NodeType.START);
  const endNode = state.nodes.find((n) => n.type === NodeType.END);

  if (!startNode) {
    return; // Nothing to organize without a start node
  }

  // Helper to check if a node is from template (should preserve position)
  const isTemplateNode = (node: { data?: object }): boolean => {
    return (node.data as { isFromTemplate?: boolean })?.isFromTemplate === true;
  };

  // Identify agent blocks: If → Agent → DataStore chains
  const agentBlocks = new Map<string, { ifNodeId?: string; agentId: string; dataStoreId?: string }>();

  for (const [agentId] of state.agents) {
    const block: { ifNodeId?: string; agentId: string; dataStoreId?: string } = {
      agentId,
    };

    // Find if there's an If node pointing to this agent via 'true' handle
    const ifEdge = state.edges.find(
      (e) => e.target === agentId && e.sourceHandle === "true"
    );
    if (ifEdge) {
      const ifNode = state.nodes.find((n) => n.id === ifEdge.source && n.type === NodeType.IF);
      if (ifNode) {
        block.ifNodeId = ifNode.id;
      }
    }

    // Find DataStore connected to this agent
    const dsEdge = state.edges.find((e) => e.source === agentId);
    if (dsEdge) {
      const dsNode = state.nodes.find((n) => n.id === dsEdge.target && n.type === NodeType.DATA_STORE);
      if (dsNode) {
        block.dataStoreId = dsNode.id;
      }
    }

    agentBlocks.set(agentId, block);
  }

  // BFS to determine block execution order
  const visited = new Set<string>();
  const blockOrder: string[] = []; // Agent IDs in execution order
  const queue: string[] = [startNode.id];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;

    if (visited.has(nodeId)) continue;
    visited.add(nodeId);

    const node = state.nodes.find((n) => n.id === nodeId);

    // If this is an agent, record its order
    if (node?.type === NodeType.AGENT && state.agents.has(nodeId)) {
      blockOrder.push(nodeId);
      // Mark block nodes as visited
      const block = agentBlocks.get(nodeId);
      if (block?.ifNodeId) visited.add(block.ifNodeId);
      if (block?.dataStoreId) visited.add(block.dataStoreId);
    }

    // Find outgoing edges and queue targets
    const outgoingEdges = state.edges.filter((e) => e.source === nodeId);
    for (const edge of outgoingEdges) {
      if (!visited.has(edge.target)) {
        queue.push(edge.target);
      }
    }
  }

  // Position nodes - use blockOrder as-is (respects actual execution order from BFS)
  // Template agents run in their original order, new agent blocks are added after before_end_node

  const positionedNodes: string[] = [];
  let currentRow = 0;

  // Row 0: Start node (centered) - skip if template node
  if (!isTemplateNode(startNode)) {
    startNode.position = { x: START_X, y: START_Y + currentRow * ROW_SPACING };
  }
  positionedNodes.push(startNode.id);
  currentRow++;

  // Calculate block width for centering
  const getBlockWidth = (block: { ifNodeId?: string; dataStoreId?: string } | undefined) => {
    let nodeCount = 1; // Agent always exists
    if (block?.ifNodeId) nodeCount++;
    if (block?.dataStoreId) nodeCount++;
    return nodeCount * HORIZONTAL_SPACING - HORIZONTAL_GAP;
  };

  // Position each agent block on its own row (in BFS execution order)
  for (const agentId of blockOrder) {
    const block = agentBlocks.get(agentId);
    const blockWidth = getBlockWidth(block);
    const rowY = START_Y + currentRow * ROW_SPACING;

    // Center the block horizontally around START_X
    let currentX = START_X - blockWidth / 2 + NODE_WIDTH / 2;

    // Position If node (if exists) - skip if template node
    if (block?.ifNodeId) {
      const ifNode = state.nodes.find((n) => n.id === block.ifNodeId);
      if (ifNode) {
        if (!isTemplateNode(ifNode)) {
          ifNode.position = { x: currentX, y: rowY };
        }
        positionedNodes.push(ifNode.id);
        currentX += HORIZONTAL_SPACING;
      }
    }

    // Position Agent node - skip if template node
    const agentNode = state.nodes.find((n) => n.id === agentId);
    if (agentNode) {
      if (!isTemplateNode(agentNode)) {
        agentNode.position = { x: currentX, y: rowY };
      }
      positionedNodes.push(agentNode.id);
      currentX += HORIZONTAL_SPACING;
    }

    // Position DataStore node (if exists) - skip if template node
    if (block?.dataStoreId) {
      const dsNode = state.nodes.find((n) => n.id === block.dataStoreId);
      if (dsNode) {
        if (!isTemplateNode(dsNode)) {
          dsNode.position = { x: currentX, y: rowY };
        }
        positionedNodes.push(dsNode.id);
      }
    }

    currentRow++;
  }

  // Position End node (centered) - skip if template node
  if (endNode) {
    if (!isTemplateNode(endNode)) {
      endNode.position = { x: START_X, y: START_Y + currentRow * ROW_SPACING };
    }
    positionedNodes.push(endNode.id);
    currentRow++;
  }

  // Position any unvisited nodes (orphans) at the bottom - skip template nodes
  let orphanY = START_Y + currentRow * ROW_SPACING;
  for (const node of state.nodes) {
    if (!positionedNodes.includes(node.id)) {
      if (!isTemplateNode(node)) {
        node.position = { x: START_X, y: orphanY };
        orphanY += ROW_SPACING;
      }
    }
  }
}

// ============================================================================
// Workflow State Converters
// ============================================================================

/**
 * Model settings to apply to agents when converting workflow state to flow data
 */
export interface WorkflowModelSettings {
  liteModel: DefaultModelSelection | null;
  strongModel: DefaultModelSelection | null;
}

/**
 * Convert WorkflowState to the flow import format expected by ImportFlowFromJson.
 * Converts Maps to Objects and adds required flow metadata.
 *
 * @param state - The workflow state to convert
 * @param flowName - Name for the generated flow
 * @param modelSettings - Default model settings to apply to agents based on their modelTier
 * @param responseTemplate - Response template from the original template (optional)
 */
export function workflowStateToFlowData(
  state: WorkflowState,
  flowName: string = "Generated Workflow",
  modelSettings?: WorkflowModelSettings,
  responseTemplate: string = "",
): Record<string, unknown> {
  // Convert agents Map to object with random colors
  const agents: Record<string, unknown> = {};
  for (const [nodeId, agent] of state.agents) {
    // Get model settings based on agent's modelTier
    const modelInfo = agent.modelTier === ModelTier.Heavy
      ? modelSettings?.strongModel
      : modelSettings?.liteModel;

    agents[nodeId] = {
      name: agent.name,
      description: agent.description,
      targetApiType: ApiType.Chat,
      modelTier: agent.modelTier,
      // Apply API connection from model settings if available
      apiSource: modelInfo?.apiSource,
      modelId: modelInfo?.modelId,
      modelName: modelInfo?.modelName,
      promptMessages: agent.promptMessages,
      textPrompt: "",
      enabledStructuredOutput: agent.enabledStructuredOutput,
      outputFormat: "text_output",
      outputStreaming: true,
      schemaName: "response",
      schemaDescription: "",
      schemaFields: agent.schemaFields,
      tokenCount: 0,
      color: getRandomNodeColor(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Convert dataStoreNodes Map to object with random colors
  const dataStoreNodes: Record<string, unknown> = {};
  for (const [nodeId, dsNode] of state.dataStoreNodes) {
    dataStoreNodes[nodeId] = {
      name: dsNode.name,
      color: getRandomNodeColor(),
      dataStoreFields: dsNode.fields,
    };
  }

  // Convert ifNodes Map to object with random colors
  const ifNodes: Record<string, unknown> = {};
  for (const [nodeId, ifNode] of state.ifNodes) {
    // Ensure logicOperator is uppercase (domain expects 'AND' | 'OR')
    const normalizedOperator = ifNode.logicOperator.toUpperCase() as "AND" | "OR";
    ifNodes[nodeId] = {
      name: ifNode.name,
      color: getRandomNodeColor(),
      logicOperator: normalizedOperator,
      conditions: ifNode.conditions,
    };
  }

  return {
    name: flowName,
    description: "AI-generated workflow",
    nodes: state.nodes,
    edges: state.edges,
    // dataStoreSchema should be an object with fields array, not a direct array
    dataStoreSchema: {
      fields: state.dataStoreSchema,
    },
    responseTemplate,
    agents,
    dataStoreNodes,
    ifNodes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
