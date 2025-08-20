import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { DataStoreNode, CreateDataStoreNodeProps } from "../domain";
import { SaveDataStoreNodeRepo } from "../repos";

export interface CreateDataStoreNodeRequest extends CreateDataStoreNodeProps {
  nodeId?: string; // Optional override for node ID
}

export class CreateDataStoreNodeUseCase implements UseCase<CreateDataStoreNodeRequest, Result<DataStoreNode>> {
  constructor(
    private saveDataStoreNodeRepo: SaveDataStoreNodeRepo,
  ) {}

  async execute(request: CreateDataStoreNodeRequest): Promise<Result<DataStoreNode>> {
    try {
      // Create node ID from request or generate new one
      const nodeId = request.nodeId ? new UniqueEntityID(request.nodeId) : new UniqueEntityID();

      // Create domain entity
      const dataStoreNodeOrError = DataStoreNode.create(
        {
          flowId: request.flowId,
          name: request.name,
          color: request.color || "#3b82f6",
          dataStoreFields: request.dataStoreFields || [],
        },
        nodeId
      );

      if (dataStoreNodeOrError.isFailure) {
        return Result.fail(dataStoreNodeOrError.getError());
      }

      const dataStoreNode = dataStoreNodeOrError.getValue();

      // Save to repository
      const saveResult = await this.saveDataStoreNodeRepo.saveDataStoreNode(dataStoreNode);
      if (saveResult.isFailure) {
        return Result.fail(saveResult.getError());
      }

      return Result.ok(dataStoreNode);
    } catch (error) {
      return Result.fail(`Failed to create data store node: ${error}`);
    }
  }
}