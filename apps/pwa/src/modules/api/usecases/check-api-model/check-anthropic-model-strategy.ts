import { Result } from "@/shared/core";
import { AnthropicEndpoint } from "@/shared/endpoints/anthropic";
import { HttpClient } from "@/shared/infra";
import { formatFail } from "@/shared/utils";

import { ApiConnection } from "@/modules/api/domain";
import { ModelStatus } from "@/modules/api/usecases";
import { CheckApiModelStrategy } from "@/modules/api/usecases/check-api-model";

export class CheckAnthropicModelStrategy implements CheckApiModelStrategy {
  constructor(private httpClient: HttpClient) {}

  async checkApiModel(
    apiConnection: ApiConnection,
    modelId: string,
  ): Promise<Result<ModelStatus>> {
    if (!apiConnection.props.apiKey) {
      return formatFail("API key is missing");
    }

    const anthropicEndpoint = new AnthropicEndpoint(
      this.httpClient,
      apiConnection.props.apiKey,
    );
    const isConnected = await anthropicEndpoint.checkConnection({
      model: modelId,
      messages: [{ role: "user", content: "Test message" }],
      maxTokens: 1,
    });

    return isConnected
      ? Result.ok<ModelStatus>("available")
      : Result.ok<ModelStatus>("error");
  }
}
