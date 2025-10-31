import { registerCustom } from "superjson";

import { Guard, Result } from "@/shared/core";
import { Entity, UniqueEntityID } from "@/shared/domain";
import {
  HistoryItem,
  Message,
  MessageRole,
  parsePromptBlock,
  Renderable,
  RenderContext,
} from "@/shared/prompt/domain";
import { formatFail } from "@/shared/utils";

import {
  PromptBlock,
  PromptMessageProps,
  PromptMessageType,
  UpdateBlockProps,
  UpdatePromptMessageProps,
} from "@/modules/agent/domain";

export const HistoryType = {
  Split: "split",
  Merge: "merge",
} as const;

export type HistoryType = (typeof HistoryType)[keyof typeof HistoryType];

export const HistoryMessageRole = {
  User: "user",
  Assistant: "assistant",
} as const;

export type HistoryMessageRole =
  (typeof HistoryMessageRole)[keyof typeof HistoryMessageRole];

export interface HistoryPromptMessageProps {
  historyType: HistoryType;
  start?: number;
  end?: number;
  countFromEnd?: boolean;

  // For split
  userPromptBlocks?: PromptBlock[];
  assistantPromptBlocks?: PromptBlock[];
  userMessageRole?: HistoryMessageRole;
  charMessageRole?: HistoryMessageRole;
  subCharMessageRole?: HistoryMessageRole;

  // For merge
  role?: MessageRole;
  promptBlocks?: PromptBlock[];
}

export type CreateHistoryPromptMessageProps = HistoryPromptMessageProps & {
  enabled?: boolean;
};
export type UpdateHistoryPromptMessageProps =
  Partial<CreateHistoryPromptMessageProps>;

