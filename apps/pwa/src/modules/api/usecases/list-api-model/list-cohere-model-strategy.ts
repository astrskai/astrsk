import { Result } from "@/shared/core/result";
import { HttpClient } from "@/shared/infra/http-client";
import { formatFail } from "@/shared/utils";

import { ApiConnection, ApiModel } from "@/modules/api/domain";
import { ListApiModelStrategy } from "@/modules/api/usecases/list-api-model/list-api-model-strategy";

export class ListCohereModelStrategy implements ListApiModelStrategy {
  constructor(private httpClient: HttpClient) {}

  async listApiModel(
    apiConnection: ApiConnection,
  ): Promise<Result<ApiModel[]>> {
    try {
      // Request models
      const response = await this.httpClient.get(
        "https://api.cohere.com/v1/models",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiConnection.props.apiKey}`,
          },
        },
      );
      if (response.status !== 200) {
        throw new Error("Failed to fetch model list");
      }

      // Parse response and return
      return Result.ok(
        response.data.models
          .filter((model: any) => model.endpoints.includes("chat"))
          .map((model: any) =>
            ApiModel.create({
              id: model.name,
              name: model.name,
            }).getValue(),
          ),
      );
    } catch (error) {
      return formatFail("Failed to list Mistral model", error);
    }
  }
}
