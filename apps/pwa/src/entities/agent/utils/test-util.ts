import { MessageRole } from "@/shared/prompt/domain";

import {
  Agent,
  ApiType,
  CreateAgentProps,
  PlainBlock,
  PlainPromptMessage,
} from "@/entities/agent/domain";

export const createAgent = (props?: Partial<CreateAgentProps>) => {
  return Agent.create({
    name: "preset-test",
    description: "description-test",
    targetApiType: ApiType.Chat,
    promptMessages: [
      PlainPromptMessage.create({
        role: MessageRole.User,
        promptBlocks: [
          PlainBlock.create({
            name: "plain-block",
            template: "Hello, world!",
          }).getValue(),
        ],
      }).getValue(),
    ],
    enabledParameters: new Map<string, boolean>(
      Object.entries({
        "param-test": true,
      }),
    ),
    parameterValues: new Map<string, any>(
      Object.entries({
        "param-test": 0.25,
      }),
    ),
    ...props,
  }).getValue();
};
