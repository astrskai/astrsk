import { JSONSchema7, JSONSchema7Definition } from "json-schema";

import { Guard, Result } from "@/shared/core";
import { AggregateRoot, UniqueEntityID } from "@/shared/domain";
import { Message, Renderable, RenderContext } from "@/shared/prompt/domain";
import { parameterMap } from "@/shared/task/domain/parameter";

import {
  parsePromptMessage,
  PromptBlock,
  PromptMessage,
  UpdateBlockProps,
  UpdatePromptMessageProps,
} from "@/modules/agent/domain";
import { ApiSource } from "@/modules/api/domain";

export enum ApiType {
  Chat = "chat",
  Text = "text",
}

export enum OutputFormat {
  StructuredOutput = "structured_output",
  TextOutput = "text_output",
}

export enum SchemaFieldType {
  String = "string",
  Integer = "integer",
  Number = "number",
  Boolean = "boolean",
  Enum = "enum",
}

export type SchemaField = {
  name: string;
  description?: string;
  required: boolean;
  array: boolean;
  type: SchemaFieldType;
  minimum?: number;
  exclusiveMinimum?: boolean;
  maximum?: number;
  exclusiveMaximum?: boolean;
  pattern?: string;
  enum?: string[];
  multipleOf?: number;
};

export interface AgentDependency {
  agentId: string;
  requiredFields: string[]; // Fields required from the dependent agent's output
}

export interface AgentProps {
  // Metadata
  name: string;
  description: string;

  // API Connection
  targetApiType: ApiType;
  apiSource?: ApiSource;
  modelId?: string;
  modelName?: string;

  // Prompts - separated by completion type
  promptMessages: PromptMessage[]; // For chat completion
  textPrompt?: string; // For text completion

  // Parameters
  enabledParameters: Map<string, boolean>;
  parameterValues: Map<string, any>;

  // Structured Output
  enabledStructuredOutput: boolean;
  outputFormat?: OutputFormat; // New field for output format selection
  outputStreaming?: boolean;
  schemaName?: string;
  schemaDescription?: string;
  schemaFields?: SchemaField[];

  tokenCount: number;

  // Visual properties
  color: string;

  // Set by System
  createdAt: Date;
  updatedAt: Date;
}

export type CreateAgentProps = Partial<AgentProps>;
export type UpdateAgentProps = Partial<CreateAgentProps>;

export class Agent extends AggregateRoot<AgentProps> implements Renderable {
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public static create(
    props: CreateAgentProps,
    id?: UniqueEntityID,
  ): Result<Agent> {
    const nullGuard = Guard.againstNullOrUndefinedBulk([
      { argument: props.name, argumentName: "name" },
      { argument: props.targetApiType, argumentName: "targetApiType" },
    ]);
    if (nullGuard.isFailure) {
      return Result.fail<Agent>(nullGuard.getError());
    }

    // Additional check for empty string names
    if (props.name !== undefined && props.name.trim() === "") {
      return Result.fail<Agent>("Agent name cannot be empty");
    }

    const agent = new Agent(
      {
        // Default values for required props
        name: "New Agent",
        description: "",
        targetApiType: ApiType.Chat,
        apiSource: undefined,
        modelId: undefined,
        modelName: undefined,
        promptMessages: [],
        textPrompt: "",
        enabledParameters: new Map<string, boolean>(),
        parameterValues: new Map<string, any>(),
        enabledStructuredOutput: false,
        outputFormat: OutputFormat.TextOutput, // Default to text output
        outputStreaming: true,
        schemaName: "response",
        schemaFields: [],
        tokenCount: 0,
        color: "#A5B4FC", // Default blue color

        // Fixed values & Set by system
        createdAt: new Date(),
        updatedAt: new Date(),

        // Spread input props
        ...props,
      },
      id,
    );

    return Result.ok<Agent>(agent);
  }

  public update(props: UpdateAgentProps): Result<Agent> {
    try {
      Object.assign(this.props, { ...props });
      this.props.updatedAt = new Date();
      return Result.ok(this);
    } catch (error) {
      return Result.fail<Agent>(`Failed to update agent: ${error}`);
    }
  }

  public addMessage(message: PromptMessage): Result<void> {
    this.props.promptMessages.push(message);
    return Result.ok<void>();
  }

  public addPromptBlockToMessage(
    promptBlock: PromptBlock,
    messageId1: UniqueEntityID,
  ): Result<void> {
    const messageIndex = this.props.promptMessages.findIndex((msg) =>
      msg.id.equals(messageId1),
    );
    if (messageIndex === -1) {
      return Result.fail<void>("Message not found");
    }

    const message = this.props.promptMessages[messageIndex];

    message.addPromptBlock(promptBlock);

    return Result.ok<void>();
  }

