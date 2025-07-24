import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { HttpClient } from "@/shared/infra";
import { formatFail, logger } from "@/shared/utils";

import { ApiConnection, ApiModel, ApiSource } from "@/modules/api/domain";
import { LoadApiConnectionRepo } from "@/modules/api/repos/load-api-connection-repo";
import { ListAIHordeModelStrategy } from "@/modules/api/usecases/list-api-model/list-aihorde-model-strategy";
import { ListAnthropicModelStrategy } from "@/modules/api/usecases/list-api-model/list-anthropic-model-strategy";
import { ListApiModelStrategy } from "@/modules/api/usecases/list-api-model/list-api-model-strategy";
import { ListAstrskaiModelStrategy } from "@/modules/api/usecases/list-api-model/list-astrskai-model-strategy";
import { ListDeepseekModelStrategy } from "@/modules/api/usecases/list-api-model/list-deepseek-model-strategy";
import { ListDummyModelStrategy } from "@/modules/api/usecases/list-api-model/list-dummy-model-strategy";
import { ListGoogleGenerativeAIModelStrategy } from "@/modules/api/usecases/list-api-model/list-google-generative-ai-model-strategy";
import { ListKoboldModelStrategy } from "@/modules/api/usecases/list-api-model/list-koboldcpp-model-strategy";
import { ListMistralModelStrategy } from "@/modules/api/usecases/list-api-model/list-mistral-model-strategy";
import { ListOllamaModelStrategy } from "@/modules/api/usecases/list-api-model/list-ollama-model-strategy";
import { ListOpenaiCompatibleModelStrategy } from "@/modules/api/usecases/list-api-model/list-openai-compatible-model-strategy";
import { ListOpenaiModelStrategy } from "@/modules/api/usecases/list-api-model/list-openai-model-strategy";
import { ListOpenrouterModelStrategy } from "@/modules/api/usecases/list-api-model/list-openrouter-model-strategy";
import { ListWllamaModelStrategy } from "@/modules/api/usecases/list-api-model/list-wllama-model-strategy";
import { ListXaiModelStrategy } from "@/modules/api/usecases/list-api-model/list-xai-model-strategy";
import { ListCohereModelStrategy } from "@/modules/api/usecases/list-api-model/list-cohere-model-strategy";

export type ListApiModelQuery = {
  apiConnectionId: UniqueEntityID;
  keyword?: string;
};

export class ListApiModel
  implements UseCase<ListApiModelQuery, Result<ApiModel[]>>
{
  private strategies: Map<ApiSource, ListApiModelStrategy>;
  private modelCache: Map<string, ApiModel[]>;

  constructor(
    private httpClient: HttpClient,
    private loadApiConnectionRepo: LoadApiConnectionRepo,
  ) {
    this.strategies = new Map();
    this.strategies.set(
      ApiSource.AstrskAi,
      new ListAstrskaiModelStrategy(this.httpClient),
    );
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
    this.modelCache = new Map();
  }

  private async listApiModel(
    apiConnection: ApiConnection,
  ): Promise<Result<ApiModel[]>> {
    // Check if the models are already cached
    if (
      apiConnection.source !== ApiSource.Wllama &&
      apiConnection.source !== ApiSource.OpenAICompatible &&
      this.modelCache.has(apiConnection.id.toString())
    ) {
      return Result.ok<ApiModel[]>(
        this.modelCache.get(apiConnection.id.toString()) ?? [],
      );
    }

    // Get strategy based on the API source
    const strategy = this.strategies.get(apiConnection.props.source);
    if (!strategy) {
      return formatFail<ApiModel[]>(
        "Unsupported API source",
        apiConnection.props.source,
      );
    }

    // Fetch models
    const modelsOrError = await strategy.listApiModel(apiConnection);
    if (modelsOrError.isFailure) {
      logger.error("Failed to list API models", modelsOrError.getError());
    }
    const models = modelsOrError.isSuccess ? modelsOrError.getValue() : [];

    // Cache models
    this.modelCache.set(apiConnection.id.toString(), models);

    // Return models
    return Result.ok<ApiModel[]>(models);
  }

  async execute(query: ListApiModelQuery): Promise<Result<ApiModel[]>> {
    try {
      const apiConnectionResult =
        await this.loadApiConnectionRepo.getApiConnectionById(
          query.apiConnectionId,
        );

      if (apiConnectionResult.isFailure) {
        return formatFail<ApiModel[]>(
          "Failed to list API connection",
          apiConnectionResult.getError(),
        );
      }

      const apiConnection = apiConnectionResult.getValue();
      let models = (await this.listApiModel(apiConnection)).getValue();
      if (query.keyword) {
        // TODO: refactor, split create regexp logic (https://github.com/harpychat/h2o-app-nextjs/pull/36#discussion_r1802351407)
        const regexp = new RegExp(query.keyword.trim(), "i");
        models = models.filter(
          (model) => regexp.test(model.id) || regexp.test(model.name),
        );
      }

      return Result.ok<ApiModel[]>(models);
    } catch (error) {
      return formatFail<ApiModel[]>("Failed to list API models", error);
    }
  }
}
