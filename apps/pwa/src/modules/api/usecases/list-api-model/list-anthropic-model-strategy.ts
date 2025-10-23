import { Result } from "@/shared/core/result";
import { AnthropicEndpoint } from "@/shared/endpoints/anthropic";
import { HttpClient } from "@/shared/infra";
import { formatFail } from "@/shared/lib/error-utils";

import { ApiConnection, ApiModel } from "@/modules/api/domain";
import { ListApiModelStrategy } from "@/modules/api/usecases/list-api-model/list-api-model-strategy";

export class ListAnthropicModelStrategy implements ListApiModelStrategy {
  constructor(private httpClient: HttpClient) {}

  async listApiModel(
    apiConnection: ApiConnection,
  ): Promise<Result<ApiModel[]>> {
    try {
      if (!apiConnection.props.apiKey) {
        throw new Error("API key is missing for Anthropic connection");
      }

      const anthropicEndpoint = new AnthropicEndpoint(
        this.httpClient,
        apiConnection.props.apiKey,
      );

      return Result.ok(await anthropicEndpoint.getAvailableModelList());
    } catch (error) {
      return formatFail("Failed to list Anthropic model", error);
    }
  }
}
