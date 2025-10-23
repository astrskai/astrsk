import { LlmEndpoint } from "@/shared/endpoints";
import { HttpClient } from "@/shared/infra";
import { logger } from "@/shared/lib";

import { ApiModel } from "@/entities/api/domain";

export class KoboldCPPEndpoint implements LlmEndpoint {
  protected httpClient: HttpClient;
  private baseUrl: string;

  constructor(
    httpClient: HttpClient,
    apiKey: string,
    baseUrl: string = "http://localhost:5001",
  ) {
    this.httpClient = httpClient;
    this.baseUrl = baseUrl;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async getAvailableModelList(): Promise<ApiModel[]> {
    try {
      const response = await this.httpClient.get(
        `${this.getBaseUrl()}/api/v1/model`,
        {
          headers: {
            accept: "application/json",
          },
        },
      );

      if (response.status === 200 && response.data.result) {
        const modelId = response.data.result;
        return [ApiModel.create({ id: modelId, name: modelId }).getValue()];
      } else {
        logger.info("Failed to fetch available model");
        return [];
      }
    } catch (error) {
      logger.error("Error fetching available model:", error);
      return [];
    }
  }
}
