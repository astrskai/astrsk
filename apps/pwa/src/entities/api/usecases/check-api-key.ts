import { Result } from "@/shared/core/result";
import { UseCase } from "@/shared/core/use-case";
import { HttpClient } from "@/shared/infra/http-client";
import { formatFail } from "@/shared/lib";

import { ApiConnection, ApiSource } from "@/entities/api/domain";
import { ListAIHordeModelStrategy } from "@/entities/api/usecases/list-api-model/list-aihorde-model-strategy";
import { ListAnthropicModelStrategy } from "@/entities/api/usecases/list-api-model/list-anthropic-model-strategy";
import { ListApiModelStrategy } from "@/entities/api/usecases/list-api-model/list-api-model-strategy";
import { ListDeepseekModelStrategy } from "@/entities/api/usecases/list-api-model/list-deepseek-model-strategy";
import { ListDummyModelStrategy } from "@/entities/api/usecases/list-api-model/list-dummy-model-strategy";
import { ListGoogleGenerativeAIModelStrategy } from "@/entities/api/usecases/list-api-model/list-google-generative-ai-model-strategy";
import { ListKoboldModelStrategy } from "@/entities/api/usecases/list-api-model/list-koboldcpp-model-strategy";
import { ListMistralModelStrategy } from "@/entities/api/usecases/list-api-model/list-mistral-model-strategy";
import { ListOllamaModelStrategy } from "@/entities/api/usecases/list-api-model/list-ollama-model-strategy";
import { ListOpenaiCompatibleModelStrategy } from "@/entities/api/usecases/list-api-model/list-openai-compatible-model-strategy";
import { ListOpenaiModelStrategy } from "@/entities/api/usecases/list-api-model/list-openai-model-strategy";
import { ListOpenrouterModelStrategy } from "@/entities/api/usecases/list-api-model/list-openrouter-model-strategy";
import { ListWllamaModelStrategy } from "@/entities/api/usecases/list-api-model/list-wllama-model-strategy";
import { ListXaiModelStrategy } from "@/entities/api/usecases/list-api-model/list-xai-model-strategy";
import { ListCohereModelStrategy } from "@/entities/api/usecases/list-api-model/list-cohere-model-strategy";

export class CheckApiKey implements UseCase<ApiConnection, Result<boolean>> {
  private strategies: Map<ApiSource, ListApiModelStrategy>;

  constructor(private httpClient: HttpClient) {
    this.strategies = new Map();
    this.strategies.set(
      ApiSource.OpenAI,
      new ListOpenaiModelStrategy(this.httpClient),
    );
    this.strategies.set(
      ApiSource.Anthropic,
      new ListAnthropicModelStrategy(this.httpClient),
    );
    this.strategies.set(
      ApiSource.OpenRouter,
      new ListOpenrouterModelStrategy(this.httpClient),
    );
    this.strategies.set(
      ApiSource.OpenAICompatible,
      new ListOpenaiCompatibleModelStrategy(this.httpClient),
    );
    this.strategies.set(ApiSource.Wllama, new ListWllamaModelStrategy());
    this.strategies.set(
      ApiSource.GoogleGenerativeAI,
      new ListGoogleGenerativeAIModelStrategy(this.httpClient),
    );
    this.strategies.set(
      ApiSource.KoboldCPP,
      new ListKoboldModelStrategy(this.httpClient),
    );
    this.strategies.set(
      ApiSource.AIHorde,
      new ListAIHordeModelStrategy(this.httpClient),
    );
    this.strategies.set(ApiSource.Dummy, new ListDummyModelStrategy());
    this.strategies.set(
      ApiSource.Ollama,
      new ListOllamaModelStrategy(this.httpClient),
    );
    this.strategies.set(
      ApiSource.DeepSeek,
      new ListDeepseekModelStrategy(this.httpClient),
    );
    this.strategies.set(
      ApiSource.xAI,
      new ListXaiModelStrategy(this.httpClient),
    );
    this.strategies.set(
      ApiSource.Mistral,
      new ListMistralModelStrategy(this.httpClient),
    );
    this.strategies.set(
      ApiSource.Cohere,
      new ListCohereModelStrategy(this.httpClient),
    );
  }

  async execute(apiConnection: ApiConnection): Promise<Result<boolean>> {
    try {
      // Get strategy by api source
      const strategy = this.strategies.get(apiConnection.source);
      if (!strategy) {
        throw new Error(`API source not supported: ${apiConnection.source}`);
      }

      // Check if the API key is valid
      const result = await strategy.listApiModel(apiConnection);

      // Return result
      return Result.ok(result.isSuccess);
    } catch (error) {
      return formatFail("Failed to check API key", error);
    }
  }
}
