import { Result, UseCase } from "@/shared/core";

import { Flow } from "@/modules/flow/domain/flow";
import { SaveFlowRepo } from "@/modules/flow/repos/save-flow-repo";

export class SaveFlow implements UseCase<Flow, Result<Flow>> {
  constructor(private saveFlowRepo: SaveFlowRepo) {}

  async execute(flow: Flow): Promise<Result<Flow>> {
    try {
      const savedFlow = await this.saveFlowRepo.saveFlow(flow);
      return savedFlow;
    } catch (error) {
      return Result.fail(
        `Failed to save flow: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
