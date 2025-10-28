import { UseCase } from "@/shared/core/use-case";
import { Result } from "@/shared/core/result";
import { UniqueEntityID } from "@/shared/domain";
import { DrizzleAgentRepo } from "../repos/impl/drizzle-agent-repo";

export interface GetAgentNameDTO {
  agentId: string;
}

export interface AgentNameResult {
  name: string;
}

export type GetAgentNameResponse = Result<AgentNameResult>;

export class GetAgentName implements UseCase<GetAgentNameDTO, GetAgentNameResponse> {
  private agentRepo: DrizzleAgentRepo;

  constructor(agentRepo: DrizzleAgentRepo) {
    this.agentRepo = agentRepo;
  }

  async execute(request: GetAgentNameDTO): Promise<GetAgentNameResponse> {
    const { agentId } = request;

    try {
      const agentIdObj = new UniqueEntityID(agentId);
      
      // Get only name field from database
      const nameData = await this.agentRepo.getAgentName(agentIdObj);
      
      if (!nameData) {
        return Result.fail<AgentNameResult>("Agent not found");
      }

      return Result.ok<AgentNameResult>({
        name: nameData.name
      });
    } catch (error: any) {
      return Result.fail<AgentNameResult>(error.message || "Failed to fetch agent name");
    }
  }
}