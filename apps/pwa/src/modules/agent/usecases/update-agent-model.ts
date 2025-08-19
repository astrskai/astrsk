import { UseCase } from "@/shared/core/use-case";
import { Result } from "@/shared/core/result";
import { DrizzleAgentRepo } from "../repos/impl/drizzle-agent-repo";

export interface UpdateAgentModelDTO {
  agentId: string;
  modelName?: string;
  apiSource?: string;
  modelId?: string;
}

export type UpdateAgentModelResponse = Result<void>;

export class UpdateAgentModel implements UseCase<UpdateAgentModelDTO, UpdateAgentModelResponse> {
  private agentRepo: DrizzleAgentRepo;

  constructor(agentRepo: DrizzleAgentRepo) {
    this.agentRepo = agentRepo;
  }

  async execute(request: UpdateAgentModelDTO): Promise<UpdateAgentModelResponse> {
    const { agentId, modelName, apiSource, modelId } = request;

    try {
      // Update only the model fields
      const result = await this.agentRepo.updateAgentModel(agentId, {
        modelName,
        apiSource,
        modelId
      });

      if (result.isFailure) {
        return Result.fail<void>(result.getError());
      }

      return Result.ok<void>();
    } catch (error: any) {
      return Result.fail<void>(error.message || "Failed to update agent model");
    }
  }
}