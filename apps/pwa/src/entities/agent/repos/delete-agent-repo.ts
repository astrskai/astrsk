import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

export interface DeleteAgentRepo {
  deleteAgent(id: UniqueEntityID): Promise<Result<void>>;
}
