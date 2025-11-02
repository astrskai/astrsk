/**
 * Utility functions for flow graph operations
 */

import { edgeTypes, type CustomEdgeType } from "@/features/flow/edges/index";
import { nodeTypes, type CustomNodeType } from "@/features/flow/nodes/index";
/**
 * Filter existing connections when adding a new connection
 * Implements the logic for automatic connection replacement
 *
 * @param edges - Current edges in the flow
 * @param sourceNode - The source node of the new connection
 * @param targetNode - The target node (kept for backwards compatibility)
 * @param connection - The new connection being added
 * @returns Filtered edges with conflicting connections removed
 */
export function filterExistingConnections(
  edges: CustomEdgeType[],
  sourceNode: CustomNodeType | undefined,
  targetNode: CustomNodeType | undefined, // Kept for backwards compatibility but not used
  connection: {
    source?: string | null;
    target?: string | null;
    sourceHandle?: string | null;
  },
): CustomEdgeType[] {
  let filteredEdges = [...edges];

  // Remove existing outgoing connections based on source node type
  // Output handles can only connect to one node (applies to all node types with source handles)
  if (connection.source && sourceNode) {
    // For all node types, remove existing edges from the same source handle
    // This ensures each output can only connect to one input
    filteredEdges = filteredEdges.filter((edge) => {
      // For If nodes with multiple source handles, check both source and sourceHandle
      if (sourceNode.type === "if" && edge.source === connection.source) {
        // Only remove if it's from the same handle (true/false)
        return edge.sourceHandle !== connection.sourceHandle;
      }
      // For other nodes, remove any edge from the same source
      return edge.source !== connection.source;
    });
  }

  // Input handles can now accept multiple connections - no filtering needed for targets
  // Previously removed: filtering for agent and end node targets

  return filteredEdges;
}

/**
 * Create a hash of flow data for comparison
 * Used to detect changes in the flow structure (ignores position changes)
 *
 * @param nodes - Array of nodes
 * @param edges - Array of edges
 * @returns A hash string representing the flow structure
 */
export function createDataHash(nodes: any[], edges: any[]): string {
  // Create a hash that ignores position changes
  const nodeHash = nodes
    .map((n) => `${n.id}:${n.type}:${JSON.stringify(n.data)}`)
    .sort()
    .join("|");
  const edgeHash = edges
    .map((e) => `${e.id}:${e.source}:${e.target}`)
    .sort()
    .join("|");
  return `${nodeHash}::${edgeHash}`;
}
