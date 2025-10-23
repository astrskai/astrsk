// Agent color assignment utilities
// Assigns permanent colors to agents based on what's already used in the flow

import { Flow } from "@/modules/flow/domain/flow";
import { Agent } from "@/modules/agent/domain/agent";
import { AgentService } from "@/app/services/agent-service";
import { DataStoreNodeService } from "@/app/services/data-store-node-service";
import { IfNodeService } from "@/app/services/if-node-service";
import { NodeType } from "@/features/flow/flow-multi/types/node-types";
import { UniqueEntityID } from "@/shared/domain";
import { traverseFlowCached } from "./flow-traversal";

// Define hex colors for agents - active (300) variants
export const AGENT_HEX_COLORS = [
  '#A5B4FC', // indigo-300
  '#FDBA74', // orange-300
  '#BEF264', // lime-300
  '#FCA5A5', // red-300
  '#93C5FD', // blue-300
  '#FCD34D', // amber-300
  '#67E8F9', // cyan-300
  '#F0ABFC', // fuchsia-300
  '#FDE047', // yellow-300
  '#C4B5FD', // violet-300
  '#86EFAC', // green-300
  '#FDA4AF', // rose-300
  '#7DD3FC', // sky-300
  '#F9A8D4', // pink-300
  '#6EE7B7', // emerald-300
  '#D8B4FE', // purple-300
  '#5EEAD4', // teal-300
];

// No longer using inactive color variants - will use opacity instead
// export const AGENT_HEX_COLORS_INACTIVE = [...] // Removed

// Convert hex to rgba with opacity
export function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Get the next available color for a new node in the flow
 * Queries actual node data from services to get accurate color information
 * @param flow - The current flow or flow-like data structure  
 * @returns The next available hex color
 */
export async function getNextAvailableColor(flow: Flow | { agentIds: any[], props: { nodes: any[] } }): Promise<string> {
  try {
    const usedColors = new Set<string>();
    const nodes = flow.props?.nodes || [];
    const flowId = (flow as any)?.props?.id || (flow as any)?.id;
    
    // 1. Get agent colors
    const agentNodes = nodes.filter((n: any) => n.type === NodeType.AGENT);
    for (const node of agentNodes) {
      const agentId = node.data?.agentId || node.id;
      try {
        const agentResult = await AgentService.getAgent.execute(new UniqueEntityID(agentId));
        if (agentResult.isSuccess) {
          const agent = agentResult.getValue();
          if (agent.props.color) {
            usedColors.add(agent.props.color);
          }
        }
      } catch (error) {
        console.warn(`Failed to get agent ${agentId} for color assignment:`, error);
      }
    }
    
    // 2. Get data store node colors
    if (flowId) {
      try {
        const dataStoreResult = await DataStoreNodeService.getAllDataStoreNodesByFlow.execute({ flowId: flowId.toString() });
        if (dataStoreResult.isSuccess) {
          const dataStoreNodes = dataStoreResult.getValue();
          dataStoreNodes.forEach(dataStoreNode => {
            if (dataStoreNode.props.color) {
              usedColors.add(dataStoreNode.props.color);
            }
          });
        }
      } catch (error) {
        console.warn(`Failed to get data store nodes for color assignment:`, error);
      }
    }
    
    // 3. Get if node colors
    if (flowId) {
      try {
        const ifNodeResult = await IfNodeService.getAllIfNodesByFlow.execute({ flowId: flowId.toString() });
        if (ifNodeResult.isSuccess) {
          const ifNodes = ifNodeResult.getValue();
          ifNodes.forEach(ifNode => {
            if (ifNode.props.color) {
              usedColors.add(ifNode.props.color);
            }
          });
        }
      } catch (error) {
        console.warn(`Failed to get if nodes for color assignment:`, error);
      }
    }
    
    // Find the first available color
    for (const color of AGENT_HEX_COLORS) {
      if (!usedColors.has(color)) {
        return color;
      }
    }
    
    // If all colors are used, find the color used least frequently
    const colorCounts = new Map<string, number>();
    AGENT_HEX_COLORS.forEach(color => colorCounts.set(color, 0));
    
    // Count all used colors
    usedColors.forEach(color => {
      if (colorCounts.has(color)) {
        colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
      }
    });
    
    // Find the color with minimum usage
    let minCount = Infinity;
    let selectedColor = AGENT_HEX_COLORS[0];
    
    colorCounts.forEach((count, color) => {
      if (count < minCount) {
        minCount = count;
        selectedColor = color;
      }
    });
    
    return selectedColor;
  } catch (error) {
    console.warn('Failed to get colors from services, falling back to first color:', error);
    return AGENT_HEX_COLORS[0];
  }
}

/**
 * Check if an agent is on a complete path from start to end node
 * Now properly handles connections through if and dataStore nodes
 * @param agentId - The agent ID to check
 * @param flow - The flow to check in
 * @returns true if connected to both start and end, false otherwise
 */
export function isAgentConnected(agentId: string, flow: Flow | { id: any, props: { nodes: any[], edges: any[] } }): boolean {
  // Use the basic cached traversal for synchronous connectivity check
  const traversalResult = traverseFlowCached(flow);
  
  // Get the node position from processNodePositions (which includes all node types)
  // This is the same approach used by if-node and data-store nodes
  const nodePosition = traversalResult.processNodePositions.get(agentId);
  
  // Check if the node is connected from start to end (same as if-node and data-store)
  const isConnected = nodePosition ? nodePosition.isConnectedToStart && nodePosition.isConnectedToEnd : false;
  
  return isConnected;
}

/**
 * Get the color for an agent based on its saved color
 * @param agent - The agent
 * @returns The hex color for the agent (same color for all states)
 */
export function getAgentHexColor(agent: Agent): string {
  const savedColor = agent.props.color || AGENT_HEX_COLORS[0];
  // Always return the saved color - opacity will be handled in the components
  return savedColor;
}

/**
 * Get the opacity for an agent based on its connection state
 * @param agent - The agent
 * @param flow - The flow containing the agent
 * @param isFlowValid - Optional: Whether all connected agents in the flow are valid (unused since validation is disabled)
 * @returns The opacity value (0.7 for disconnected, 1 for connected)
 */
export function getAgentOpacity(agent: Agent, flow: Flow | { id: any, props: { nodes: any[], edges: any[] } }, isFlowValid: boolean = true): number {
  const agentId = agent.id.toString();
  const isConnected = isAgentConnected(agentId, flow);
  
  // Simple opacity calculation: connected = 100%, disconnected = 70%
  // Flow validation is disabled, so we only check connection state
  return isConnected ? 1 : 0.7;
}

export function getAgentState(agent: Agent, flow: Flow | { id: any, props: { nodes: any[], edges: any[] } }): boolean {
  if (!isAgentConnected(agent.id.toString(), flow)){
    return true;
  } 
  return false;
}