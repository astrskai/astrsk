import { CustomEdgeType } from "@/features/flow/flow-multi/edges";

/**
 * Ensures that edges have the selectable property set to true
 * to allow deletion via keyboard shortcuts (Backspace/Delete).
 */
export function ensureEdgeSelectable(edge: CustomEdgeType): CustomEdgeType {
  return {
    ...edge,
    selectable: true,
  };
}

/**
 * Applies selectability to an array of edges
 */
export function ensureEdgesSelectable(edges: CustomEdgeType[]): CustomEdgeType[] {
  return edges.map(edge => ensureEdgeSelectable(edge));
}