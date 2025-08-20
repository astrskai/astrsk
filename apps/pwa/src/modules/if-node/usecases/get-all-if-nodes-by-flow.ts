import { Result } from "@/shared/core";
import { UseCase } from "@/shared/core/use-case";
import { IfNode } from "../domain";
import { LoadIfNodeRepo } from "../repos/load-if-node-repo";

export interface GetAllIfNodesByFlowRequest {
  flowId: string;
}

export class GetAllIfNodesByFlowUseCase implements UseCase<GetAllIfNodesByFlowRequest, Result<IfNode[]>> {
  constructor(
    private ifNodeRepo: LoadIfNodeRepo
  ) {}

  async execute(request: GetAllIfNodesByFlowRequest): Promise<Result<IfNode[]>> {
    try {
      const result = await this.ifNodeRepo.getAllIfNodesByFlow(request.flowId);
      
      if (result.isFailure) {
        return Result.fail(result.getError());
      }

      return Result.ok(result.getValue());
    } catch (error) {
      return Result.fail(`Failed to get all if nodes by flow: ${error}`);
    }
  }
}