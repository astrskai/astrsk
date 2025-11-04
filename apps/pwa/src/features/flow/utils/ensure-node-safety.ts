import { CustomNodeType } from "@/features/flow/nodes";

/**
 * Ensures that nodes have the deletable property set to false
 * to prevent accidental deletion via keyboard shortcuts.
 * This is a safety measure to protect the flow structure.
 */
export function ensureNodeSafety(node: CustomNodeType): CustomNodeType {
  return {
    ...node,
    deletable: false,
  };
}

/**
 * Applies node safety to an array of nodes
 */
export function ensureNodesSafety(nodes: CustomNodeType[]): CustomNodeType[] {
  return nodes.map(node => ensureNodeSafety(node));
}