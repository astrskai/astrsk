// Flow traversal utilities with caching for performance optimization
// Implements algorithms to traverse the flow graph and determine sequence for agent, if, and dataStore nodes
// Includes enhanced traversal that queries actual node data from services

import { Flow, Node as FlowNode, Edge as FlowEdge } from "@/modules/flow/domain/flow";
import { AgentService } from "@/app/services/agent-service";
import { DataStoreNodeService } from "@/app/services/data-store-node-service";
import { IfNodeService } from "@/app/services/if-node-service";
import { NodeType } from "@/flow-multi/types/node-types";
import { UniqueEntityID } from "@/shared/domain";

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

// Process node types (excludes start and end nodes)
export type ProcessNodeType = NodeType.AGENT | NodeType.IF | NodeType.DATA_STORE;

// Enhanced interface that includes actual node data
export interface ProcessNodeData {
  nodeId: string;
  type: ProcessNodeType;
  name?: string;
  color?: string;
  data?: any; // The actual domain object (Agent, IfNode, DataStoreNode)
}

// Enhanced traversal result that includes actual node data
export interface EnhancedFlowTraversalResult extends FlowTraversalResult {
  processNodeData: Map<string, ProcessNodeData>; // Actual node data from services
}

/**
 * Basic traverse function (no caching, no enhanced data)
 * Handles agent, if, and dataStore node types
 * @param flow - The flow to analyze
 * @returns FlowTraversalResult with process node positions and connectivity info
 */
