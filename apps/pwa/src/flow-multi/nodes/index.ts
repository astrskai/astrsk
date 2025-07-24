import type { BuiltInNode, NodeTypes } from "@xyflow/react";

import AgentNode, {
  type AgentNode as AgentNodeType,
} from "@/flow-multi/nodes/agent-node";
import EndNode, {
  type EndNode as EndNodeType,
} from "@/flow-multi/nodes/end-node";
import StartNode, {
  type StartNode as StartNodeType,
} from "@/flow-multi/nodes/start-node";

export const nodeTypes = {
  start: StartNode,
  end: EndNode,
  agent: AgentNode,
} satisfies NodeTypes;

// Append the types of you custom edges to the BuiltInNode type
export type CustomNodeType =
  | BuiltInNode
  | StartNodeType
  | EndNodeType
  | AgentNodeType;