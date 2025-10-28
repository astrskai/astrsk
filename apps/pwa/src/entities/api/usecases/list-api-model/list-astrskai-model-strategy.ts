import { Result } from "@/shared/core/result";
import { HttpClient } from "@/shared/infra/http-client";
import { formatFail } from "@/shared/lib/error-utils";

import { ApiConnection, ApiSource } from "@/entities/api/domain/api-connection";
import { ApiModel } from "@/entities/api/domain/api-model";
import { ListApiModelStrategy } from "@/entities/api/usecases/list-api-model/list-api-model-strategy";

export class ListAstrskaiModelStrategy implements ListApiModelStrategy {
  constructor(private httpClient: HttpClient) {}

  async listApiModel(
    apiConnection: ApiConnection,
  ): Promise<Result<ApiModel[]>> {
    // TEMPORARY: Hide all astrsk models from users
    // TODO: Remove this when ready to show astrsk models again
    return Result.ok([]);

    /* COMMENTED OUT - Original implementation
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
    */
  }
}
