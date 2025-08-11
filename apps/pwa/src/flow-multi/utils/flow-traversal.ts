// Flow traversal utilities for determining process node order and connectivity
// Implements algorithms to traverse the flow graph and determine sequence for agent, if, and dataStore nodes

import { Flow, Node as FlowNode, Edge as FlowEdge } from "@/modules/flow/domain/flow";

export interface ProcessNodePosition {
  nodeId: string;
  position: number; // 0-based position in sequence, -1 if disconnected
  isConnectedToStart: boolean;
  isConnectedToEnd: boolean;
  depth: number; // Distance from start node
}

// Backward compatibility alias
export interface AgentPosition extends ProcessNodePosition {
  agentId: string;
}

export interface FlowTraversalResult {
  processNodePositions: Map<string, ProcessNodePosition>;
  connectedSequence: string[]; // Ordered array of connected process node IDs
  disconnectedProcessNodes: string[]; // Process node IDs not connected to main flow
  hasValidFlow: boolean; // True if there's a path from start to end
  // Backward compatibility aliases
  agentPositions: Map<string, AgentPosition>;
  disconnectedAgents: string[];
}

/**
 * Traverse the flow graph to determine process node order and connectivity
 * Handles agent, if, and dataStore node types
 * @param flow - The flow to analyze
 * @returns FlowTraversalResult with process node positions and connectivity info
 */
export function traverseFlow(flow: Flow): FlowTraversalResult {
  const nodes = flow.props.nodes;
  const edges = flow.props.edges;
  
  // Debug logging to understand the issue
  
  // Find start and end nodes
  const startNode = nodes.find(n => n.type === 'start');
  const endNode = nodes.find(n => n.type === 'end');
  const processNodes = nodes.filter(n => n.type === 'agent' || n.type === 'if' || n.type === 'dataStore');
  
  if (!startNode) {
    return createEmptyResult(processNodes);
  }

  // Build adjacency list for efficient traversal
  const adjacencyList = buildAdjacencyList(nodes, edges);
  const reverseAdjacencyList = buildReverseAdjacencyList(nodes, edges);
  
  // Find all process nodes reachable from start
  const reachableFromStart = findReachableProcessNodes(startNode.id, adjacencyList, processNodes);
  
  // Find all process nodes that can reach end (if end node exists)
  const canReachEnd = endNode 
    ? findProcessNodesThatCanReachEnd(endNode.id, reverseAdjacencyList, processNodes)
    : new Set<string>();
  
  // Sort ALL reachable process nodes by their distance from start (not just those that reach end)
  const allReachableProcessNodes = Array.from(reachableFromStart);
  const sortedReachableProcessNodes = sortProcessNodesByDepth(allReachableProcessNodes, startNode.id, adjacencyList);
  
  
  // Create process node position map
  const processNodePositions = new Map<string, ProcessNodePosition>();
  
  // Assign positions to ALL reachable process nodes (whether they reach end or not)
  sortedReachableProcessNodes.forEach((nodeId, index) => {
    const depth = getDepthFromStart(nodeId, startNode.id, adjacencyList);
    processNodePositions.set(nodeId, {
      nodeId,
      position: index, // Assign color position to ANY process node reachable from start
      isConnectedToStart: true,
      isConnectedToEnd: endNode ? canReachEnd.has(nodeId) : false,
      depth
    });
  });
  
  // Handle disconnected process nodes
  const allProcessNodeIds = processNodes.map(n => n.id);
  const disconnectedProcessNodes = allProcessNodeIds.filter(id => !processNodePositions.has(id));
  
  disconnectedProcessNodes.forEach(nodeId => {
    processNodePositions.set(nodeId, {
      nodeId,
      position: -1,
      isConnectedToStart: false,
      isConnectedToEnd: false,
      depth: -1
    });
  });
  
  // Create backward compatibility agentPositions map
  const agentPositions = new Map<string, AgentPosition>();
  processNodePositions.forEach((position, nodeId) => {
    agentPositions.set(nodeId, {
      ...position,
      agentId: nodeId // Add the agentId property for backward compatibility
    });
  });
  
  return {
    processNodePositions,
    connectedSequence: sortedReachableProcessNodes, // All process nodes reachable from start
    disconnectedProcessNodes,
    hasValidFlow: endNode ? sortedReachableProcessNodes.length > 0 && sortedReachableProcessNodes.some(id => canReachEnd.has(id)) : sortedReachableProcessNodes.length > 0,
    // Backward compatibility aliases
    agentPositions,
    disconnectedAgents: disconnectedProcessNodes
  };
}

