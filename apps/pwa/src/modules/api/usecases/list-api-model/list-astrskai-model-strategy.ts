import { Result } from "@/shared/core/result";
import { HttpClient } from "@/shared/infra/http-client";
import { formatFail } from "@/shared/utils/error-utils";

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

      // Parse response, filter for Gemini Flash only, and return
      return Result.ok(
        response.data
          .filter((model: any) => {
            const modelName = model.model_name.toLowerCase();
            return modelName.includes('gemini') && modelName.includes('flash');
          })
          .map((model: any) =>
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
