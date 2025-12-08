import { Result } from "@/shared/core/result";

import { ApiConnection } from "@/entities/api/domain/api-connection";
import { ApiModel } from "@/entities/api/domain/api-model";
import { ListApiModelStrategy } from "@/entities/api/usecases/list-api-model/list-api-model-strategy";

// Hardcoded available models for Astrsk Cloud LLM
const ASTRSK_CLOUD_MODELS = [
  {
    id: "openai-compatible:deepseek/deepseek-chat",
    name: "DeepSeek Chat",
  },
];

export class ListAstrskaiModelStrategy implements ListApiModelStrategy {
  async listApiModel(
    _apiConnection: ApiConnection,
  ): Promise<Result<ApiModel[]>> {
    // Always return hardcoded models - if the astrsk.ai connection exists,
    // it means the provider is enabled. Runtime URL check happens in session-play-service.
    return Result.ok(
      ASTRSK_CLOUD_MODELS.map((model) =>
        ApiModel.create({
          id: model.id,
          name: model.name,
        }).getValue(),
      ),
    );
  }
}
