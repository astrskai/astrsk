import { Result, UseCase } from "@/shared/core";
import { DataStoreField } from "@/entities/flow/domain/flow";
import { DataStoreNode } from "../domain";
import { LoadDataStoreNodeRepo, SaveDataStoreNodeRepo } from "../repos";

export interface UpdateDataStoreNodeFieldsRequest {
  flowId: string;
  nodeId: string;
  fields: DataStoreField[];
}

export class UpdateDataStoreNodeFieldsUseCase implements UseCase<UpdateDataStoreNodeFieldsRequest, Result<void>> {
  constructor(
    private loadDataStoreNodeRepo: LoadDataStoreNodeRepo,
    private saveDataStoreNodeRepo: SaveDataStoreNodeRepo,
  ) {}

  async execute(request: UpdateDataStoreNodeFieldsRequest): Promise<Result<void>> {
    try {
      // Get the existing node
      const getResult = await this.loadDataStoreNodeRepo.getDataStoreNodeByFlowAndNodeId(
        request.flowId,
        request.nodeId
      );

      if (getResult.isFailure) {
        return Result.fail(getResult.getError());
      }

      const dataStoreNode = getResult.getValue();
      if (!dataStoreNode) {
        return Result.fail(`DataStoreNode with nodeId ${request.nodeId} not found`);
      }

      // Update the fields
      const updateResult = dataStoreNode.updateFields(request.fields);
      if (updateResult.isFailure) {
        return Result.fail(updateResult.getError());
      }

      // Save the updated node
      const saveResult = await this.saveDataStoreNodeRepo.saveDataStoreNode(dataStoreNode);
      if (saveResult.isFailure) {
        return Result.fail(saveResult.getError());
      }

      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to update data store node fields: ${error}`);
    }
  }
}