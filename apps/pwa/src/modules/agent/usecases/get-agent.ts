import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { Agent } from "@/modules/agent/domain";
import { LoadAgentRepo } from "@/modules/agent/repos";

export class GetAgent implements UseCase<UniqueEntityID, Result<Agent>> {
  constructor(private loadAgentRepo: LoadAgentRepo) {}

  async execute(id: UniqueEntityID): Promise<Result<Agent>> {
    try {
      return await this.loadAgentRepo.getAgentById(id);
    } catch (error) {
      return Result.fail<Agent>(
        `Error fetching agent: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
