import { Message } from "@/shared/prompt/domain/renderable";

interface AnthropicMessage {
  role: "user" | "assistant";
  content: Array<{ type: "text"; text: string }>;
}

interface AnthropicPrompt {
  system?: Array<{ type: "text"; text: string }>;
  messages: AnthropicMessage[];
  error?: string;
}
export type GoogleGenerativeAIPrompt = {
  systemInstruction?: GoogleGenerativeAISystemInstruction;
  contents: Array<GoogleGenerativeAIContent>;
  error?: string;
};

export type GoogleGenerativeAIContentPart = { text: string };

export type GoogleGenerativeAISystemInstruction = {
  parts: Array<{ text: string }>;
};

export type GoogleGenerativeAIContent = {
  role: string;
  parts: Array<GoogleGenerativeAIContentPart>;
};

interface OpenAIMessage {
  role: string;
  content: string;
}

interface OpenAIPrompt {
  messages: OpenAIMessage[];
}

function groupMessagesByRole(messages: Message[]) {
  const blocks: Array<{
    type: "system" | "user" | "assistant";
    messages: Message[];
  }> = [];
  let currentBlock:
    | { type: "system" | "user" | "assistant"; messages: Message[] }
    | undefined;

  for (const message of messages) {
    if (!currentBlock || currentBlock.type !== message.role) {
      currentBlock = { type: message.role, messages: [] };
      blocks.push(currentBlock);
    }
    currentBlock.messages.push(message);
  }

  return blocks;
}

export function convertToAnthropicPrompt(messages: Message[]): AnthropicPrompt {
  const blocks = groupMessagesByRole(messages);
  const anthropicPrompt: AnthropicPrompt = { messages: [] };
  const error = undefined;

  for (const block of blocks) {
    switch (block.type) {
      case "system": {
        if (!anthropicPrompt.system) {
          anthropicPrompt.system = block.messages.map((msg) => ({
            type: "text" as const,
            text: msg.content,
          }));
        } else {
          anthropicPrompt.error =
            "Anthropic does not support multiple system messages";
        }
        break;
      }
      case "user":
      case "assistant": {
        const anthropicMessage: AnthropicMessage = {
          role: block.type,
          content: block.messages.map((msg) => ({
            type: "text" as const,
            text: msg.content,
          })),
        };
        anthropicPrompt.messages.push(anthropicMessage);
        break;
      }
    }
  }

  return anthropicPrompt;
}

export function convertToGoogleGenerativeAIPrompt(
  messages: Message[],
): GoogleGenerativeAIPrompt {
  const systemInstructionParts: Array<{ text: string }> = [];
  const contents: Array<GoogleGenerativeAIContent> = [];
  let error = undefined;
  let hasSeenNonSystemMessage = false;

  for (const message of messages) {
    if (message.role === "system") {
      if (hasSeenNonSystemMessage) {
        // @ts-ignore
        error =
          "Google Generative AI only supports system messages at the beginning of the conversation";
      }
      systemInstructionParts.push({ text: message.content });
    } else {
      hasSeenNonSystemMessage = true;
      contents.push({
        role: message.role,
        parts: [{ text: message.content }],
      });
    }
  }

  return {
    systemInstruction:
      systemInstructionParts.length > 0
        ? { parts: systemInstructionParts }
        : undefined,
    contents,
    error,
  };
}
