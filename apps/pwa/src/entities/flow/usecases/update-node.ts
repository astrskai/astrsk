import { UseCase } from "@/shared/core";
import { Result } from "@/shared/core";

type UpdateNodeRequest = {
  flowId: string;
  nodeId: string;
  nodeData: any; // The node's data field to update
};

export class UpdateNode implements UseCase<UpdateNodeRequest, Promise<Result<void>>> {
  constructor(private flowRepo: any) {}

  async execute(request: UpdateNodeRequest): Promise<Result<void>> {
    const { flowId, nodeId, nodeData } = request;

    // Use targeted update to only update specific node's data
    // This avoids race conditions where other nodes or fields might be overwritten
    const updateResult = await this.flowRepo.updateNode(flowId, nodeId, nodeData);
    
    if (updateResult.isFailure) {
      return Result.fail<void>(updateResult.getError());
    }

    return Result.ok<void>();
  }
}