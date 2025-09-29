/**
 * Helper to analyze and access flow data structures in mutations
 *
 * IMPORTANT: React Query cache stores persistence format (snake_case, direct properties)
 * while domain objects have camelCase and properties wrapped in 'props'.
 * This helper provides consistent access patterns regardless of the structure.
 */

import type { FlowDataDebugInfo } from "@/app/queries/flow/types/flow-cache-types";

// Control debug logging via environment variable
const DEBUG_ENABLED = process.env.NODE_ENV === "development";

/**
 * Analyzes flow data structure and returns consistent access paths
 *
 * @param context - Description of where this is being called from (for debugging)
 * @param flowData - The flow data from React Query cache
 * @returns Object with nodes, edges, and metadata about the data structure
 */
export function debugFlowData(
  context: string,
  flowData: any,
): FlowDataDebugInfo {
  if (!flowData) {
    if (DEBUG_ENABLED) {
      console.warn(`[${context}] Flow data is null/undefined`);
    }
    return {
      nodes: null,
      edges: null,
      nodesLocation: "NOT_FOUND",
      edgesLocation: "NOT_FOUND",
      hasProps: false,
      hasSnakeCase: false,
    };
  }

  // Check structure type
  const hasProps = !!flowData.props;
  const hasDirectNodes = !!flowData.nodes;
  const hasDirectEdges = !!flowData.edges;

  // Determine nodes location and get reference
  let nodes = null;
  let nodesLocation: FlowDataDebugInfo["nodesLocation"] = "NOT_FOUND";

  if (flowData.props?.nodes) {
    nodes = flowData.props.nodes;
    nodesLocation = "flowData.props.nodes";
  } else if (flowData.nodes) {
    nodes = flowData.nodes;
    nodesLocation = "flowData.nodes";
  }

  // Determine edges location and get reference
  let edges = null;
  let edgesLocation: FlowDataDebugInfo["edgesLocation"] = "NOT_FOUND";

  if (flowData.props?.edges) {
    edges = flowData.props.edges;
    edgesLocation = "flowData.props.edges";
  } else if (flowData.edges) {
    edges = flowData.edges;
    edgesLocation = "flowData.edges";
  }

  // Check for snake_case vs camelCase
  const hasSnakeCase = !!(
    flowData.updated_at ||
    flowData.created_at ||
    flowData.ready_state
  );
  const hasCamelCase = !!(
    flowData.updatedAt ||
    flowData.createdAt ||
    flowData.readyState
  );

  // Log debug information if enabled
  if (DEBUG_ENABLED) {
    console.group(`🔍 ${context}`);
    console.log("📊 Structure:", {
      hasProps,
      hasDirectNodes,
      hasDirectEdges,
      hasSnakeCase,
      hasCamelCase,
    });

    if (nodes) {
      console.log(`📍 Nodes: ${nodesLocation} (${nodes.length} items)`);
    } else {
      console.log("❌ No nodes found");
    }

    if (edges) {
      console.log(`📍 Edges: ${edgesLocation} (${edges.length} items)`);
    } else {
      console.log("❌ No edges found");
    }

    console.groupEnd();
  }

  return {
    nodes,
    edges,
    nodesLocation,
    edgesLocation,
    hasProps,
    hasSnakeCase,
  };
}

/**
 * Helper to get the correct flow structure for color assignment
 * The getNextAvailableColor function expects a Flow domain object
 */
export function getFlowForColor(
  flowData: any,
  debugInfo: FlowDataDebugInfo,
  flowId: string,
) {
  return debugInfo.hasProps ? flowData : { props: flowData, id: flowId };
}
