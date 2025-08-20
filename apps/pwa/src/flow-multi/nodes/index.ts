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
import DataStoreNode, {
  type DataStoreNode as DataStoreNodeType,
} from "@/flow-multi/nodes/data-store-node";
import IfNode, {
  type IfNode as IfNodeType,
} from "@/flow-multi/nodes/if-node";

export const nodeTypes = {
  start: StartNode,
  end: EndNode,
  agent: AgentNode,
  dataStore: DataStoreNode,
  if: IfNode,
} satisfies NodeTypes;

// Append the types of you custom edges to the BuiltInNode type
export type CustomNodeType =
  | BuiltInNode
  | StartNodeType
  | EndNodeType
  | AgentNodeType
  | DataStoreNodeType
  | IfNodeType;