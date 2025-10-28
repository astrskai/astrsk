import { Result } from "@/shared/core/result";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";

export interface DeleteFlowRepo {
  deleteFlow(id: UniqueEntityID): Promise<Result<void>>;
}
