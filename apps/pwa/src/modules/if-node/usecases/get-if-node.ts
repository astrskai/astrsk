import { Result, UseCase } from "@/shared/core";
import { IfNode } from "../domain";
import { LoadIfNodeRepo } from "../repos";

export interface GetIfNodeRequest {
  flowId: string;
  nodeId: string;
}

export class GetIfNodeUseCase implements UseCase<GetIfNodeRequest, Result<IfNode | null>> {
  constructor(
    private loadIfNodeRepo: LoadIfNodeRepo,
  ) {}

  async execute(request: GetIfNodeRequest): Promise<Result<IfNode | null>> {
    try {
      const result = await this.loadIfNodeRepo.getIfNodeByFlowAndNodeId(
        request.flowId, 
        request.nodeId
      );
      
      if (result.isFailure) {
        return Result.fail(result.getError());
      }

      return Result.ok(result.getValue());
    } catch (error) {
      return Result.fail(`Failed to get if node: ${error}`);
    }
  }
}