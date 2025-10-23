import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { Flow } from "@/entities/flow/domain/flow";
import { LoadFlowRepo } from "@/entities/flow/repos/load-flow-repo";

export class GetFlow implements UseCase<UniqueEntityID, Result<Flow>> {
  constructor(private loadFlowRepo: LoadFlowRepo) {}

  async execute(id: UniqueEntityID): Promise<Result<Flow>> {
    try {
      return await this.loadFlowRepo.getFlowById(id);
    } catch (error) {
      return Result.fail(
        `Error fetching flow: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
