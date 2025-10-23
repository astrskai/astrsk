import { Result } from "@/shared/core/result";
import { HttpClient } from "@/shared/infra/http-client";
import { formatFail } from "@/shared/lib/error-utils";

import { ApiConnection, ApiSource } from "@/modules/api/domain/api-connection";
import { ApiModel } from "@/modules/api/domain/api-model";
import { ListApiModelStrategy } from "@/modules/api/usecases/list-api-model/list-api-model-strategy";

export class ListAstrskaiModelStrategy implements ListApiModelStrategy {
  constructor(private httpClient: HttpClient) {}

  async listApiModel(
    apiConnection: ApiConnection,
  ): Promise<Result<ApiModel[]>> {
    try {
      // Request models
      const response = await this.httpClient.get(
        `${import.meta.env.VITE_CONVEX_SITE_URL}/serveModel/listServeModel`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      if (response.status !== 200) {
        throw new Error("Failed to fetch model list");
      }

      // Parse response and return
      return Result.ok(
        response.data.map((model: any) =>
          ApiModel.create({
            id: `${model.provider}:${model.model_id}`,
            name: model.model_name,
          }).getValue(),
        ),
      );
    } catch (error) {
      return formatFail("Failed to list astrsk model", error);
    }
  }
}
