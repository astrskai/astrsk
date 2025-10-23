import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { IfNode } from "../domain";

export interface LoadIfNodeRepo {
  getIfNode(id: UniqueEntityID): Promise<Result<IfNode | null>>;
  getIfNodeByFlowAndNodeId(flowId: string, nodeId: string): Promise<Result<IfNode | null>>;
  getAllIfNodesByFlow(flowId: string): Promise<Result<IfNode[]>>;
}