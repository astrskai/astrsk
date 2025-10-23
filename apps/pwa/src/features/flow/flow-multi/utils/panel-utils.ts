/**
 * Utility functions for managing panels in the flow editor
 */

import { NodeType } from "@/modules/flow/model/node-types";
import { PANEL_TYPES, AGENT_PANEL_TYPES } from "@/features/flow/flow-multi/components/panel-types";

/**
 * Get all panel IDs associated with a node based on its type
 * @param nodeId - The ID of the node (or agentId for agent nodes)
 * @param nodeType - The type of the node
 * @returns Array of panel IDs that belong to this node
 */
export function getNodePanelIds(nodeId: string, nodeType: string): string[] {
  const panelIds: string[] = [];

  switch (nodeType) {
    case NodeType.AGENT:
      // Agent nodes have multiple panels
      AGENT_PANEL_TYPES.forEach(panelType => {
        panelIds.push(`${panelType}-${nodeId}`);
      });
      break;

    case NodeType.DATA_STORE:
      // DataStore nodes have their own panel
      panelIds.push(`${PANEL_TYPES.DATA_STORE}-${nodeId}`);
      break;

    case NodeType.IF:
      // If nodes have their own panel
      panelIds.push(`${PANEL_TYPES.IF_NODE}-${nodeId}`);
      break;

    // Start and End nodes don't have panels tied to their nodeId
    // They use standalone panels
  }

  return panelIds;
}

/**
 * Close all panels associated with a node
 * @param nodeId - The ID of the node (or agentId for agent nodes)
 * @param nodeType - The type of the node
 * @param closePanel - The closePanel function from the panel context
 */
export function closeNodePanels(
  nodeId: string,
  nodeType: string,
  closePanel: (panelId: string) => void
): void {
  const panelIds = getNodePanelIds(nodeId, nodeType);
  panelIds.forEach(panelId => {
    closePanel(panelId);
  });
}

/**
 * Get the display name for a node type
 * @param nodeType - The type of the node
 * @returns A user-friendly display name
 */
export function getNodeDisplayName(nodeType: string): string {
  switch (nodeType) {
    case NodeType.AGENT:
      return "Agent";
    case NodeType.IF:
      return "Condition";
    case NodeType.DATA_STORE:
      return "Data Update";
    case "start":
      return "Start";
    case "end":
      return "End";
    default:
      return "Node";
  }
}
