import { Result } from "@/shared/core";
import { OpenRouterEndpoint } from "@/shared/endpoints/openrouter";
import { HttpClient } from "@/shared/infra";
import { formatFail } from "@/shared/utils";

import { ApiConnection } from "@/modules/api/domain";
import { ModelStatus } from "@/modules/api/usecases";
import { CheckApiModelStrategy } from "@/modules/api/usecases/check-api-model";

export class CheckOpenrouterModelStrategy implements CheckApiModelStrategy {
  constructor(private httpClient: HttpClient) {}

  async checkApiModel(
    apiConnection: ApiConnection,
    modelId: string,
  ): Promise<Result<ModelStatus>> {
    if (!apiConnection.props.apiKey) {
      return formatFail("API key is missing");
    }

    const openRouterEndpoint = new OpenRouterEndpoint(
      this.httpClient,
      apiConnection.props.apiKey,
    );
    const isConnected = await openRouterEndpoint.checkConnection({
      model: modelId,
      messages: [{ role: "user", content: "Test message" }],
    });

    return isConnected
      ? Result.ok<ModelStatus>("available")
      : Result.ok<ModelStatus>("error");
  }
}
