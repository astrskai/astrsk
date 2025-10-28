import { UseCase } from "@/shared/core/use-case";
import { Result } from "@/shared/core/result";
import { UniqueEntityID } from "@/shared/domain";
import { DrizzleAgentRepo } from "../repos/impl/drizzle-agent-repo";
import { ApiType } from "../domain/agent";
import { PromptMessage, parsePromptMessage, PlainPromptMessage, HistoryPromptMessage } from "../domain";

export interface GetAgentPromptDTO {
  agentId: string;
}

export interface AgentPromptResult {
  name: string;
  targetApiType: ApiType;
  promptMessages: PromptMessage[] | null;
  textPrompt: string | null;
}

export type GetAgentPromptResponse = Result<AgentPromptResult>;

export class GetAgentPrompt implements UseCase<GetAgentPromptDTO, GetAgentPromptResponse> {
  private agentRepo: DrizzleAgentRepo;

  constructor(agentRepo: DrizzleAgentRepo) {
    this.agentRepo = agentRepo;
  }

  async execute(request: GetAgentPromptDTO): Promise<GetAgentPromptResponse> {
    const { agentId } = request;

    try {
      const agentIdObj = new UniqueEntityID(agentId);
      
      // Get only prompt-related fields from database
      const promptData = await this.agentRepo.getAgentPromptFields(agentIdObj);
      
      if (!promptData) {
        return Result.fail<AgentPromptResult>("Agent not found");
      }

      // Convert prompt messages - they could be plain objects or already PromptMessage instances
      let promptMessages: PromptMessage[] | null = null;
      if (promptData.promptMessages && promptData.promptMessages.length > 0) {
        promptMessages = [];
        for (const msgData of promptData.promptMessages) {
          // Check if superjson already converted it to a PromptMessage instance
          if (msgData instanceof PlainPromptMessage || msgData instanceof HistoryPromptMessage) {
            promptMessages.push(msgData as PromptMessage);
          } else {
            // It's a plain object, parse it
            const parsedMessage = parsePromptMessage(msgData);
            if (parsedMessage.isSuccess) {
              promptMessages.push(parsedMessage.getValue());
            }
          }
        }
      }

      // Return prompt data
      return Result.ok<AgentPromptResult>({
        name: promptData.name,
        targetApiType: promptData.targetApiType,
        promptMessages,
        textPrompt: promptData.textPrompt || null
      });
    } catch (error: any) {
      return Result.fail<AgentPromptResult>(error.message || "Failed to fetch agent prompt data");
    }
  }
}