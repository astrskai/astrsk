/**
 * Trigger Node Factory
 *
 * Creates trigger start nodes for flows (scenario, user, etc.)
 */

import { NodeType } from "../../../pwa/src/features/extensions/core/types";

const SCENARIO_VARIANT = "scenario";
const USER_VARIANT = "user";

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface TriggerNode {
  id: string;
  type: NodeType.START | NodeType.END;
  position: { x: number; y: number };
  data: {
    nodeVariant: string;
  };
  deletable: boolean;
  zIndex: number;
}

// Legacy alias for backward compatibility
export type ScenarioNode = TriggerNode;

/**
 * Create user start node
 */
export function createUserStartNode(): TriggerNode {
  return {
    id: generateUUID(),
    type: NodeType.START,
    position: { x: 0, y: 300 }, // Below regular start node
    data: {
      nodeVariant: USER_VARIANT,
    },
    deletable: false,
    zIndex: 1000,
  };
}

/**
 * Create scenario start node
 */
export function createScenarioStartNode(): TriggerNode {
  return {
    id: generateUUID(),
    type: NodeType.START,
    position: { x: 0, y: 600 }, // Below user start node
    data: {
      nodeVariant: SCENARIO_VARIANT,
    },
    deletable: false,
    zIndex: 1000,
  };
}

/**
 * Check if a node is a scenario node
 */
export function isScenarioNode(node: any): boolean {
  return node?.data?.nodeVariant === SCENARIO_VARIANT;
}

/**
 * Check if a node is a user node
 */
export function isUserNode(node: any): boolean {
  return node?.data?.nodeVariant === USER_VARIANT;
}

/**
 * Check if a flow has scenario nodes
 */
export function hasScenarioNodes(nodes: any[]): boolean {
  return nodes.some((node) => isScenarioNode(node));
}

/**
 * Check if a flow has user nodes
 */
export function hasUserNodes(nodes: any[]): boolean {
  return nodes.some((node) => isUserNode(node));
}
