// TODO: remove this file

import { registerCustom } from "superjson";

import { Result } from "@/shared/core";
import { UniqueEntityID, ValueObject } from "@/shared/domain";
import { PromptAndModelJsonMapper } from "@/shared/task/mappers/prompt-and-model-json-mapper";

import { ApiConnection, ApiSource } from "@/entities/api/domain";

export const TokenizerType = {
  OpenAI: "openai",
  Gemini: "gemini",
  Claude: "claude",
  Llama_3: "llama_3",
  Command_R_Plus: "command_r_plus",
  Qwen_2_5: "qwen_2_5",
} as const;

export type TokenizerType = (typeof TokenizerType)[keyof typeof TokenizerType];

export const tokenizerTypeLabel = new Map<TokenizerType, string>([
  [TokenizerType.OpenAI, "OpenAI"],
  [TokenizerType.Gemini, "Gemini"],
  [TokenizerType.Claude, "Claude"],
  [TokenizerType.Llama_3, "Llama 3"],
  [TokenizerType.Command_R_Plus, "Command R+"],
  [TokenizerType.Qwen_2_5, "Qwen 2.5"],
]);

export const apiSourceTokenizerTypeMap = new Map<ApiSource, TokenizerType>([
  [ApiSource.OpenAI, TokenizerType.OpenAI],
  [ApiSource.GoogleGenerativeAI, TokenizerType.Gemini],
  [ApiSource.Anthropic, TokenizerType.Claude],
]);

export interface PromptAndModelProps {
  // Prompt
  promptId?: UniqueEntityID;

  // API Model
  apiConnectionId?: UniqueEntityID;
  apiSource?: ApiSource;
  modelId?: string;
  modelName?: string;
  tokenizerType?: TokenizerType;
  openrouterProvider?: string;

  // Pinned Model
  pinnedModelId?: UniqueEntityID;
}

export class PromptAndModel extends ValueObject<PromptAndModelProps> {
  get promptId(): UniqueEntityID | undefined {
    return this.props.promptId;
  }

  get apiConnectionId(): UniqueEntityID | undefined {
    return this.props.apiConnectionId;
  }

  get apiSource(): ApiSource | undefined {
    return this.props.apiSource;
  }

  get modelId(): string | undefined {
    return this.props.modelId;
  }

  get modelName(): string | undefined {
    return this.props.modelName;
  }

  get tokenizerType(): TokenizerType | undefined {
    return this.props.tokenizerType;
  }

  get openrouterProvider(): string | undefined {
    return this.props.openrouterProvider;
  }

  get pinnedModelId(): UniqueEntityID | undefined {
    return this.props.pinnedModelId;
  }

  public static create(props: PromptAndModelProps): Result<PromptAndModel> {
    return Result.ok(new PromptAndModel(props));
  }

  public withPromptId(promptId?: UniqueEntityID): Result<PromptAndModel> {
    return PromptAndModel.create({
      ...this.props,
      promptId: promptId,
    });
  }

  public withApiConnection(
    apiConnection?: ApiConnection,
  ): Result<PromptAndModel> {
    return PromptAndModel.create({
      ...this.props,
      apiConnectionId: apiConnection?.id,
      apiSource: apiConnection?.source,
    });
  }

  public withModelId(modelId?: string): Result<PromptAndModel> {
    return PromptAndModel.create({
      ...this.props,
      modelId,
    });
  }

  public withModelName(modelName?: string): Result<PromptAndModel> {
    return PromptAndModel.create({
      ...this.props,
      modelName,
    });
  }

  public withTokenizerType(
    tokenizerType?: TokenizerType,
  ): Result<PromptAndModel> {
    return PromptAndModel.create({
      ...this.props,
      tokenizerType,
    });
  }

  public withOpenRouterProvider(
    openrouterProvider?: string,
  ): Result<PromptAndModel> {
    return PromptAndModel.create({
      ...this.props,
      openrouterProvider: openrouterProvider,
    });
  }

  get [Symbol.toStringTag](): string {
    return "PromptAndModel";
  }

  static isPromptAndModel(obj: any): obj is PromptAndModel {
    return (
      obj instanceof PromptAndModel ||
      (obj && Object.prototype.toString.call(obj) === "[object PromptAndModel]")
    );
  }
}

registerCustom<PromptAndModel, string>(
  {
    isApplicable: (v): v is PromptAndModel =>
      PromptAndModel.isPromptAndModel(v),
    serialize: (v) => JSON.stringify(PromptAndModelJsonMapper.toPersistence(v)),
    deserialize: (v) => PromptAndModelJsonMapper.toDomain(JSON.parse(v)),
  },
  "PromptAndModel",
);
