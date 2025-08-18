import { UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { Result } from "@/shared/core";
import { Node } from "../domain/flow";
import { LoadFlowRepo } from "../repos";

type GetNodeDTO = {
  flowId: UniqueEntityID;
  nodeId: string;
};

export class GetNode implements UseCase<GetNodeDTO, Promise<Result<Node>>> {
  constructor(private flowRepo: LoadFlowRepo) {}

  async execute(request: GetNodeDTO): Promise<Result<Node>> {
    const { flowId, nodeId } = request;

    const flowOrError = await this.flowRepo.getFlowById(flowId);

    if (flowOrError.isFailure) {
      return Result.fail<Node>(flowOrError.getError());
    }

    const flow = flowOrError.getValue();
    const node = flow.props.nodes.find((n: Node) => n.id === nodeId);

    if (!node) {
      return Result.fail<Node>(`Node with id ${nodeId} not found in flow`);
    }

    return Result.ok<Node>(node);
  }
}