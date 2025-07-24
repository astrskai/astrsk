import { Result, UseCase } from "@/shared/core";
import { formatFail } from "@/shared/utils";

import { ApiSource } from "@/modules/api/domain";
import { Flow } from "@/modules/flow/domain/flow";
import { LoadFlowRepo } from "@/modules/flow/repos";

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
