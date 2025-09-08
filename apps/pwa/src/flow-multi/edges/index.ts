import type { BuiltInEdge, Edge, EdgeTypes } from "@xyflow/react";

import ButtonEdge, {
  type ButtonEdge as ButtonEdgeType,
} from "@/flow-multi/edges/button-edge";
import CustomLabelEdge, {
  type CustomLabelEdge as CustomLabelEdgeType,
} from "@/flow-multi/edges/custom-label-edge";

export const initialEdges = [
  { id: "a->b", source: "a", target: "b", type: "default", animated: true },
  { id: "b->c", source: "b", target: "c", type: "default", animated: true },
] satisfies Edge[];

export const edgeTypes = {
  // Add your custom edge types here!
  "button-edge": ButtonEdge,
  // Use default edge as our custom label edge - it will automatically handle labels
  default: CustomLabelEdge,
} satisfies EdgeTypes;

// Append the types of you custom edges to the BuiltInEdge type
export type CustomEdgeType = BuiltInEdge | ButtonEdgeType | CustomLabelEdgeType;
