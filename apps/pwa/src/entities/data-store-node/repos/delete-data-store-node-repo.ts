import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

export interface DeleteDataStoreNodeRepo {
  deleteDataStoreNode(id: UniqueEntityID): Promise<Result<void>>;
  deleteAllDataStoreNodesByFlow(flowId: string): Promise<Result<void>>;
}