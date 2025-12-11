import { Result } from "@/shared/core/result";

import { ApiConnection } from "@/entities/api/domain/api-connection";
import { ApiModel } from "@/entities/api/domain/api-model";
import { ListApiModelStrategy } from "@/entities/api/usecases/list-api-model/list-api-model-strategy";

// Hardcoded available models for Astrsk Cloud LLM
const ASTRSK_CLOUD_MODELS = [
  {
    id: "openai-compatible:deepseek/deepseek-chat",
    name: "DeepSeek Official (Default)",
  },
  {
    id: "openai-compatible:deepseek-ai/DeepSeek-V3.1",
    name: "DeepSeek V3.1 (Friendli)",
  },
  {
    id: "openai-compatible:google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
  },
  {
    id: "openai-compatible:google/gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
  },
  {
    id: "openai-compatible:google/gemini-3-pro",
    name: "Gemini 3 Pro",
  },
  {
    id: "openai-compatible:zai-org/GLM-4.6",
    name: "GLM-4.6 (Friendli)",
  },
  {
    id: "openai-compatible:glm-4.6",
    name: "GLM-4.6 (Official API)",
  },
  {
    id: "openai-compatible:byteplus/deepseek-v3-1",
    name: "DeepSeek V3.1 (BytePlus)",
  },
  {
    id: "openai-compatible:byteplus/oss-120b",
    name: "OSS 120B (BytePlus)",
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
