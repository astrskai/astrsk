import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { HttpClient } from "@/shared/infra";
import { formatFail } from "@/shared/utils";

import { ApiSource } from "@/modules/api/domain";
import { LoadApiConnectionRepo } from "@/modules/api/repos";
import {
  CheckAnthropicModelStrategy,
  CheckApiModelStrategy,
  CheckOpenaiCompatibleModelStrategy,
  CheckOpenaiModelStrategy,
  CheckOpenrouterModelStrategy,
  CheckKoboldModelStrategy,
} from "@/modules/api/usecases/check-api-model";
import { CheckWllamaModelStrategy } from "@/modules/api/usecases/check-api-model/check-wllama-model-strategy";

type Command = {
  apiConnectionId: UniqueEntityID;
  modelId: string;
};

type ApiModelStatus = "available" | "error";
type WllamaModelStatus = "not_ready" | "downloading" | "ready" | "error";
export type ModelStatus = ApiModelStatus | WllamaModelStatus;

export class CheckApiModel implements UseCase<Command, Result<ModelStatus>> {
  private strategies: Map<ApiSource, CheckApiModelStrategy>;

  constructor(
    private httpClient: HttpClient,
    private loadApiConnectionRepo: LoadApiConnectionRepo,
  ) {
    this.strategies = new Map();
    this.strategies.set(
      ApiSource.OpenAI,
      new CheckOpenaiModelStrategy(httpClient),
    );
    this.strategies.set(
      ApiSource.Anthropic,
      new CheckAnthropicModelStrategy(httpClient),
    );
    this.strategies.set(
      ApiSource.OpenRouter,
      new CheckOpenrouterModelStrategy(httpClient),
    );
    this.strategies.set(
      ApiSource.OpenAICompatible,
      new CheckOpenaiCompatibleModelStrategy(httpClient),
    );
    this.strategies.set(ApiSource.Wllama, new CheckWllamaModelStrategy());
    this.strategies.set(
      ApiSource.KoboldCPP,
      new CheckKoboldModelStrategy(httpClient),
    );
  }

  async execute(command: Command): Promise<Result<ModelStatus>> {
    try {
      const apiConnectionResult =
        await this.loadApiConnectionRepo.getApiConnectionById(
          command.apiConnectionId,
        );

      if (apiConnectionResult.isFailure) {
        return formatFail<ModelStatus>(
          "Failed to retrieve API connection",
          apiConnectionResult.getError(),
        );
      }

      const apiConnection = apiConnectionResult.getValue();
      const strategy = this.strategies.get(apiConnection.props.source);

      if (!strategy) {
        return formatFail<ModelStatus>("Unsupported API source");
      }

      return await strategy.checkApiModel(apiConnection, command.modelId);
    } catch (error) {
      return formatFail<ModelStatus>("Error checking API model", error);
    }
  }
}
