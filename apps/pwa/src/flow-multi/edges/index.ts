import type { BuiltInEdge, Edge, EdgeTypes } from "@xyflow/react";

import ButtonEdge, {
  type ButtonEdge as ButtonEdgeType,
} from "@/flow-multi/edges/button-edge";

export const initialEdges = [
  { id: "a->b", source: "a", target: "b", animated: true },
  { id: "b->c", source: "b", target: "c", animated: true },
] satisfies Edge[];

export const edgeTypes = {
  // Add your custom edge types here!
  "button-edge": ButtonEdge,
} satisfies EdgeTypes;

// Append the types of you custom edges to the BuiltInEdge type
export type CustomEdgeType = BuiltInEdge | ButtonEdgeType;
