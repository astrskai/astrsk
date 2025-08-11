// Flow traversal utilities for determining agent order and connectivity
// Implements algorithms to traverse the flow graph and determine agent sequence

import { Flow, Node as FlowNode, Edge as FlowEdge } from "@/modules/flow/domain/flow";

export interface AgentPosition {
  agentId: string;
  position: number; // 0-based position in sequence, -1 if disconnected
  isConnectedToStart: boolean;
  isConnectedToEnd: boolean;
  depth: number; // Distance from start node
}

export interface FlowTraversalResult {
  agentPositions: Map<string, AgentPosition>;
  connectedSequence: string[]; // Ordered array of connected agent IDs
  disconnectedAgents: string[]; // Agent IDs not connected to main flow
  hasValidFlow: boolean; // True if there's a path from start to end
}

/**
 * Traverse the flow graph to determine agent order and connectivity
 * @param flow - The flow to analyze
 * @returns FlowTraversalResult with agent positions and connectivity info
 */
export function traverseFlow(flow: Flow): FlowTraversalResult {
  const nodes = flow.props.nodes;
  const edges = flow.props.edges;
  
  // Debug logging to understand the issue
  
  // Find start and end nodes
  const startNode = nodes.find(n => n.type === 'start');
  const endNode = nodes.find(n => n.type === 'end');
  const agentNodes = nodes.filter(n => n.type === 'agent');
  const ifNodes = nodes.filter(n => n.type === 'if');
  
  if (!startNode) {
    return createEmptyResult(agentNodes);
  }

  // Build adjacency list for efficient traversal
  const adjacencyList = buildAdjacencyList(nodes, edges);
  const reverseAdjacencyList = buildReverseAdjacencyList(nodes, edges);
  
  // Find all agents reachable from start
  const reachableFromStart = findReachableAgents(startNode.id, adjacencyList, agentNodes);
  
  // Find all agents that can reach end (if end node exists)
  const canReachEnd = endNode 
    ? findAgentsThatCanReachEnd(endNode.id, reverseAdjacencyList, agentNodes)
    : new Set<string>();
  
  // Sort ALL reachable agents by their distance from start (not just those that reach end)
  const allReachableAgents = Array.from(reachableFromStart);
  const sortedReachableAgents = sortAgentsByDepth(allReachableAgents, startNode.id, adjacencyList);
  
  
  // Create agent position map
  const agentPositions = new Map<string, AgentPosition>();
  
  // Assign positions to ALL reachable agents (whether they reach end or not)
  sortedReachableAgents.forEach((agentId, index) => {
    const depth = getDepthFromStart(agentId, startNode.id, adjacencyList);
    agentPositions.set(agentId, {
      agentId,
      position: index, // Assign color position to ANY agent reachable from start
      isConnectedToStart: true,
      isConnectedToEnd: endNode ? canReachEnd.has(agentId) : false,
      depth
    });
  });
  
  // Handle disconnected agents
  const allAgentIds = agentNodes.map(n => n.id);
  const disconnectedAgents = allAgentIds.filter(id => !agentPositions.has(id));
  
  disconnectedAgents.forEach(agentId => {
    agentPositions.set(agentId, {
      agentId,
      position: -1,
      isConnectedToStart: false,
      isConnectedToEnd: false,
      depth: -1
    });
  });
  
  // Validate if nodes have proper branching
  const hasValidIfNodes = validateIfNodes(ifNodes, adjacencyList, nodes);
  
  // Validate all paths from start reach end (considering if branches)
  const allPathsReachEnd = endNode ? validateAllPathsReachEnd(startNode.id, endNode.id, adjacencyList, ifNodes) : true;
  
  return {
    agentPositions,
    connectedSequence: sortedReachableAgents, // All agents reachable from start
    disconnectedAgents,
    hasValidFlow: endNode ? 
      sortedReachableAgents.length > 0 && 
      sortedReachableAgents.some(id => canReachEnd.has(id)) && 
      hasValidIfNodes && 
      allPathsReachEnd : 
      sortedReachableAgents.length > 0 && hasValidIfNodes
  };
}

function createEmptyResult(agentNodes: FlowNode[]): FlowTraversalResult {
  const agentPositions = new Map<string, AgentPosition>();
  const disconnectedAgents = agentNodes.map(n => n.id);
  
  disconnectedAgents.forEach(agentId => {
    agentPositions.set(agentId, {
      agentId,
      position: -1,
      isConnectedToStart: false,
      isConnectedToEnd: false,
      depth: -1
    });
  });
  
  return {
    agentPositions,
    connectedSequence: [],
    disconnectedAgents,
    hasValidFlow: false
  };
}

function buildAdjacencyList(nodes: FlowNode[], edges: FlowEdge[]): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  
  // Initialize all nodes
  nodes.forEach(node => {
    adj.set(node.id, []);
  });
  
  // Add edges
  edges.forEach(edge => {
    const neighbors = adj.get(edge.source) || [];
    neighbors.push(edge.target);
    adj.set(edge.source, neighbors);
  });
  
  return adj;
}

function buildReverseAdjacencyList(nodes: FlowNode[], edges: FlowEdge[]): Map<string, string[]> {
  const reverseAdj = new Map<string, string[]>();
  
  // Initialize all nodes
  nodes.forEach(node => {
    reverseAdj.set(node.id, []);
  });
  
  // Add reverse edges
  edges.forEach(edge => {
    const neighbors = reverseAdj.get(edge.target) || [];
    neighbors.push(edge.source);
    reverseAdj.set(edge.target, neighbors);
  });
  
  return reverseAdj;
}

