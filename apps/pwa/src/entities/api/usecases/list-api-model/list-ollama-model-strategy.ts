import { Result } from "@/shared/core/result";
import { formatFail } from "@/shared/lib";
import { logger } from "@/shared/lib/logger";

import { ApiConnection, ApiModel } from "@/entities/api/domain";
import { ListApiModelStrategy } from "@/entities/api/usecases/list-api-model/list-api-model-strategy";

export class ListOllamaModelStrategy implements ListApiModelStrategy {
  async listApiModel(
    apiConnection: ApiConnection,
  ): Promise<Result<ApiModel[]>> {
    try {
      // Use custom fetch to remove Stainless SDK headers that cause CORS issues with Ollama
      const customFetch: typeof fetch = async (url, options = {}) => {
        const headers = new Headers(options.headers);
        // Remove Stainless SDK headers that cause CORS issues with Ollama
        headers.delete("x-stainless-retry-count");
        headers.delete("x-stainless-timeout");

        return fetch(url, {
          ...options,
          headers,
        });
      };

      const response = await customFetch(
        `${apiConnection.baseUrl}/api/tags`,
        {
          headers: {
            accept: "application/json",
          },
        },
      );

      if (response.status !== 200) {
        const data = await response.json().catch(() => ({}));
        logger.error(response.status, response.statusText, data);
        throw new Error(
          `response status is not 200: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      return Result.ok(
        data.models.map((model: any) =>
          ApiModel.create({
            id: model.model,
            name: model.name,
          }).getValue(),
        ),
      );
    } catch (error) {
      return formatFail("Failed to list Ollama model", error);
    }
  }
}
