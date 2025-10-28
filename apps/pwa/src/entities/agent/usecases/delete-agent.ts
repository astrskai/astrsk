import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { DeleteAgentRepo } from "@/entities/agent/repos";

export class DeleteAgent implements UseCase<UniqueEntityID, Result<void>> {
  constructor(private deleteAgentRepo: DeleteAgentRepo) {}

  async execute(id: UniqueEntityID): Promise<Result<void>> {
    try {
      return await this.deleteAgentRepo.deleteAgent(id);
    } catch (error) {
      return Result.fail<void>(
        `Failed to delete agent: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
