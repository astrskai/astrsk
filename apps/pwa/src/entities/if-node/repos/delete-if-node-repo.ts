import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

export interface DeleteIfNodeRepo {
  deleteIfNode(id: UniqueEntityID): Promise<Result<void>>;
  deleteAllIfNodesByFlow(flowId: string): Promise<Result<void>>;
}