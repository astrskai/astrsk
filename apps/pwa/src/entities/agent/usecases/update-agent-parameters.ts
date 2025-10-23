import { UseCase } from "@/shared/core";
import { Result } from "@/shared/core";
import { DrizzleAgentRepo } from "../repos/impl/drizzle-agent-repo";

type UpdateAgentParametersRequest = {
  agentId: string;
  enabledParameters: Map<string, boolean>;
  parameterValues: Map<string, any>;
};

export class UpdateAgentParameters implements UseCase<UpdateAgentParametersRequest, Promise<Result<void>>> {
  private agentRepo: DrizzleAgentRepo;
  
  constructor() {
    this.agentRepo = new DrizzleAgentRepo();
  }

  async execute(request: UpdateAgentParametersRequest): Promise<Result<void>> {
    const { agentId, enabledParameters, parameterValues } = request;

    // Use targeted update to only save parameter fields (avoids race conditions)
    const updateResult = await this.agentRepo.updateAgentParameters(
      agentId,
      enabledParameters,
      parameterValues
    );
    
    if (updateResult.isFailure) {
      return Result.fail<void>(updateResult.getError());
    }

    return Result.ok<void>();
  }
}