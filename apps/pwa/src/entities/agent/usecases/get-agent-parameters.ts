import { UseCase } from "@/shared/core";
import { Result } from "@/shared/core";
import { DrizzleAgentRepo } from "../repos/impl/drizzle-agent-repo";

type GetAgentParametersRequest = {
  agentId: string;
};

type AgentParameters = {
  enabledParameters: Map<string, boolean>;
  parameterValues: Map<string, any>;
};

export class GetAgentParameters implements UseCase<GetAgentParametersRequest, Promise<Result<AgentParameters>>> {
  private agentRepo: DrizzleAgentRepo;
  
  constructor() {
    this.agentRepo = new DrizzleAgentRepo();
  }

  async execute(request: GetAgentParametersRequest): Promise<Result<AgentParameters>> {
    const { agentId } = request;

    // Get only the parameter fields from the agent
    const parametersResult = await this.agentRepo.getAgentParameters(agentId);
    
    if (parametersResult.isFailure) {
      return Result.fail<AgentParameters>(parametersResult.getError());
    }

    return Result.ok<AgentParameters>(parametersResult.getValue());
  }
}