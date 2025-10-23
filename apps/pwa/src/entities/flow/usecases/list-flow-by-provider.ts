import { Result, UseCase } from "@/shared/core";
import { formatFail } from "@/shared/lib";

import { ApiSource } from "@/entities/api/domain";
import { Flow } from "@/entities/flow/domain/flow";
import { LoadFlowRepo } from "@/entities/flow/repos";

type Command = {
  provider: ApiSource;
};

export class ListFlowByProvider implements UseCase<Command, Result<Flow[]>> {
  constructor(private loadFlowRepo: LoadFlowRepo) {}

  async execute({ provider }: Command): Promise<Result<Flow[]>> {
    try {
      const flowsOrError = await this.loadFlowRepo.listFlowByProvider(provider);
      if (flowsOrError.isFailure) {
        throw new Error(flowsOrError.getError());
      }
      return Result.ok(flowsOrError.getValue());
    } catch (error) {
      return formatFail("Failed to list flows by provider", error);
    }
  }
}
