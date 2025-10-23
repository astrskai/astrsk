import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

export interface DeleteGeneratedImageRepo {
  delete(id: UniqueEntityID): Promise<Result<void>>;
}