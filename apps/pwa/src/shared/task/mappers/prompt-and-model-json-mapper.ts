// TODO: remove this file

import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import {
  PromptAndModel,
  TokenizerType,
} from "@/shared/task/domain/prompt-and-model";
import { logger } from "@/shared/lib/logger";

import { ApiSource } from "@/modules/api/domain";

export interface PromptAndModelJson {
  // Prompt
  promptId?: string;

  // API Model
  apiConnectionId?: string;
  apiSource?: string;
  modelId?: string;
  modelName?: string;
  tokenizerType?: string;
  openrouterProvider?: string;

  // Pinned Model
  pinnedModelId?: string;
}

export class PromptAndModelJsonMapper {
  private constructor() {}

  public static toDomain(json: PromptAndModelJson): PromptAndModel {
    // Create prompt and model
    const promptAndModelOrError = PromptAndModel.create({
      promptId: json.promptId ? new UniqueEntityID(json.promptId) : undefined,
      apiConnectionId: json.apiConnectionId
        ? new UniqueEntityID(json.apiConnectionId)
        : undefined,
      apiSource: json.apiSource as ApiSource,
      modelId: json.modelId,
      modelName: json.modelName,
      tokenizerType: json.tokenizerType as TokenizerType,
      openrouterProvider: json.openrouterProvider,
      pinnedModelId: json.pinnedModelId
        ? new UniqueEntityID(json.pinnedModelId)
        : undefined,
    });

    // Check error
    if (promptAndModelOrError.isFailure) {
      logger.error(promptAndModelOrError.getError());
      throw new Error(promptAndModelOrError.getError());
    }
    // Return prompt and model
    return promptAndModelOrError.getValue();
  }

  public static toPersistence(domain: PromptAndModel): PromptAndModelJson {
    return {
      promptId: domain.promptId?.toString(),
      apiConnectionId: domain.apiConnectionId?.toString(),
      apiSource: domain.apiSource,
      modelId: domain.modelId,
      modelName: domain.modelName,
      tokenizerType: domain.tokenizerType,
      openrouterProvider: domain.openrouterProvider,
      pinnedModelId: domain.pinnedModelId?.toString(),
    };
  }
}
