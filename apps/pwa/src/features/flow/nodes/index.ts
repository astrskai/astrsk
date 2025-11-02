import type { BuiltInNode, NodeTypes } from "@xyflow/react";

import AgentNode, {
  type AgentNode as AgentNodeType,
} from "@/features/flow/nodes/agent-node";
import EndNode, {
  type EndNode as EndNodeType,
} from "@/features/flow/nodes/end-node";
import StartNode, {
  type StartNode as StartNodeType,
} from "@/features/flow/nodes/start-node";
import DataStoreNode, {
  type DataStoreNode as DataStoreNodeType,
} from "@/features/flow/nodes/data-store-node";
import IfNode, {
  type IfNode as IfNodeType,
} from "@/features/flow/nodes/if-node";

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