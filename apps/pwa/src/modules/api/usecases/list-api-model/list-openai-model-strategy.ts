import { Result } from "@/shared/core/result";
import { OpenAIEndpoint } from "@/shared/endpoints/openai";
import { HttpClient } from "@/shared/infra";
import { formatFail } from "@/shared/lib/error-utils";

import { ApiConnection, ApiModel } from "@/modules/api/domain";
import { ListApiModelStrategy } from "@/modules/api/usecases/list-api-model/list-api-model-strategy";

// Source: https://platform.openai.com/docs/models
const filterRegexs = [
  // Audio models
  /audio/,
  /whisper/,
  /realtime/,
  /transcribe/,
  /tts/,

  // Image models
  /image/,
  /dall-e/,

  // Embedding models
  /embedding/,

  // Moderation models
  /moderation/,

  // Tool-specific models
  /search/,
  /computer-use/,

  // Old models
  /babbage/,
  /davinci/,
];

export class ListOpenaiModelStrategy implements ListApiModelStrategy {
  constructor(private httpClient: HttpClient) {}

  async listApiModel(
    apiConnection: ApiConnection,
  ): Promise<Result<ApiModel[]>> {
    try {
      if (!apiConnection.props.apiKey) {
        throw new Error("API key is missing for OpenAI connection");
      }

      const openAIEndpoint = new OpenAIEndpoint(
        this.httpClient,
        apiConnection.props.apiKey,
      );

      const modelList = await openAIEndpoint.getAvailableModelList();
      return Result.ok(
        modelList.filter(
          (model) => !filterRegexs.some((regex) => regex.test(model.id)),
        ),
      );
    } catch (error) {
      return formatFail("Failed to list OpenAI model", error);
    }
  }
}