function findReachableAgents(startNodeId: string, adjacencyList: Map<string, string[]>, agentNodes: FlowNode[]): Set<string> {
  const visited = new Set<string>();
  const agentIds = new Set(agentNodes.map(n => n.id));
  const reachableAgents = new Set<string>();
  
  function dfs(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    
    // If this is an agent node, add it to reachable agents
    if (agentIds.has(nodeId)) {
      reachableAgents.add(nodeId);
    }
    
    // Continue DFS to neighbors (including if nodes)
    const neighbors = adjacencyList.get(nodeId) || [];
    neighbors.forEach(neighbor => dfs(neighbor));
  }
  
  dfs(startNodeId);
  return reachableAgents;
}

function findAgentsThatCanReachEnd(endNodeId: string, reverseAdjacencyList: Map<string, string[]>, agentNodes: FlowNode[]): Set<string> {
  const visited = new Set<string>();
  const agentIds = new Set(agentNodes.map(n => n.id));
  const canReachEnd = new Set<string>();
  
  function dfs(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    
    // If this is an agent node, add it to canReachEnd
    if (agentIds.has(nodeId)) {
      canReachEnd.add(nodeId);
    }
    
    // Continue DFS to predecessors (including if nodes)
    const predecessors = reverseAdjacencyList.get(nodeId) || [];
    predecessors.forEach(predecessor => dfs(predecessor));
  }
  
  dfs(endNodeId);
  return canReachEnd;
}

function getDepthFromStart(agentId: string, startNodeId: string, adjacencyList: Map<string, string[]>): number {
  const visited = new Set<string>();
  const queue: { nodeId: string; depth: number }[] = [{ nodeId: startNodeId, depth: 0 }];
  
  while (queue.length > 0) {
    const { nodeId, depth } = queue.shift()!;
    
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    
    if (nodeId === agentId) {
      return depth;
    }
    
    // Continue BFS to all neighbors (including through if nodes)
    const neighbors = adjacencyList.get(nodeId) || [];
    neighbors.forEach(neighbor => {
      if (!visited.has(neighbor)) {
        queue.push({ nodeId: neighbor, depth: depth + 1 });
      }
    });
  }
  
  return -1; // Not reachable
}

function sortAgentsByDepth(agentIds: string[], startNodeId: string, adjacencyList: Map<string, string[]>): string[] {
  const agentsWithDepth = agentIds.map(agentId => ({
    agentId,
    depth: getDepthFromStart(agentId, startNodeId, adjacencyList)
  }));
  
  // Sort by depth, then by agent ID for consistent ordering
  agentsWithDepth.sort((a, b) => {
    if (a.depth !== b.depth) {
      return a.depth - b.depth;
    }
    return a.agentId.localeCompare(b.agentId);
  });
  
  return agentsWithDepth.map(item => item.agentId);
}

/**
 * Validate if nodes have proper branching structure
 * @param ifNodes - Array of if nodes to validate
 * @param adjacencyList - Adjacency list for the flow
 * @param allNodes - All nodes in the flow
 * @returns true if all if nodes are valid, false otherwise
 */
function validateIfNodes(ifNodes: FlowNode[], adjacencyList: Map<string, string[]>, allNodes: FlowNode[]): boolean {
  // If no if nodes, return true
  if (ifNodes.length === 0) {
    return true;
  }
  
  // Check each if node has exactly 2 outgoing edges (true/false branches)
  for (const ifNode of ifNodes) {
    const neighbors = adjacencyList.get(ifNode.id) || [];
    
    // Each if node should have exactly 2 outgoing connections
    if (neighbors.length !== 2) {
      console.warn(`If node ${ifNode.id} has ${neighbors.length} outgoing connections, expected 2`);
      return false;
    }
    
    // Check that target nodes exist
    for (const neighborId of neighbors) {
      const targetNode = allNodes.find(n => n.id === neighborId);
      if (!targetNode) {
        console.warn(`If node ${ifNode.id} connects to non-existent node ${neighborId}`);
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Validate that all possible paths from start reach the end node
 * This ensures that every branch of every if node eventually leads to the end
 * @param startNodeId - ID of the start node
 * @param endNodeId - ID of the end node  
 * @param adjacencyList - Adjacency list for the flow
 * @param ifNodes - Array of if nodes in the flow
 * @returns true if all paths reach end, false otherwise
 */
function validateAllPathsReachEnd(startNodeId: string, endNodeId: string, adjacencyList: Map<string, string[]>, ifNodes: FlowNode[]): boolean {
  function dfsAllPaths(currentNodeId: string, currentPath: string[]): boolean {
    // If we reached the end node, this path is valid
    if (currentNodeId === endNodeId) {
      return true;
    }
    
    // Prevent infinite loops
    if (currentPath.includes(currentNodeId)) {
      console.warn(`Circular reference detected in path: ${currentPath.join(' -> ')} -> ${currentNodeId}`);
      return false;
    }
    
    const neighbors = adjacencyList.get(currentNodeId) || [];
    
    // If no neighbors and not at end, this path is invalid
    if (neighbors.length === 0) {
      return false;
    }
    
    // For all neighbors, at least one path must reach the end
    // If this is an if node, BOTH branches must reach the end
    const isIfNode = ifNodes.some(node => node.id === currentNodeId);
    
    if (isIfNode) {
      // For if nodes, ALL branches must reach the end
      return neighbors.every(neighborId => 
        dfsAllPaths(neighborId, [...currentPath, currentNodeId])
      );
    } else {
      // For regular nodes, at least one path must reach the end
      return neighbors.some(neighborId => 
        dfsAllPaths(neighborId, [...currentPath, currentNodeId])
      );
    }
  }
  
  return dfsAllPaths(startNodeId, []);
}