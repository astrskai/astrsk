import { Result } from "@/shared/core";
import { KoboldCPPEndpoint } from "@/shared/endpoints/koboldcpp";
import { HttpClient } from "@/shared/infra";

import { ApiConnection } from "@/modules/api/domain";
import { ModelStatus } from "@/modules/api/usecases";
import { CheckApiModelStrategy } from "@/modules/api/usecases/check-api-model";

export class CheckKoboldModelStrategy implements CheckApiModelStrategy {
  constructor(private httpClient: HttpClient) {}

  async checkApiModel(
    apiConnection: ApiConnection,
    modelId: string,
  ): Promise<Result<ModelStatus>> {
    const koboldEndpoint = new KoboldCPPEndpoint(
      this.httpClient,
      apiConnection.props.apiKey!,
      apiConnection.props.baseUrl!,
    );
    const isConnected = await koboldEndpoint.checkConnection({
      model: modelId,
      messages: [{ role: "user", content: "Test message" }],
    });

    return isConnected
      ? Result.ok<ModelStatus>("available")
      : Result.ok<ModelStatus>("error");
  }
}
