import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { IfNode, CreateIfNodeProps } from "../domain";
import { SaveIfNodeRepo } from "../repos";

export interface CreateIfNodeRequest extends CreateIfNodeProps {
  nodeId?: string; // Optional override for node ID
}

export class CreateIfNodeUseCase implements UseCase<CreateIfNodeRequest, Result<IfNode>> {
  constructor(
    private saveIfNodeRepo: SaveIfNodeRepo,
  ) {}

  async execute(request: CreateIfNodeRequest): Promise<Result<IfNode>> {
    try {
      // Create node ID from request or generate new one
      const nodeId = request.nodeId ? new UniqueEntityID(request.nodeId) : new UniqueEntityID();

      // Create domain entity
      const ifNodeOrError = IfNode.create(
        {
          flowId: request.flowId,
          name: request.name,
          color: request.color || "#3b82f6",
          logicOperator: request.logicOperator || 'AND',
          conditions: request.conditions || [],
        },
        nodeId
      );

      if (ifNodeOrError.isFailure) {
        return Result.fail(ifNodeOrError.getError());
      }

      const ifNode = ifNodeOrError.getValue();

      // Save to repository
      const saveResult = await this.saveIfNodeRepo.saveIfNode(ifNode);
      if (saveResult.isFailure) {
        return Result.fail(saveResult.getError());
      }

      return Result.ok(ifNode);
    } catch (error) {
      return Result.fail(`Failed to create if node: ${error}`);
    }
  }
}