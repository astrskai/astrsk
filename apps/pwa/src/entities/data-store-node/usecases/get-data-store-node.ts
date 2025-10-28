import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { DataStoreNode } from "../domain";
import { LoadDataStoreNodeRepo } from "../repos";

export class GetDataStoreNodeUseCase
  implements UseCase<UniqueEntityID, Result<DataStoreNode | null>>
{
  constructor(private loadDataStoreNodeRepo: LoadDataStoreNodeRepo) {}

  async execute(nodeId: UniqueEntityID): Promise<Result<DataStoreNode | null>> {
    try {
      const result = await this.loadDataStoreNodeRepo.getDataStoreNode(nodeId);

      if (result.isFailure) {
        return Result.fail(result.getError());
      }

      return Result.ok(result.getValue());
    } catch (error) {
      return Result.fail(`Failed to get data store node: ${error}`);
    }
  }
}
