import { Result } from "@/shared/core/result";
import { OpenRouterEndpoint } from "@/shared/endpoints/openrouter";
import { HttpClient } from "@/shared/infra";
import { formatFail } from "@/shared/lib/error-utils";

import { ApiConnection, ApiModel } from "@/modules/api/domain";
import { ListApiModelStrategy } from "@/modules/api/usecases/list-api-model/list-api-model-strategy";

export class ListOpenrouterModelStrategy implements ListApiModelStrategy {
  constructor(private httpClient: HttpClient) {}

  async listApiModel(
    apiConnection: ApiConnection,
  ): Promise<Result<ApiModel[]>> {
    try {
      if (!apiConnection.props.apiKey) {
        throw new Error("API key is missing for OpenRouter connection");
      }

      const openRouterEndpoint = new OpenRouterEndpoint(
        this.httpClient,
        apiConnection.props.apiKey,
      );

      return Result.ok(await openRouterEndpoint.getAvailableModelList());
    } catch (error) {
      return formatFail("Failed to list OpenRouter model", error);
    }
  }
}