  public swapMessages(
    messageId1: UniqueEntityID,
    messageId2: UniqueEntityID,
  ): Result<void> {
    const message1Index = this.props.promptMessages.findIndex((message) =>
      message.id.equals(messageId1),
    );
    const message2Index = this.props.promptMessages.findIndex((message) =>
      message.id.equals(messageId2),
    );

    if (message1Index === -1 || message2Index === -1) {
      return Result.fail<void>("Message not found");
    }

    const message1 = this.props.promptMessages[message1Index];
    const message2 = this.props.promptMessages[message2Index];
    this.props.promptMessages[message1Index] = message2;
    this.props.promptMessages[message2Index] = message1;

    return Result.ok<void>();
  }

  public swapBlocks(
    messageId: UniqueEntityID,
    blockId1: UniqueEntityID,
    blockId2: UniqueEntityID,
  ): Result<void> {
    const messageIndex = this.props.promptMessages.findIndex((message) =>
      message.id.equals(messageId),
    );
    if (messageIndex === -1) {
      return Result.fail<void>("Message not found");
    }

    const message = this.props.promptMessages[messageIndex];
    return message.swapBlocks(blockId1, blockId2);
  }

  public updateMessage(
    messageId: UniqueEntityID,
    props: UpdatePromptMessageProps,
  ) {
    const message = this.props.promptMessages.find((message) =>
      message.id.equals(messageId),
    );
    if (!message) {
      return Result.fail<void>("Message not found");
    }

    message.update(props);

    return Result.ok<void>();
  }

  public updateBlock(
    messageId: UniqueEntityID,
    blockId: UniqueEntityID,
    props: UpdateBlockProps,
  ) {
    const message = this.props.promptMessages.find((message) =>
      message.id.equals(messageId),
    );
    if (!message) {
      return Result.fail<void>("Message not found");
    }
    return message.updatePromptBlock(blockId, props);
  }

  public deleteMessage(messageId: UniqueEntityID) {
    const messageIndex = this.props.promptMessages.findIndex((message) =>
      message.id.equals(messageId),
    );
    if (messageIndex === -1) {
      return Result.fail<void>("Message not found");
    }

    this.props.promptMessages = this.props.promptMessages.filter(
      (message) => !message.id.equals(messageId),
    );
  }

  public deleteBlock(messageId: UniqueEntityID, blockId: UniqueEntityID) {
    const message = this.props.promptMessages.find((message) =>
      message.id.equals(messageId),
    );
    if (!message) {
      return Result.fail<void>("Message not found");
    }
    return message.deletePromptBlock(blockId);
  }

  public async renderMessages(
    context: RenderContext,
  ): Promise<Result<Message[]>> {
    const enabledMessages = this.props.promptMessages.filter(
      (message) => message.props.enabled !== false,
    );

    const messagesOrError: Result<Message[]>[] = await Promise.all(
      enabledMessages.map((message) => message.renderMessages(context)),
    );

    const messages = messagesOrError
      .map((message) => {
        if (message.isFailure) {
          return [];
        }
        return message.getValue();
      })
      .reduce((acc: Message[], val) => acc.concat(val), []);

    return Result.ok<Message[]>(messages);
  }

  public async renderPrompt(context: RenderContext): Promise<Result<string>> {
    // For text completion, use textPrompt field directly
    if (this.props.targetApiType === ApiType.Text) {
      return Result.ok<string>(this.props.textPrompt || "");
    }
    
    // For chat completion, use promptMessages
    const enabledMessages = this.props.promptMessages.filter(
      (message) => message.props.enabled !== false,
    );

    const promptsOrError: Result<string>[] = await Promise.all(
      enabledMessages.map((message) => message.renderPrompt(context)),
    );

    const prompts = promptsOrError
      .map((prompt) => {
        if (prompt.isFailure) {
          return "";
        }
        return prompt.getValue();
      })
      .join("");
    return Result.ok<string>(prompts);
  }

  public getVariables(): string[] {
    return Array.from(
      new Set(
        this.props.promptMessages.flatMap((message) => message.getVariables()),
      ),
    );
  }

  public toggleParameter(parameter: string, enabled: boolean): Result<void> {
    this.props.enabledParameters.set(parameter, enabled);
    return Result.ok<void>();
  }

  public setParameterValue(parameter: string, value: any): Result<void> {
    this.props.parameterValues.set(parameter, value);
    return Result.ok<void>();
  }