function traverseFlowBasic(flow: Flow): FlowTraversalResult {
  const nodes = flow.props?.nodes;
  const edges = flow.props?.edges;
  
  // Handle missing or invalid data
  if (!nodes || !Array.isArray(nodes) || !edges || !Array.isArray(edges)) {
    
    // Return empty traversal result
    return {
      processNodePositions: new Map(),
      connectedSequence: [],
      disconnectedProcessNodes: [],
      hasValidFlow: false,
      // Backward compatibility aliases
      agentPositions: new Map(),
      disconnectedAgents: []
    };
  }
  
  // Find start and end nodes
  const startNode = nodes.find(n => n.type === 'start');
  const endNode = nodes.find(n => n.type === 'end');
  const processNodes = nodes.filter(n => n.type === 'agent' || n.type === 'if' || n.type === 'dataStore');
  const ifNodes = nodes.filter(n => n.type === 'if');

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
  const hasValidIfNodes = validateIfNodes(ifNodes, adjacencyList, nodes);

  // Validate all paths from start reach end (considering if branches)
  const allPathsReachEnd = endNode ? validateAllPathsReachEnd(startNode.id, endNode.id, adjacencyList, ifNodes) : true;

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
    hasValidFlow: endNode ? sortedReachableProcessNodes.length > 0 && 
    sortedReachableProcessNodes.some(id => canReachEnd.has(id)) && 
    hasValidIfNodes && 
    allPathsReachEnd : 
    sortedReachableProcessNodes.length > 0 && hasValidIfNodes,
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

function getDepthFromStart(nodeId: string, startNodeId: string, adjacencyList: Map<string, string[]>): number {
  const visited = new Set<string>();
  const queue: { nodeId: string; depth: number }[] = [{ nodeId: startNodeId, depth: 0 }];
  
  while (queue.length > 0) {
    const { nodeId: currentNodeId, depth } = queue.shift()!;
    
    if (visited.has(currentNodeId)) continue;
    visited.add(currentNodeId);
    
    if (currentNodeId === nodeId) {
      return depth;
    }
    
    const neighbors = adjacencyList.get(currentNodeId) || [];
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

function validateAllPathsReachEnd(startNodeId: string, endNodeId: string, adjacencyList: Map<string, string[]>, ifNodes: FlowNode[]): boolean {
  // Use a more sophisticated approach that handles cycles properly
  // Track visited nodes globally to detect if end is reachable
  const globalVisited = new Set<string>();
  const canReachEndFromNode = new Map<string, boolean>();
  
  // First, do a DFS from end node backwards to find all nodes that can reach end
  const nodesCanReachEnd = new Set<string>();
  const findNodesCanReachEnd = (nodeId: string, visited: Set<string> = new Set()) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    nodesCanReachEnd.add(nodeId);
    
    // Find all nodes that have edges pointing to this node
    for (const [sourceId, targets] of adjacencyList.entries()) {
      if (targets.includes(nodeId)) {
        findNodesCanReachEnd(sourceId, visited);
      }
    }
  };
  findNodesCanReachEnd(endNodeId);
  
  // Now validate that all paths from start can reach end
  function validatePath(currentNodeId: string, pathVisited: Set<string>): boolean {
    // If we reached the end node, this path is valid
    if (currentNodeId === endNodeId) {
      return true;
    }
    
    // If this node can reach end (pre-computed), the path is valid
    if (nodesCanReachEnd.has(currentNodeId)) {
      return true;
    }
    
    // Prevent infinite loops in the current path
    if (pathVisited.has(currentNodeId)) {
      // In a loop - check if any node in the loop can reach end
      // If we're in a loop and no node in the loop can reach end, it's invalid
      return false;
    }
    
    const neighbors = adjacencyList.get(currentNodeId) || [];
    
    // If no neighbors and not at end, this path is invalid
    if (neighbors.length === 0) {
      return false;
    }
    
    // Create new visited set for this path
    const newPathVisited = new Set(pathVisited);
    newPathVisited.add(currentNodeId);
    
    // Check if this is an if node
    const isIfNode = ifNodes.some(node => node.id === currentNodeId);
    
    if (isIfNode) {
      // For if nodes, ALL branches must reach the end
      return neighbors.every(neighborId => 
        validatePath(neighborId, newPathVisited)
      );
    } else {
      // For regular nodes, at least one path must reach the end
      return neighbors.some(neighborId => 
        validatePath(neighborId, newPathVisited)
      );
    }
  }
  
  return validatePath(startNodeId, new Set());
}

interface CacheEntry {
  flowId: string;
  nodesHash: string;
  edgesHash: string;
  result: FlowTraversalResult;
  timestamp: number;
}

interface EnhancedCacheEntry {
  flowId: string;
  nodesHash: string;
  edgesHash: string;
  result: EnhancedFlowTraversalResult;
  timestamp: number;
}

class FlowTraversalCache {
  private cache = new Map<string, CacheEntry>();
  private enhancedCache = new Map<string, EnhancedCacheEntry>();
  private readonly maxAge = 1000; // Cache for 1 second
  
  // Generate a hash from nodes and edges to detect changes
  private generateHash(flow: Flow | { props: { nodes: any[], edges: any[] } }): { nodesHash: string; edgesHash: string } {
    const nodes = flow.props?.nodes;
    const edges = flow.props?.edges;
    
    // Handle cases where nodes or edges might be undefined/null
    if (!nodes || !Array.isArray(nodes)) {
      return { nodesHash: 'invalid-nodes', edgesHash: 'invalid-edges' };
    }
    
    if (!edges || !Array.isArray(edges)) {
      return { nodesHash: 'invalid-nodes', edgesHash: 'invalid-edges' };
    }
    
    // Create a simple hash based on node IDs, types, and edge connections
    const nodesHash = nodes
      .map(n => `${n.id}:${n.type}`)
      .sort()
      .join(',');
    
    const edgesHash = edges
      .map(e => `${e.source}:${e.sourceHandle || ''}->${e.target}:${e.targetHandle || ''}`)
      .sort()
      .join(',');
    
    return { nodesHash, edgesHash };
  }
  
  // Get cached result or compute new one
  getCachedTraversal(flow: Flow | { id: any, props: { nodes: any[], edges: any[] } }): FlowTraversalResult {
    // Handle case where flow.id is undefined
    if (!flow?.id) {
      return traverseFlowBasic(flow as Flow);
    }
    
    const flowId = typeof flow.id === 'string' ? flow.id : flow.id.toString();
    const { nodesHash, edgesHash } = this.generateHash(flow);
    const now = Date.now();
    
    // Check if we have a cached entry
    const cached = this.cache.get(flowId);
    
    if (cached) {
      // Check if cache is still valid (not expired and flow hasn't changed)
      if (
        cached.nodesHash === nodesHash &&
        cached.edgesHash === edgesHash &&
        now - cached.timestamp < this.maxAge
      ) {
        return cached.result;
      }
    }
    
    // Compute new traversal result - use local basic function
    const result = traverseFlowBasic(flow as Flow);
    
    // Only cache if we got valid data (not the empty fallback)
    if (result.processNodePositions.size > 0 || nodesHash !== 'invalid-nodes') {
      this.cache.set(flowId, {
        flowId,
        nodesHash,
        edgesHash,
        result,
        timestamp: now
      });
    }
    
    // Clean up old entries to prevent memory leaks
    this.cleanupOldEntries();
    
    return result;
  }
  
  // Enhanced traversal that queries actual node data from services
  async getEnhancedCachedTraversal(flow: Flow | { id: any, props: { nodes: any[], edges: any[] } }): Promise<EnhancedFlowTraversalResult> {
    // Handle case where flow.id is undefined
    if (!flow?.id) {
      const basicResult = this.getCachedTraversal(flow);
      return {
        ...basicResult,
        processNodeData: new Map()
      };
    }
    
    const flowId = typeof flow.id === 'string' ? flow.id : flow.id.toString();
    const { nodesHash, edgesHash } = this.generateHash(flow);
    const now = Date.now();
    
    // Check if we have a cached enhanced entry
    const cached = this.enhancedCache.get(flowId);
    
    if (cached) {
      // Check if cache is still valid (not expired and flow hasn't changed)
      if (
        cached.nodesHash === nodesHash &&
        cached.edgesHash === edgesHash &&
        now - cached.timestamp < this.maxAge
      ) {
        return cached.result;
      }
    }
    
    // Get basic traversal result first
    const basicResult = this.getCachedTraversal(flow);
    
    // Query actual node data from services
    const processNodeData = new Map<string, ProcessNodeData>();
    
    // Get all process nodes from the flow
    const nodes = flow.props?.nodes || [];
    const processNodes = nodes.filter(n => 
      n.type === NodeType.AGENT || 
      n.type === NodeType.IF || 
      n.type === NodeType.DATA_STORE
    );
    
    // Query agent data
    const agentNodes = processNodes.filter(n => n.type === NodeType.AGENT);
    for (const node of agentNodes) {
      const agentId = node.data?.agentId || node.id;
      try {
        const agentResult = await AgentService.getAgent.execute(new UniqueEntityID(agentId));
        if (agentResult.isSuccess) {
          const agent = agentResult.getValue();
          processNodeData.set(node.id, {
            nodeId: node.id,
            type: NodeType.AGENT,
            name: agent.props.name,
            color: agent.props.color,
            data: agent
          });
        }
      } catch (error) {
        console.warn(`Failed to get agent ${agentId} for enhanced traversal:`, error);
      }
    }
    
    // Query data store node data
    if (flowId) {
      try {
        const dataStoreResult = await DataStoreNodeService.getAllDataStoreNodesByFlow.execute({ flowId });
        if (dataStoreResult.isSuccess) {
          const dataStoreNodes = dataStoreResult.getValue();
          dataStoreNodes.forEach(dataStoreNode => {
            processNodeData.set(dataStoreNode.id.toString(), {
              nodeId: dataStoreNode.id.toString(),
              type: NodeType.DATA_STORE,
              name: dataStoreNode.props.name,
              color: dataStoreNode.props.color,
              data: dataStoreNode
            });
          });
        }
      } catch (error) {
        console.warn(`Failed to get data store nodes for enhanced traversal:`, error);
      }
    }
    
    // Query if node data  
    if (flowId) {
      try {
        const ifNodeResult = await IfNodeService.getAllIfNodesByFlow.execute({ flowId });
        if (ifNodeResult.isSuccess) {
          const ifNodes = ifNodeResult.getValue();
          ifNodes.forEach(ifNode => {
            processNodeData.set(ifNode.id.toString(), {
              nodeId: ifNode.id.toString(),
              type: NodeType.IF,
              name: ifNode.props.name,
              color: ifNode.props.color,
              data: ifNode
            });
          });
        }
      } catch (error) {
        console.warn(`Failed to get if nodes for enhanced traversal:`, error);
      }
    }
    
    // Create enhanced result
    const enhancedResult: EnhancedFlowTraversalResult = {
      ...basicResult,
      processNodeData
    };
    
    // Cache the enhanced result
    this.enhancedCache.set(flowId, {
      flowId,
      nodesHash,
      edgesHash,
      result: enhancedResult,
      timestamp: now
    });
    
    // Clean up old entries
    this.cleanupEnhancedEntries();
    
    return enhancedResult;
  }
  
  // Clear cache for a specific flow
  clearFlow(flowId: string): void {
    this.cache.delete(flowId);
    this.enhancedCache.delete(flowId);
  }
  
  // Clear entire cache
  clearAll(): void {
    this.cache.clear();
    this.enhancedCache.clear();
  }
  
  // Remove entries older than maxAge
  private cleanupOldEntries(): void {
    const now = Date.now();
    const entriesToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.maxAge * 2) {
        entriesToDelete.push(key);
      }
    });
    
    entriesToDelete.forEach(key => this.cache.delete(key));
  }
  
  // Remove enhanced entries older than maxAge
  private cleanupEnhancedEntries(): void {
    const now = Date.now();
    const entriesToDelete: string[] = [];
    
    this.enhancedCache.forEach((entry, key) => {
      if (now - entry.timestamp > this.maxAge * 2) {
        entriesToDelete.push(key);
      }
    });
    
    entriesToDelete.forEach(key => this.enhancedCache.delete(key));
  }
}

// Singleton instance
export const flowTraversalCache = new FlowTraversalCache();

// Cached traversal function (basic, for backward compatibility)
export function traverseFlowCached(flow: Flow | { id: any, props: { nodes: any[], edges: any[] } }): FlowTraversalResult {
  return flowTraversalCache.getCachedTraversal(flow);
}

// Main traversal function - enhanced with actual node data from services
export async function traverseFlow(flow: Flow | { id: any, props: { nodes: any[], edges: any[] } }): Promise<EnhancedFlowTraversalResult> {
  return flowTraversalCache.getEnhancedCachedTraversal(flow);
}

// Enhanced cached traversal function that queries actual node data (alias for backwards compatibility)
export async function traverseFlowEnhanced(flow: Flow | { id: any, props: { nodes: any[], edges: any[] } }): Promise<EnhancedFlowTraversalResult> {
  return flowTraversalCache.getEnhancedCachedTraversal(flow);
}