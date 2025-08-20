import { UseCase } from "@/shared/core/use-case";
import { Result } from "@/shared/core/result";
import { DrizzleAgentRepo } from "../repos/impl/drizzle-agent-repo";

export interface UpdateAgentNameDTO {
  agentId: string;
  name: string;
}

export type UpdateAgentNameResponse = Result<void>;

export class UpdateAgentName implements UseCase<UpdateAgentNameDTO, UpdateAgentNameResponse> {
  private agentRepo: DrizzleAgentRepo;

  constructor(agentRepo: DrizzleAgentRepo) {
    this.agentRepo = agentRepo;
  }

  async execute(request: UpdateAgentNameDTO): Promise<UpdateAgentNameResponse> {
    const { agentId, name } = request;

    try {
      // Update only the name field
      const result = await this.agentRepo.updateAgentName(agentId, name);

      if (result.isFailure) {
        return Result.fail<void>(result.getError());
      }

      return Result.ok<void>();
    } catch (error: any) {
      return Result.fail<void>(error.message || "Failed to update agent name");
    }
  }
}