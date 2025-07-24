import { Result, UseCase } from "@/shared/core";

import { Flow } from "@/modules/flow/domain/flow";
import {
  LoadFlowRepo,
  SearchFlowQuery,
} from "@/modules/flow/repos/load-flow-repo";

export class SearchFlow implements UseCase<SearchFlowQuery, Result<Flow[]>> {
  constructor(private loadFlowRepo: LoadFlowRepo) {}

  async execute(query: SearchFlowQuery): Promise<Result<Flow[]>> {
    try {
      return await this.loadFlowRepo.searchFlow(query);
    } catch (error) {
      return Result.fail(
        `Failed to search flow: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
