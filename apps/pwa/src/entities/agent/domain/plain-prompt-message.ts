import { Result } from "@/shared/core";
import { Entity, UniqueEntityID } from "@/shared/domain";
import {
  Message,
  MessageRole,
  parsePromptBlock,
  Renderable,
  RenderContextWithVariables,
} from "@/shared/prompt/domain";

import {
  PromptBlock,
  PromptMessageProps,
  PromptMessageType,
  UpdateBlockProps,
  UpdatePromptMessageProps,
} from "@/entities/agent/domain";
import { registerCustom } from "superjson";

export interface PlainPromptMessageProps {
  role: MessageRole;
  promptBlocks: PromptBlock[]; // TODO: migrate `blocks`
}

export type CreatePlainPromptMessageProps = PlainPromptMessageProps & {
  enabled?: boolean;
};
export type UpdatePlainPromptMessageProps =
  Partial<CreatePlainPromptMessageProps>;

export class PlainPromptMessage
  extends Entity<PromptMessageProps & PlainPromptMessageProps>
  implements Renderable
{
  get role(): MessageRole {
    return this.props.role;
  }

  get promptBlocks(): PromptBlock[] {
    return this.props.promptBlocks;
  }

  public static create(
    props: CreatePlainPromptMessageProps,
  ): Result<PlainPromptMessage> {
    const message = new PlainPromptMessage(
      {
        type: PromptMessageType.Plain,
        enabled: true, // Default to true
        ...props,
        createdAt: new Date(),
      },
      new UniqueEntityID(),
    );
    const validationResult = message.validate();
    if (validationResult.isFailure) {
      return Result.fail(validationResult.getError());
    }
    return Result.ok(message);
  }

  public validate(): Result<void> {
    if (!this.props.role) {
      return Result.fail("Role is required");
    }
    return Result.ok();
  }

  public addPromptBlock(promptBlock: PromptBlock): Result<void> {
    this.props.promptBlocks.push(promptBlock);
    return Result.ok();
  }

  public deletePromptBlock(blockId: UniqueEntityID): Result<void> {
    const index = this.props.promptBlocks.findIndex((promptBlocks) =>
      promptBlocks.id.equals(blockId),
    );
    if (index === -1) {
      return Result.fail("Block not found");
    }
    this.props.promptBlocks.splice(index, 1);
    return Result.ok();
  }

  public update(props: UpdatePromptMessageProps): Result<void> {
    try {
      Object.assign(this.props, props);
      this.props.updatedAt = new Date();
      return Result.ok<void>();
    } catch (error) {
      return Result.fail(`Failed to update PlainPromptMessage: ${error}`);
    }
  }

  public updatePromptBlock(
    blockId: UniqueEntityID,
    props: UpdateBlockProps,
  ): Result<void> {
    const index = this.props.promptBlocks.findIndex((b) =>
      b.id.equals(blockId),
    );
    if (index === -1) {
      return Result.fail("Block not found");
    }
    Object.assign(this.props.promptBlocks[index], props);
    this.props.updatedAt = new Date();
    return Result.ok();
  }

  public swapBlocks(
    blockId1: UniqueEntityID,
    blockId2: UniqueEntityID,
  ): Result<void> {
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

    return Result.ok();
  }

  public movePromptBlock(
    blockId: UniqueEntityID,
    newIndex: number,
  ): Result<void> {
    const index = this.props.promptBlocks.findIndex((block) =>
      block.id.equals(blockId),
    );
    if (index === -1) {
      return Result.fail("Block not found");
    }
    if (newIndex < 0 || newIndex >= this.props.promptBlocks.length) {
      return Result.fail("Invalid new index");
    }
    const block = this.props.promptBlocks.splice(index, 1)[0];
    this.props.promptBlocks.splice(newIndex, 0, block);
    return Result.ok();
  }

  public async renderMessages(
    context: RenderContextWithVariables,
  ): Promise<Result<Message[]>> {
    if (!this.props.enabled) {
      return Result.ok([]);
    }

    const results = await Promise.all(
      this.props.promptBlocks.map((block) => block.renderMessages(context)),
    );
    if (results.some((result) => result.isFailure)) {
      return Result.fail<Message[]>(
        "Failed to render one or more prompt blocks",
      );
    }

    const messages = results
      .flatMap((result) => result.getValue())
      .filter((message) => message.content !== "");
    return Result.ok<Message[]>(
      messages.length === 0
        ? []
        : [
            {
              role: this.props.role,
              content: messages.map((m) => m.content).join(""),
            },
          ],
    );
  }

  public async renderPrompt(
    context: RenderContextWithVariables,
  ): Promise<Result<string>> {
    if (!this.props.enabled) {
      return Result.ok("");
    }

    const results = await Promise.all(
      this.props.promptBlocks.map((block) => block.renderPrompt(context)),
    );
    if (results.some((result) => result.isFailure)) {
      return Result.fail<string>("Failed to render one or more prompt blocks");
    }

    const promptStrings = results
      .map((result) => result.getValue())
      .filter((prompt) => prompt !== "");
    return Result.ok<string>(promptStrings.join(""));
  }

  public getVariables(): string[] {
    return this.props.promptBlocks.flatMap((block) => block.getVariables());
  }

  public toJSON(): any {
    return {
      ...this.props,
      id: this.id.toString(),
      promptBlocks: this.promptBlocks
        .filter((block): block is PromptBlock => block != null)
        .map((block) => block.toJSON()),
    };
  }

  public static fromJSON(json: any): Result<PlainPromptMessage> {
    const message = new PlainPromptMessage(
      {
        type: PromptMessageType.Plain,
        enabled: json.enabled ?? true,
        role: json.role,
        promptBlocks: json.promptBlocks.map((block: any) =>
          parsePromptBlock(block).getValue(),
        ),
        createdAt: json.createdAt ? new Date(json.createdAt) : new Date(),
        updatedAt: json.updatedAt ? new Date(json.updatedAt) : undefined,
      },
      new UniqueEntityID(json.id),
    );
    const validationResult = message.validate();
    if (validationResult.isFailure) {
      return Result.fail(validationResult.getError());
    }

    return Result.ok(message);
  }

  get [Symbol.toStringTag](): string {
    return "PlainPromptMessage";
  }

  static isPlainPromptMessage(obj: any): obj is PlainPromptMessage {
    return (
      obj instanceof PlainPromptMessage ||
      (obj &&
        Object.prototype.toString.call(obj) === "[object PlainPromptMessage]")
    );
  }
}

registerCustom<PlainPromptMessage, string>(
  {
    isApplicable: (v): v is PlainPromptMessage =>
      PlainPromptMessage.isPlainPromptMessage(v),
    serialize: (v) => JSON.stringify(v.toJSON()),
    deserialize: (v) => PlainPromptMessage.fromJSON(JSON.parse(v)).getValue(),
  },
  "PlainPromptMessage",
);
