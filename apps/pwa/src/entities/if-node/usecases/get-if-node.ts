import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { IfNode } from "../domain";
import { LoadIfNodeRepo } from "../repos";

export class GetIfNodeUseCase
  implements UseCase<UniqueEntityID, Result<IfNode | null>>
{
  constructor(private loadIfNodeRepo: LoadIfNodeRepo) {}

  async execute(nodeId: UniqueEntityID): Promise<Result<IfNode | null>> {
    try {
      const result = await this.loadIfNodeRepo.getIfNode(nodeId);

      if (result.isFailure) {
        return Result.fail(result.getError());
      }

      return Result.ok(result.getValue());
    } catch (error) {
      return Result.fail(`Failed to get if node: ${error}`);
    }
  }
}