function createEmptyResult(processNodes: FlowNode[]): FlowTraversalResult {
  const processNodePositions = new Map<string, ProcessNodePosition>();
  const disconnectedProcessNodes = processNodes.map(n => n.id);
  
  disconnectedProcessNodes.forEach(nodeId => {
    processNodePositions.set(nodeId, {
      nodeId,
      position: -1,
      isConnectedToStart: false,
      isConnectedToEnd: false,
      depth: -1
    });
  });
  
  // Create backward compatibility agentPositions map
  const agentPositions = new Map<string, AgentPosition>();
  processNodePositions.forEach((position, nodeId) => {
    agentPositions.set(nodeId, {
      ...position,
      agentId: nodeId // Add the agentId property for backward compatibility
    });
  });
  
  return {
    processNodePositions,
    connectedSequence: [],
    disconnectedProcessNodes,
    hasValidFlow: false,
    // Backward compatibility aliases
    agentPositions,
    disconnectedAgents: disconnectedProcessNodes
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

function findReachableProcessNodes(startNodeId: string, adjacencyList: Map<string, string[]>, processNodes: FlowNode[]): Set<string> {
  const visited = new Set<string>();
  const processNodeIds = new Set(processNodes.map(n => n.id));
  const reachableProcessNodes = new Set<string>();
  
  function dfs(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    
    // If this is a process node (agent, if, or dataStore), add it to reachable nodes
    if (processNodeIds.has(nodeId)) {
      reachableProcessNodes.add(nodeId);
    }
    
    // Continue DFS to neighbors
    const neighbors = adjacencyList.get(nodeId) || [];
    neighbors.forEach(neighbor => dfs(neighbor));
  }
  
  dfs(startNodeId);
  return reachableProcessNodes;
}

// Backward compatibility alias
function findReachableAgents(startNodeId: string, adjacencyList: Map<string, string[]>, agentNodes: FlowNode[]): Set<string> {
  return findReachableProcessNodes(startNodeId, adjacencyList, agentNodes);
}

function findProcessNodesThatCanReachEnd(endNodeId: string, reverseAdjacencyList: Map<string, string[]>, processNodes: FlowNode[]): Set<string> {
  const visited = new Set<string>();
  const processNodeIds = new Set(processNodes.map(n => n.id));
  const canReachEnd = new Set<string>();
  
  function dfs(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    
    // If this is a process node (agent, if, or dataStore), add it to canReachEnd
    if (processNodeIds.has(nodeId)) {
      canReachEnd.add(nodeId);
    }
    
    // Continue DFS to predecessors
    const predecessors = reverseAdjacencyList.get(nodeId) || [];
    predecessors.forEach(predecessor => dfs(predecessor));
  }
  
  dfs(endNodeId);
  return canReachEnd;
}

// Backward compatibility alias
function findAgentsThatCanReachEnd(endNodeId: string, reverseAdjacencyList: Map<string, string[]>, agentNodes: FlowNode[]): Set<string> {
  return findProcessNodesThatCanReachEnd(endNodeId, reverseAdjacencyList, agentNodes);
}

function getDepthFromStart(targetNodeId: string, startNodeId: string, adjacencyList: Map<string, string[]>): number {
  const visited = new Set<string>();
  const queue: { nodeId: string; depth: number }[] = [{ nodeId: startNodeId, depth: 0 }];
  
  while (queue.length > 0) {
    const { nodeId, depth } = queue.shift()!;
    
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    
    if (nodeId === targetNodeId) {
      return depth;
    }
    
    const neighbors = adjacencyList.get(nodeId) || [];
    neighbors.forEach(neighbor => {
      if (!visited.has(neighbor)) {
        queue.push({ nodeId: neighbor, depth: depth + 1 });
      }
    });
  }
  
  return -1; // Not reachable
}

function sortProcessNodesByDepth(nodeIds: string[], startNodeId: string, adjacencyList: Map<string, string[]>): string[] {
  const nodesWithDepth = nodeIds.map(nodeId => ({
    nodeId,
    depth: getDepthFromStart(nodeId, startNodeId, adjacencyList)
  }));
  
  // Sort by depth, then by node ID for consistent ordering
  nodesWithDepth.sort((a, b) => {
    if (a.depth !== b.depth) {
      return a.depth - b.depth;
    }
    return a.nodeId.localeCompare(b.nodeId);
  });
  
  return nodesWithDepth.map(item => item.nodeId);
}

// Backward compatibility alias
function sortAgentsByDepth(agentIds: string[], startNodeId: string, adjacencyList: Map<string, string[]>): string[] {
  return sortProcessNodesByDepth(agentIds, startNodeId, adjacencyList);
}