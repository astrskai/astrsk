import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { DataStoreNode } from "../domain";

export interface LoadDataStoreNodeRepo {
  getDataStoreNode(id: UniqueEntityID): Promise<Result<DataStoreNode | null>>;
  getDataStoreNodeByFlowAndNodeId(flowId: string, nodeId: string): Promise<Result<DataStoreNode | null>>;
  getAllDataStoreNodesByFlow(flowId: string): Promise<Result<DataStoreNode[]>>;
  getDataStoreNodesByFlowId(flowId: UniqueEntityID): Promise<Result<DataStoreNode[]>>;
}