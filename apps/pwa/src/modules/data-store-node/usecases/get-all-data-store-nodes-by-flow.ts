import { Result } from "@/shared/core";
import { UseCase } from "@/shared/core/use-case";
import { DataStoreNode } from "../domain";
import { LoadDataStoreNodeRepo } from "../repos/load-data-store-node-repo";

export interface GetAllDataStoreNodesByFlowRequest {
  flowId: string;
}

export class GetAllDataStoreNodesByFlowUseCase implements UseCase<GetAllDataStoreNodesByFlowRequest, Result<DataStoreNode[]>> {
  constructor(
    private dataStoreNodeRepo: LoadDataStoreNodeRepo
  ) {}

  async execute(request: GetAllDataStoreNodesByFlowRequest): Promise<Result<DataStoreNode[]>> {
    try {
      const result = await this.dataStoreNodeRepo.getAllDataStoreNodesByFlow(request.flowId);
      
      if (result.isFailure) {
        return Result.fail(result.getError());
      }

      return Result.ok(result.getValue());
    } catch (error) {
      return Result.fail(`Failed to get all data store nodes by flow: ${error}`);
    }
  }
}