  public restoreAllParametersDefault(): Result<void> {
    this.props.enabledParameters.forEach((enabled, parameter) => {
      if (enabled && parameterMap.has(parameter)) {
        this.props.parameterValues.set(
          parameter,
          parameterMap.get(parameter)?.default,
        );
      }
    });

    return Result.ok<void>();
  }

  public get parameters(): Map<string, any> {
    const parameters = new Map<string, any>();
    this.props.enabledParameters.forEach((enabled, parameter) => {
      if (enabled && this.props.parameterValues.has(parameter)) {
        parameters.set(parameter, this.props.parameterValues.get(parameter));
      }
    });
    return parameters;
  }

  public getSchemaTypeDef({
    apiSource,
  }: {
    apiSource?: ApiSource;
  }): JSONSchema7 {
    return {
      type: "object",
      properties: Object.fromEntries(
        this.props.schemaFields?.map((field) => {
          const key = field.name;
          let value: JSONSchema7Definition;
          switch (field.type) {
            case SchemaFieldType.String:
              value = {
                type: "string",
                minLength: field.minimum,
                maxLength: field.maximum,
                pattern: field.pattern,
              };
              break;
            case SchemaFieldType.Integer:
            case SchemaFieldType.Number:
              value = {
                type: field.type,
                minimum: field.exclusiveMinimum ? undefined : field.minimum,
                exclusiveMinimum: field.exclusiveMinimum
                  ? field.minimum
                  : undefined,
                maximum: field.exclusiveMaximum ? undefined : field.maximum,
                exclusiveMaximum: field.exclusiveMaximum
                  ? field.maximum
                  : undefined,
                multipleOf: field.multipleOf,
              };
              break;
            case SchemaFieldType.Boolean:
              return [field.name, { type: "boolean" }];
            case SchemaFieldType.Enum:
              if (apiSource === ApiSource.GoogleGenerativeAI) {
                value = {
                  type: "string",
                  enum: field.enum,
                };
              } else {
                value = {
                  enum: field.enum,
                };
              }
              break;
            default:
              throw new Error(`Unsupported schema field type: ${field.type}`);
          }
          if (field.description) {
            value = {
              ...value,
              description: field.description,
            };
          }
          return [
            key,
            field.array
              ? {
                  type: "array",
                  items: value,
                }
              : value,
          ];
        }) ?? [],
      ),
      additionalProperties: false,
      required:
        this.props.schemaFields
          ?.filter((field) => field.required)
          .map((field) => field.name) ?? [],
    };
  }

  public toJSON(): any {
    return {
      ...this.props,
      promptMessages: this.props.promptMessages.map((message) =>
        message.toJSON ? message.toJSON() : message,
      ),
      enabledParameters: Object.fromEntries(this.props.enabledParameters),
      parameterValues: Object.fromEntries(this.props.parameterValues),
    };
  }

  public static fromJSON(json: any): Result<Agent> {
    try {
      const agent = new Agent(
        {
          name: json.name,
          description: json.description,

          targetApiType: json.targetApiType,
          apiSource: json.apiSource ?? undefined,
          modelId: json.modelId ?? undefined,
          modelName: json.modelName ?? undefined,

          promptMessages:
            json.promptMessages?.map((message: any) =>
              parsePromptMessage(message).getValue(),
            ) || [],
          textPrompt: json.textPrompt ?? "",

          enabledParameters: new Map<string, boolean>(
            Object.entries(json.enabledParameters ?? {}),
          ),
          parameterValues: new Map<string, any>(
            Object.entries(json.parameterValues ?? {}),
          ),

          enabledStructuredOutput: json.enabledStructuredOutput ?? false,
          outputFormat: json.outputFormat ?? OutputFormat.TextOutput,
          outputStreaming: json.outputStreaming ?? true,
          schemaName: json.schemaName ?? "response",
          schemaDescription: json.schemaDescription,
          schemaFields: json.schemaFields ?? [
            {
              name: "new_field",
              description: "",
              required: true,
              array: false,
              type: SchemaFieldType.String,
              enum: [""],
            },
          ],

          tokenCount: json.tokenCount ?? 0,
          color: json.color ?? "#A5B4FC", // indigo-300

          createdAt: json.createdAt ? new Date(json.createdAt) : new Date(),
          updatedAt: json.updatedAt ? new Date(json.updatedAt) : new Date(),
        },
        json._id || json.id
          ? new UniqueEntityID(json._id || json.id)
          : new UniqueEntityID(),
      );

      return Result.ok<Agent>(agent);
    } catch (error) {
      return Result.fail<Agent>(`Failed to create agent from JSON: ${error}`);
    }
  }
}
