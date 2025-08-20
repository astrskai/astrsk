import { UseCase } from "@/shared/core/use-case";
import { Result } from "@/shared/core/result";
import { UniqueEntityID } from "@/shared/domain";
import { DrizzleAgentRepo } from "../repos/impl/drizzle-agent-repo";

export interface GetAgentModelDTO {
  agentId: string;
}

export interface AgentModelResult {
  modelName: string | null;
  apiSource: string | null;
  modelId: string | null;
}

export type GetAgentModelResponse = Result<AgentModelResult>;

export class GetAgentModel implements UseCase<GetAgentModelDTO, GetAgentModelResponse> {
  private agentRepo: DrizzleAgentRepo;

  constructor(agentRepo: DrizzleAgentRepo) {
    this.agentRepo = agentRepo;
  }

  async execute(request: GetAgentModelDTO): Promise<GetAgentModelResponse> {
    const { agentId } = request;

    try {
      const agentIdObj = new UniqueEntityID(agentId);
      
      // Get only model fields from database
      const modelData = await this.agentRepo.getAgentModel(agentIdObj);
      
      if (!modelData) {
        return Result.fail<AgentModelResult>("Agent not found");
      }

      return Result.ok<AgentModelResult>({
        modelName: modelData.modelName,
        apiSource: modelData.apiSource,
        modelId: modelData.modelId
      });
    } catch (error: any) {
      return Result.fail<AgentModelResult>(error.message || "Failed to fetch agent model");
    }
  }
}