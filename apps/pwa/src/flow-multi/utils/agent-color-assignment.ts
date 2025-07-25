// Agent color assignment utilities
// Assigns permanent colors to agents based on what's already used in the flow

import { Flow } from "@/modules/flow/domain/flow";
import { Agent } from "@/modules/agent/domain/agent";
import { AgentService } from "@/app/services/agent-service";

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
 * Get the next available color for a new agent in the flow
 * @param flow - The current flow
 * @returns The next available hex color
 */
export async function getNextAvailableColor(flow: Flow): Promise<string> {
  // Get all agents of flow
  const agentIds = flow.agentIds;
  const agents: Agent[] = [];
  for (const agentId of agentIds) {
    const agentOrError = await AgentService.getAgent.execute(agentId);
    if (agentOrError.isFailure) {
      throw new Error(agentOrError.getError());
    }
    agents.push(agentOrError.getValue());
  }

  // Get all colors currently used by agents in the flow
  const usedColors = new Set<string>();
  
  agents.forEach(agent => {
    if (agent.props.color) {
      usedColors.add(agent.props.color);
    }
  });
  
  // Find the first available color
  for (const color of AGENT_HEX_COLORS) {
    if (!usedColors.has(color)) {
      return color;
    }
  }
  
  // If all colors are used, find the color used least frequently
  const colorCounts = new Map<string, number>();
  AGENT_HEX_COLORS.forEach(color => colorCounts.set(color, 0));
  
  agents.forEach(agent => {
    const color = agent.props.color;
    if (color && colorCounts.has(color)) {
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
}

/**
 * Check if an agent is on a complete path from start to end node
 * @param agentId - The agent ID to check
 * @param flow - The flow to check in
 * @returns true if connected to both start and end, false otherwise
 */
export function isAgentConnected(agentId: string, flow: Flow): boolean {
  const startNode = flow.props.nodes.find(n => n.type === 'start');
  const endNode = flow.props.nodes.find(n => n.type === 'end');
  if (!startNode || !endNode) return false;
  
  // Build adjacency list
  const adjacency = new Map<string, string[]>();
  flow.props.nodes.forEach(node => adjacency.set(node.id, []));
  flow.props.edges.forEach(edge => {
    const neighbors = adjacency.get(edge.source) || [];
    neighbors.push(edge.target);
    adjacency.set(edge.source, neighbors);
  });
  
  // Check if agent is reachable from start
  const reachableFromStart = new Set<string>();
  const queue = [startNode.id];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (reachableFromStart.has(current)) continue;
    reachableFromStart.add(current);
    
    const neighbors = adjacency.get(current) || [];
    queue.push(...neighbors);
  }
  
  if (!reachableFromStart.has(agentId)) return false;
  
  // Check if end is reachable from agent
  const visited = new Set<string>();
  const queue2 = [agentId];
  
  while (queue2.length > 0) {
    const current = queue2.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    
    if (current === endNode.id) return true;
    
    const neighbors = adjacency.get(current) || [];
    queue2.push(...neighbors);
  }
  
  return false;
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
 * Get the opacity for an agent based on its connection state and flow validity
 * @param agent - The agent
 * @param flow - The flow containing the agent
 * @param isFlowValid - Optional: Whether all connected agents in the flow are valid
 * @returns The opacity value (0.5 for disconnected, 0.7 for connected but invalid flow, 1 for valid flow)
 */
export function getAgentOpacity(agent: Agent, flow: Flow, isFlowValid: boolean = true): number {
  // If agent is not connected to both start and end, return 70% opacity
  if (!isAgentConnected(agent.id.toString(), flow)) {
    return 0.7;
  }
  
  // If agent is connected but the flow has invalid agents, return 70% opacity
  if (!isFlowValid) {
    return 0.7;
  }
  
  // Return full opacity for connected agents in a valid flow
  return 1;
}

export function getAgentState(agent: Agent, flow: Flow): boolean {
  if (!isAgentConnected(agent.id.toString(), flow)){
    return true;
  } 
  return false;
}