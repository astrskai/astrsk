import { parse, stringify } from "superjson";
import { AgentPromptResult } from "@/entities/agent/usecases/get-agent-prompt";

export class PromptDrizzleMapper {
  public static toPersistence(prompt: AgentPromptResult): any {
    return {
      ...prompt,
      promptMessages: prompt.promptMessages ? stringify(prompt.promptMessages) : null
    };
  }

  public static toDomain(data: any): AgentPromptResult {
    return {
      ...data,
      promptMessages: data.promptMessages ? (parse(data.promptMessages) || []) : null
    };
  }
}