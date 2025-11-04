/**
 * Multi-Path Execution Utilities
 *
 * Provides utility functions for multi-path flow execution.
 * This is part of the trigger system refactor (Phase 3).
 *
 * Key Features:
 * - Detects active paths (Character, User, Plot) via graph traversal
 * - Selects appropriate response template based on END node type
 * - Identifies START and END nodes by type
 *
 * Phase 3 Implementation:
 * - Path identification via graph traversal with cycle detection
 * - Template selection based on END node type
 * - Backward compatibility checking
 *
 * Note: Actual execution logic is in session-play-service.ts
 */

import { logger } from "@/shared/lib/logger";
import { StartNodeType } from "@/entities/flow/model/start-node-types";
import {
  EndNodeType,
  getTemplateFieldForEndType
} from "@/entities/flow/model/end-node-types";

/**
 * Check if a path exists between two nodes using DFS
 */
function hasPathBetweenNodes(
  startNodeId: string,
  endNodeId: string,
  adjacencyList: Map<string, string[]>,
  visited = new Set<string>()
): boolean {
  if (startNodeId === endNodeId) return true;
  if (visited.has(startNodeId)) return false; // Cycle detection

  visited.add(startNodeId);

  const neighbors = adjacencyList.get(startNodeId) || [];
  for (const neighbor of neighbors) {
    if (hasPathBetweenNodes(neighbor, endNodeId, adjacencyList, visited)) {
      return true;
    }
  }

  return false;
}

/**
 * Identify which START → END paths are active (connected) in the flow
 */
export function identifyActivePaths(
  flow: any,
  adjacencyList: Map<string, string[]>
): {
  characterActive: boolean;
  userActive: boolean;
  plotActive: boolean;
} {
  const startNodes = getStartNodeIds();
  const endNodes = getEndNodeIds();

  // Check connectivity for each path
  const characterActive = hasPathBetweenNodes(
    startNodes.character,
    endNodes.character,
    adjacencyList
  );

  const userActive = hasPathBetweenNodes(
    startNodes.user,
    endNodes.user,
    adjacencyList
  );

  const plotActive = hasPathBetweenNodes(
    startNodes.plot,
    endNodes.plot,
    adjacencyList
  );

  return {
    characterActive,
    userActive,
    plotActive
  };
}

/**
 * Get default template for an END node type if custom template is not defined
 */
export function getDefaultTemplate(endType: EndNodeType): string {
  switch (endType) {
    case EndNodeType.CHARACTER:
      return "{{agent.output}}";
    case EndNodeType.USER:
      return "{{agent.output}}";
    case EndNodeType.PLOT:
      return "{{agent.output}}";
  }
}

/**
 * Select the appropriate template based on END node type
 */
export function selectTemplate(flow: any, endType: EndNodeType): string {
  const templateField = getTemplateFieldForEndType(endType);
  const template = flow.props[templateField];

  // Fallback to default if template is not defined
  if (!template || template.trim() === "") {
    logger.warn(
      `[MultiPathExecution] Template field '${templateField}' is empty, using default template`
    );
    return getDefaultTemplate(endType);
  }

  return template;
}

/**
 * Get START node IDs by type
 */
export function getStartNodeIds(): {
  character: string;
  user: string;
  plot: string;
} {
  return {
    character: "start",      // Backward compatibility
    user: "start-user",
    plot: "start-plot"
  };
}

/**
 * Get END node IDs by type
 */
export function getEndNodeIds(): {
  character: string;
  user: string;
  plot: string;
} {
  return {
    character: "end",        // Backward compatibility
    user: "end-user",
    plot: "end-plot"
  };
}

/**
 * Check if a flow uses the new multi-path system
 *
 * A flow uses multi-path if it has User or Plot START/END nodes connected.
 * Character-only flows use the legacy single-path execution.
 */
export function shouldUseMultiPath(
  flow: any,
  adjacencyList: Map<string, string[]>
): boolean {
  const activePaths = identifyActivePaths(flow, adjacencyList);

  // Use multi-path if any non-character path is active
  return activePaths.userActive || activePaths.plotActive;
}
