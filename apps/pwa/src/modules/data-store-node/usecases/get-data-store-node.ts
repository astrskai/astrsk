import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { DataStoreNode } from "../domain";
import { LoadDataStoreNodeRepo } from "../repos";

export interface GetDataStoreNodeRequest {
  flowId: string;
  nodeId: string;
}

export class GetDataStoreNodeUseCase implements UseCase<GetDataStoreNodeRequest, Result<DataStoreNode | null>> {
  constructor(
    private loadDataStoreNodeRepo: LoadDataStoreNodeRepo,
  ) {}

  async execute(request: GetDataStoreNodeRequest): Promise<Result<DataStoreNode | null>> {
    try {
      const result = await this.loadDataStoreNodeRepo.getDataStoreNodeByFlowAndNodeId(
        request.flowId, 
        request.nodeId
      );
      
      if (result.isFailure) {
        return Result.fail(result.getError());
      }

      return Result.ok(result.getValue());
    } catch (error) {
      return Result.fail(`Failed to get data store node: ${error}`);
    }
  }
}