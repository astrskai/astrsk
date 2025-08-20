import { Result } from "@/shared/core/result";

interface OldFormatNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    agentId?: string;
  };
  deletable?: boolean;
}

interface NewFormatNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {};
  deletable?: boolean;
}

interface Edge {
  id: string;
  source: string;
  target: string;
}

interface FlowData {
  name: string;
  description: string;
  nodes: any[];
  edges: Edge[];
  agents: Record<string, any>;
  responseTemplate: string;
  viewport?: any;
  panelStructure?: any;
  createdAt?: string;
  updatedAt?: string;
  // Enhanced format fields
  dataStoreNodes?: Record<string, any>;
  ifNodes?: Record<string, any>;
  exportedAt?: string;
  exportedBy?: string;
  metadata?: any;
}

/**
 * Checks if a flow is in the old format (nodes have data.agentId)
 */
export function isOldFlowFormat(flowData: any): boolean {
  if (!flowData.nodes || !Array.isArray(flowData.nodes)) {
    return false;
  }
  
  // Check if any node has data.agentId property
  return flowData.nodes.some((node: any) => 
    node.data && 
    node.data.agentId && 
    node.type === 'agent'
  );
}

/**
 * Migrates old flow format to new format
 * Main changes:
 * 1. Agent nodes: node.id becomes the agentId from data.agentId
 * 2. Clear data.agentId property
 * 3. Update edges to use new node IDs
 * 4. Keep special nodes (start, end) unchanged
 */
export function migrateFlowToNewFormat(oldFlowData: FlowData): Result<FlowData> {
  try {
    // Create a mapping of old node IDs to new node IDs
    const nodeIdMap = new Map<string, string>();
    
    // First pass: build the ID mapping
    oldFlowData.nodes.forEach((node: OldFormatNode) => {
      if (node.type === 'agent' && node.data.agentId) {
        // For agent nodes, the new ID is the agent ID
        nodeIdMap.set(node.id, node.data.agentId);
      } else {
        // For other nodes (start, end), keep the same ID
        nodeIdMap.set(node.id, node.id);
      }
    });
    
    // Migrate nodes
    const newNodes: NewFormatNode[] = oldFlowData.nodes.map((node: OldFormatNode) => {
      const newId = nodeIdMap.get(node.id) || node.id;
      
      // Create new node with empty data object
      const newNode: NewFormatNode = {
        id: newId,
        type: node.type,
        position: { ...node.position },
        data: {}, // Always empty object in new format
      };
      
      // Preserve deletable property if it exists
      if (node.deletable !== undefined) {
        newNode.deletable = node.deletable;
      }
      
      return newNode;
    });
    
    // Migrate edges
    const newEdges: Edge[] = oldFlowData.edges.map((edge: Edge) => {
      const newSource = nodeIdMap.get(edge.source) || edge.source;
      const newTarget = nodeIdMap.get(edge.target) || edge.target;
      
      return {
        id: edge.id,
        source: newSource,
        target: newTarget,
      };
    });
    
    // Create the migrated flow data
    const migratedFlow: FlowData = {
      name: oldFlowData.name,
      description: oldFlowData.description,
      nodes: newNodes,
      edges: newEdges,
      agents: oldFlowData.agents, // Keep agents as-is
      responseTemplate: oldFlowData.responseTemplate,
    };
    
    // Preserve optional properties if they exist
    if (oldFlowData.viewport) {
      migratedFlow.viewport = oldFlowData.viewport;
    }
    
    if (oldFlowData.panelStructure) {
      migratedFlow.panelStructure = oldFlowData.panelStructure;
    }
    
    if (oldFlowData.createdAt) {
      migratedFlow.createdAt = oldFlowData.createdAt;
    }
    
    if (oldFlowData.updatedAt) {
      migratedFlow.updatedAt = oldFlowData.updatedAt;
    }

    // Preserve enhanced format fields if they exist
    if (oldFlowData.dataStoreNodes) {
      migratedFlow.dataStoreNodes = oldFlowData.dataStoreNodes;
    }
    
    if (oldFlowData.ifNodes) {
      migratedFlow.ifNodes = oldFlowData.ifNodes;
    }
    
    if (oldFlowData.exportedAt) {
      migratedFlow.exportedAt = oldFlowData.exportedAt;
    }
    
    if (oldFlowData.exportedBy) {
      migratedFlow.exportedBy = oldFlowData.exportedBy;
    }
    
    if (oldFlowData.metadata) {
      migratedFlow.metadata = oldFlowData.metadata;
    }
    
    return Result.ok(migratedFlow);
  } catch (error) {
    return Result.fail(
      `Failed to migrate flow format: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}