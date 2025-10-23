import { UseCase } from "@/shared/core/use-case";
import { Result } from "@/shared/core/result";
import { DrizzleAgentRepo } from "../repos/impl/drizzle-agent-repo";
import { ApiType } from "../domain/agent";
import { PromptMessage } from "../domain";

export interface UpdateAgentPromptDTO {
  agentId: string;
  targetApiType?: ApiType;
  promptMessages?: PromptMessage[];
  textPrompt?: string;
}

export type UpdateAgentPromptResponse = Result<void>;

export class UpdateAgentPrompt implements UseCase<UpdateAgentPromptDTO, UpdateAgentPromptResponse> {
  private agentRepo: DrizzleAgentRepo;

  constructor(agentRepo: DrizzleAgentRepo) {
    this.agentRepo = agentRepo;
  }

  async execute(request: UpdateAgentPromptDTO): Promise<UpdateAgentPromptResponse> {
    const { agentId, promptMessages, ...otherData } = request;

    try {
      // Convert PromptMessage objects to JSON for database storage
      const promptData: any = { ...otherData };
      
      if (promptMessages !== undefined) {
        // Pass PromptMessage instances directly - let superjson handle serialization
        promptData.promptMessages = promptMessages;
      }
      
      // Update only the provided prompt fields
      const result = await this.agentRepo.updateAgentPromptFields(
        agentId,
        promptData
      );

      if (result.isFailure) {
        return Result.fail<void>(result.getError());
      }

      return Result.ok<void>();
    } catch (error: any) {
      return Result.fail<void>(error.message || "Failed to update agent prompt");
    }
  }
}