export class HistoryPromptMessage
  extends Entity<PromptMessageProps & HistoryPromptMessageProps>
  implements Renderable
{
  get type(): PromptMessageType {
    return this.props.type;
  }

  get start(): number | undefined {
    return this.props.start;
  }

  get end(): number | undefined {
    return this.props.end;
  }

  get countFromEnd(): boolean | undefined {
    return this.props.countFromEnd;
  }

  get historyType(): HistoryType {
    return this.props.historyType;
  }

  get userPromptBlocks(): PromptBlock[] | undefined {
    return this.props.userPromptBlocks;
  }

  get assistantPromptBlocks(): PromptBlock[] | undefined {
    return this.props.assistantPromptBlocks;
  }

  get role(): MessageRole | undefined {
    return this.props.role;
  }

  get promptBlocks(): PromptBlock[] | undefined {
    return this.props.promptBlocks;
  }

  get userMessageMapped(): string[] {
    const mapped = [];
    if (this.props.userMessageRole === HistoryMessageRole.User) {
      mapped.push("user");
    }
    if (this.props.charMessageRole === HistoryMessageRole.User) {
      mapped.push("char");
    }
    if (this.props.subCharMessageRole === HistoryMessageRole.User) {
      mapped.push("subChar");
    }
    return mapped;
  }

  get assistantMessageMapped(): string[] {
    const mapped = [];
    if (this.props.userMessageRole === HistoryMessageRole.Assistant) {
      mapped.push("user");
    }
    if (this.props.charMessageRole === HistoryMessageRole.Assistant) {
      mapped.push("char");
    }
    if (this.props.subCharMessageRole === HistoryMessageRole.Assistant) {
      mapped.push("subChar");
    }
    return mapped;
  }

  isSplit(): boolean {
    return this.historyType === HistoryType.Split;
  }

  isMerge(): boolean {
    return this.historyType === HistoryType.Merge;
  }

  public static create(
    props: CreateHistoryPromptMessageProps,
  ): Result<HistoryPromptMessage> {
    const requiredGuard = Guard.hasRequiredProps(props, ["historyType"]);

    if (requiredGuard.isFailure) {
      return formatFail(
        "Failed to create HistoryBlock",
        requiredGuard.getError(),
      );
    }

    const historyPromptMessage = new HistoryPromptMessage(
      {
        type: PromptMessageType.History,
        enabled: true, // Default to true
        ...props,
        createdAt: new Date(),
      },
      new UniqueEntityID(),
    );
    return Result.ok(historyPromptMessage);
  }

  public validate(): Result<void> {
    if (typeof this.start === "undefined" && this.end) {
      return Result.fail("Start is required if end is provided");
    }
    if (this.start && this.end && this.start >= this.end) {
      return Result.fail("Start must be less than end");
    }
    return Result.ok();
  }

  public addPromptBlock(
    promptBlock: PromptBlock,
    role?: MessageRole,
  ): Result<void> {
    if (this.isSplit()) {
      if (!role) {
        return Result.fail("Role is required for split history message");
      }
      if (role === "user") {
        this.props.userPromptBlocks?.push(promptBlock);
      } else if (role === "assistant") {
        this.props.assistantPromptBlocks?.push(promptBlock);
      } else {
        return Result.fail("Invalid role for split history message");
      }
    } else if (this.isMerge()) {
      this.props.promptBlocks?.push(promptBlock);
    } else {
      return Result.fail("Invalid history message type");
    }
    return Result.ok();
  }

  public deletePromptBlock(promptBlockId: UniqueEntityID): Result<void> {
    if (this.isSplit()) {
      const userIndex = this.props.userPromptBlocks?.findIndex((block) =>
        block.id.equals(promptBlockId),
      );
      const assistantIndex = this.props.assistantPromptBlocks?.findIndex(
        (block) => block.id.equals(promptBlockId),
      );
      if (userIndex !== -1 && userIndex !== undefined) {
        this.props.userPromptBlocks?.splice(userIndex, 1);
      } else if (assistantIndex !== -1 && assistantIndex !== undefined) {
        this.props.assistantPromptBlocks?.splice(assistantIndex, 1);
      } else {
        return Result.fail("Prompt block not found");
      }
    } else if (this.isMerge()) {
      const index = this.props.promptBlocks?.findIndex((promptBlock) =>
        promptBlock.id.equals(promptBlockId),
      );
      if (index === -1 || index === undefined) {
        return Result.fail("Prompt block not found");
      }
      this.props.promptBlocks?.splice(index, 1);
    } else {
      return Result.fail("Invalid history message type");
    }
    return Result.ok();
  }

  public update(props: UpdatePromptMessageProps): Result<void> {
    try {
      Object.assign(this.props, props);
      this.props.updatedAt = new Date();
      return Result.ok<void>();
    } catch (error) {
      return Result.fail(`Failed to update HistoryPromptMessage: ${error}`);
    }
  }

  public updatePromptBlock(
    blockId: UniqueEntityID,
    props: UpdateBlockProps,
  ): Result<void> {
    if (this.isMerge()) {
      if (!this.props.promptBlocks) {
        return Result.fail("Prompt blocks not found");
      }
      const index = this.props.promptBlocks.findIndex((b) =>
        b.id.equals(blockId),
      );
      if (index === -1) {
        return Result.fail("Block not found");
      }
      Object.assign(this.props.promptBlocks[index], props);
    } else if (this.isSplit()) {
      const role = this.props.role;
      const promptBlocks =
        role === "user"
          ? this.props.userPromptBlocks
          : this.props.assistantPromptBlocks;
      if (!promptBlocks) {
        return Result.fail("Prompt blocks not found for the specified role");
      }
      const index = promptBlocks.findIndex((b) => b.id.equals(blockId));
      if (index === -1) {
        return Result.fail("Block not found");
      }
      Object.assign(promptBlocks[index], props);
    } else {
      return Result.fail("Invalid history message type");
    }

    this.props.updatedAt = new Date();
    return Result.ok();
  }

  public movePromptBlock(
    promptBlockId: UniqueEntityID,
    newIndex: number,
    role?: MessageRole,
  ): Result<void> {
    if (this.isSplit()) {
      if (!role) {
        return Result.fail("Role is required for split history message");
      }
      const promptBlocks =
        role === "user"
          ? this.props.userPromptBlocks
          : this.props.assistantPromptBlocks;
      const index = promptBlocks?.findIndex((promptBlock) =>
        promptBlock.id.equals(promptBlockId),
      );
      if (index === -1 || index === undefined) {
        return Result.fail("Prompt block not found");
      }
      if (newIndex < 0 || !promptBlocks || newIndex >= promptBlocks.length) {
        return Result.fail("Invalid new index");
      }
      const promptBlock = promptBlocks.splice(index, 1)[0];
      promptBlocks.splice(newIndex, 0, promptBlock);
    } else if (this.isMerge()) {
      const promptBlocks = this.props.promptBlocks;
      const index = promptBlocks?.findIndex((promptBlock) =>
        promptBlock.id.equals(promptBlockId),
      );
      if (index === -1 || index === undefined) {
        return Result.fail("Prompt block not found");
      }
      if (newIndex < 0 || !promptBlocks || newIndex >= promptBlocks.length) {
        return Result.fail("Invalid new index");
      }
      const promptBlock = promptBlocks.splice(index, 1)[0];
      promptBlocks.splice(newIndex, 0, promptBlock);
    } else {
      return Result.fail("Invalid history message type");
    }
    return Result.ok();
  }

  // Add swapBlocks method to match PlainPromptMessage interface
  public swapBlocks(
    blockId1: UniqueEntityID,
    blockId2: UniqueEntityID,
  ): Result<void> {
    return this.swapPromptBlocks(blockId1, blockId2);
  }

  public swapPromptBlocks(
    blockId1: UniqueEntityID,
    blockId2: UniqueEntityID,
    role?: MessageRole,
  ): Result<void> {
    if (this.isSplit()) {
      if (!role) {
        return Result.fail("Role is required for split history message");
      }
      const promptBlocks =
        role === "user"
          ? this.props.userPromptBlocks
          : this.props.assistantPromptBlocks;
      if (!promptBlocks) {
        return Result.fail("Prompt blocks not found for the specified role");
      }
      const index1 = promptBlocks.findIndex((block) =>
        block.id.equals(blockId1),
      );
      const index2 = promptBlocks.findIndex((block) =>
        block.id.equals(blockId2),
      );
      if (index1 === -1 || index2 === -1) {
        return Result.fail("One or both blocks not found");
      }
      [promptBlocks[index1], promptBlocks[index2]] = [
        promptBlocks[index2],
        promptBlocks[index1],
      ];
    } else if (this.isMerge()) {
      if (!this.props.promptBlocks) {
        return Result.fail("Prompt blocks not found");
      }
      const index1 = this.props.promptBlocks.findIndex((block) =>
        block.id.equals(blockId1),
      );
      const index2 = this.props.promptBlocks.findIndex((block) =>
        block.id.equals(blockId2),
      );
      if (index1 === -1 || index2 === -1) {
        return Result.fail("One or both blocks not found");
      }
      [this.props.promptBlocks[index1], this.props.promptBlocks[index2]] = [
        this.props.promptBlocks[index2],
        this.props.promptBlocks[index1],
      ];
    } else {
      return Result.fail("Invalid history message type");
    }
    return Result.ok();
  }

  private getHistoryByRange(context: RenderContext): HistoryItem[] {
    // Check history in context
    if (!context.history || !Array.isArray(context.history)) {
      return [];
    }

    // History in context is oldest message first
    let history = context.history.slice();

    // If count from end, reverse history
    if (this.countFromEnd) {
      history = history.reverse();
    }

    // Slice history by range
    history = history.slice(this.start, this.end);

    // Reverse again to get the oldest message first
    if (this.countFromEnd) {
      history = history.reverse();
    }

    // Return history by range
    return history;
  }

  public async renderMessages(
    context: RenderContext,
  ): Promise<Result<Message[]>> {
    if (!this.props.enabled) {
      return Result.ok([]);
    }

    const history = this.getHistoryByRange(context);

    // Make char id-history role map
    const charIdHistoryRoleMap = new Map<string, MessageRole>();
    for (const char of context.cast.all ?? []) {
      // Prioritize main character (speaker) role over user role
      // When mainCharId === userId, the main char should be "assistant"
      if (char.id === context.char?.id && this.props.charMessageRole) {
        charIdHistoryRoleMap.set(char.id, this.props.charMessageRole);
      } else if (char.id === context.user?.id && this.props.userMessageRole) {
        charIdHistoryRoleMap.set(char.id, this.props.userMessageRole);
      } else if (this.props.subCharMessageRole) {
        charIdHistoryRoleMap.set(char.id, this.props.subCharMessageRole);
      }
    }

    const messages: Message[] = [];
    if (this.isSplit()) {
      for (const historyItem of history) {
        // Get history message role
        const messageRole = historyItem.char_id
          ? (charIdHistoryRoleMap.get(historyItem.char_id) ?? MessageRole.User)
          : MessageRole.User;
        if (!messageRole) {
          return Result.fail("Message role not found");
        }

        // Render blocks
        const blockContext = {
          ...context,
          turn: historyItem,
        };
        const blocks =
          messageRole === HistoryMessageRole.User
            ? (this.userPromptBlocks ?? [])
            : (this.assistantPromptBlocks ?? []);
        const renderBlockResults = await Promise.all(
          blocks.map((block) => block.renderMessages(blockContext)),
        );
        if (renderBlockResults.some((result) => result.isFailure)) {
          return Result.fail("Failed to render one or more prompt blocks");
        }

        // Merge rendered blocks
        const renderedMessages = renderBlockResults.flatMap((result) =>
          result.getValue(),
        );
        messages.push({
          role: messageRole,
          content: renderedMessages.map((message) => message.content).join(""),
        });
      }
    } else if (this.isMerge()) {
      // Render blocks
      const blockContext = { ...context, history };
      const renderBlockResults = this.promptBlocks?.map((block) =>
        block.renderMessages(blockContext),
      );
      if (!renderBlockResults) {
        return Result.fail("Failed to render prompt blocks");
      }
      if (renderBlockResults.some(async (result) => (await result).isFailure)) {
        return Result.fail("Failed to render one or more prompt blocks");
      }

      // Merge rendered blocks
      const renderedMessages = await Promise.all(
        renderBlockResults.map(async (result) => (await result).getValue()),
      );
      messages.push({
        role: this.role!,
        content: renderedMessages
          .flat()
          .map((message) => message.content)
          .join(""),
      });
    } else {
      return Result.fail("Invalid history message type");
    }

    return Result.ok(messages);
  }

  public getVariables(): string[] {
    return [];
  }

  public async renderPrompt(context: RenderContext): Promise<Result<string>> {
    if (!this.props.enabled) {
      return Result.ok("");
    }

    const history = this.getHistoryByRange(context);

    // Make char id-history role map
    const charIdHistoryRoleMap = new Map<string, MessageRole>();
    for (const char of context.cast.all ?? []) {
      // Prioritize main character (speaker) role over user role
      // When mainCharId === userId, the main char should be "assistant"
      if (char.id === context.char?.id && this.props.charMessageRole) {
        charIdHistoryRoleMap.set(char.id, this.props.charMessageRole);
      } else if (char.id === context.user?.id && this.props.userMessageRole) {
        charIdHistoryRoleMap.set(char.id, this.props.userMessageRole);
      } else if (this.props.subCharMessageRole) {
        charIdHistoryRoleMap.set(char.id, this.props.subCharMessageRole);
      }
    }

    let prompt = "";
    if (this.isSplit()) {
      for (const historyItem of history) {
        // Get history message role
        const messageRole = historyItem.char_id
          ? (charIdHistoryRoleMap.get(historyItem.char_id) ?? MessageRole.User)
          : MessageRole.User;
        if (!messageRole) {
          return Result.fail("Message role not found");
        }

        // Render blocks
        const blockContext = { ...context, turn: historyItem };
        const blocks =
          messageRole === HistoryMessageRole.User
            ? (this.userPromptBlocks ?? [])
            : (this.assistantPromptBlocks ?? []);
        const renderBlockResults = blocks.map((block) =>
          block.renderPrompt(blockContext),
        );
        if (
          renderBlockResults.some(async (result) => (await result).isFailure)
        ) {
          return Result.fail("Failed to render one or more prompt blocks");
        }

        // Merge rendered blocks
        const renderedPrompts = await Promise.all(
          renderBlockResults.map(async (result) => (await result).getValue()),
        );
        prompt += renderedPrompts.join("");
      }
    } else if (this.isMerge()) {
      // Render blocks
      const blockContext = { ...context, history };
      const renderBlockResults = this.promptBlocks?.map((block) =>
        block.renderPrompt(blockContext),
      );
      if (!renderBlockResults) {
        return Result.fail("Failed to render prompt blocks");
      }
      if (renderBlockResults.some(async (result) => (await result).isFailure)) {
        return Result.fail("Failed to render one or more prompt blocks");
      }

      // Merge rendered blocks
      const renderedPrompts = await Promise.all(
        renderBlockResults.map(async (result) => (await result).getValue()),
      );
      prompt = renderedPrompts.join("");
    } else {
      return Result.fail("Invalid history message type");
    }

    return Result.ok(prompt);
  }

  // TODO: remove this method
  public toJSON(): any {
    return {
      ...this.props,
      userPromptBlocks: this.props.userPromptBlocks?.map((block) =>
        block.toJSON(),
      ),
      assistantPromptBlocks: this.props.assistantPromptBlocks?.map((block) =>
        block.toJSON(),
      ),
      promptBlocks: this.props.promptBlocks?.map((block) => block.toJSON()),
      id: this.id.toValue(),
    };
  }

  // TODO: remove this method
  public static fromJSON(json: any): Result<HistoryPromptMessage> {
    try {
      const promptMessage = new HistoryPromptMessage(
        {
          type: PromptMessageType.History,
          enabled: json.enabled ?? true,
          historyType: json.historyType,
          start: json.start,
          end: json.end,
          countFromEnd: json.countFromEnd,
          userPromptBlocks: json.userPromptBlocks?.map((block: any) =>
            parsePromptBlock(block).getValue(),
          ),
          assistantPromptBlocks: json.assistantPromptBlocks?.map((block: any) =>
            parsePromptBlock(block).getValue(),
          ),
          userMessageRole: json.userMessageRole ?? HistoryMessageRole.User,
          charMessageRole: json.charMessageRole ?? HistoryMessageRole.Assistant,
          subCharMessageRole:
            json.subCharMessageRole ?? HistoryMessageRole.User,
          role: json.role,
          promptBlocks: json.promptBlocks?.map((block: any) =>
            parsePromptBlock(block).getValue(),
          ),
          createdAt: json.createdAt ? new Date(json.createdAt) : new Date(),
          updatedAt: json.updatedAt ? new Date(json.updatedAt) : undefined,
        },
        new UniqueEntityID(json.id),
      );

      const validationResult = promptMessage.validate();
      if (validationResult.isFailure) {
        return Result.fail(validationResult.getError());
      }

      return Result.ok(promptMessage);
    } catch (error) {
      return Result.fail<HistoryPromptMessage>(
        `Failed to create history prompt message from JSON: ${error}`,
      );
    }
  }

  get [Symbol.toStringTag](): string {
    return "HistoryPromptMessage";
  }

  static isHistoryPromptMessage(obj: any): obj is HistoryPromptMessage {
    return (
      obj instanceof HistoryPromptMessage ||
      (obj &&
        Object.prototype.toString.call(obj) === "[object HistoryPromptMessage]")
    );
  }
}

registerCustom<HistoryPromptMessage, string>(
  {
    isApplicable: (v): v is HistoryPromptMessage =>
      HistoryPromptMessage.isHistoryPromptMessage(v),
    serialize: (v) => JSON.stringify(v.toJSON()),
    deserialize: (v) => HistoryPromptMessage.fromJSON(JSON.parse(v)).getValue(),
  },
  "HistoryPromptMessage",
);
