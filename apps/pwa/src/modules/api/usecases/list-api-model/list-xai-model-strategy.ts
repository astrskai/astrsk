import { Result } from "@/shared/core/result";
import { HttpClient } from "@/shared/infra/http-client";
import { formatFail } from "@/shared/utils";

import { ApiConnection, ApiModel } from "@/modules/api/domain";
import { ListApiModelStrategy } from "@/modules/api/usecases/list-api-model/list-api-model-strategy";

export class ListXaiModelStrategy implements ListApiModelStrategy {
  constructor(private httpClient: HttpClient) {}

  async listApiModel(
    apiConnection: ApiConnection,
  ): Promise<Result<ApiModel[]>> {
    try {
      // Request models
      const response = await this.httpClient.get(
        "https://api.x.ai/v1/language-models",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiConnection.props.apiKey}`,
          },
        },
      );
      if (response.status !== 200) {
        throw new Error(
          `response status is not 200: ${response.status} ${response.statusText}`,
        );
      }

      // Parse response and return
      return Result.ok(
        response.data.models
          .filter(
            (model: any) =>
              model.input_modalities.includes("text") &&
              model.output_modalities.includes("text"),
          )
          .map((model: any) =>
            ApiModel.create({
              id: model.id,
              name: model.id,
            }).getValue(),
          ),
      );
    } catch (error) {
      return formatFail("Failed to list xAI model", error);
    }
  }
}
