import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { DataStoreNode } from "../domain";
import { LoadDataStoreNodeRepo, SaveDataStoreNodeRepo } from "../repos";

export interface CloneDataStoreNodeRequest {
  originalNodeId: string;
  originalFlowId: string;
  newNodeId: string;
  newFlowId: string;
  name?: string; // Optional: override the name
  color?: string; // Optional: override the color
}

export class CloneDataStoreNodeUseCase
  implements UseCase<CloneDataStoreNodeRequest, Result<DataStoreNode | null>>
{
  constructor(
    private loadDataStoreNodeRepo: LoadDataStoreNodeRepo,
    private saveDataStoreNodeRepo: SaveDataStoreNodeRepo,
  ) {}

  async execute(
    request: CloneDataStoreNodeRequest,
  ): Promise<Result<DataStoreNode | null>> {
    try {
      // Get the original data store node
      const dataStoreOrError =
        await this.loadDataStoreNodeRepo.getDataStoreNodeByFlowAndNodeId(
          request.originalFlowId,
          request.originalNodeId,
        );

      if (dataStoreOrError.isFailure) {
        return Result.fail(
          `Failed to get original data store node: ${dataStoreOrError.getError()}`,
        );
      }

      const originalNode = dataStoreOrError.getValue();
      if (!originalNode) {
        // Node doesn't exist, return success with null (not an error case for optional nodes)
        console.log(
          `DataStore node not found for nodeId: ${request.originalNodeId}, returning null`,
        );
        return Result.ok(null);
      }

      // Create a clone with new IDs and optionally override name/color
      const clonedNodeOrError = DataStoreNode.create(
        {
          flowId: request.newFlowId,
          name: request.name || originalNode.props.name,
          color: request.color || originalNode.props.color,
          dataStoreFields: originalNode.props.dataStoreFields || [],
        },
        new UniqueEntityID(request.newNodeId),
      );

      if (clonedNodeOrError.isFailure) {
        return Result.fail(
          `Failed to create cloned data store node: ${clonedNodeOrError.getError()}`,
        );
      }

      const clonedNode = clonedNodeOrError.getValue();

      // Save the cloned node
      const saveResult =
        await this.saveDataStoreNodeRepo.saveDataStoreNode(clonedNode);
      if (saveResult.isFailure) {
        return Result.fail(
          `Failed to save cloned data store node: ${saveResult.getError()}`,
        );
      }

      console.log(
        `Successfully cloned DataStore node from ${request.originalNodeId} to ${request.newNodeId}`,
      );
      return Result.ok(clonedNode);
    } catch (error) {
      return Result.fail(`Failed to clone data store node: ${error}`);
    }
  }
}
