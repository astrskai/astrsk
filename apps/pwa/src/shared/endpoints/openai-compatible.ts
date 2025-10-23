import { LlmEndpoint } from "@/shared/endpoints";
import { HttpClient } from "@/shared/infra";
import { logger } from "@/shared/lib";

import { ApiModel } from "@/entities/api/domain";

export class OpenAIComptableEndpoint implements LlmEndpoint {
  protected httpClient: HttpClient;
  private baseUrl: string;
  private apiKey: string;

  constructor(
    httpClient: HttpClient,
    apiKey: string,
    baseUrl: string = "https://api.openai.com",
  ) {
    this.httpClient = httpClient;
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getApiKey(): string {
    return this.apiKey;
  }

  async getAvailableModelList(): Promise<ApiModel[]> {
    try {
      const response = await this.httpClient.get(
        `${this.getBaseUrl()}/v1/models`,
        {
          headers: {
            Authorization: `Bearer ${this.getApiKey()}`,
          },
        },
      );

      if (response.status === 200 && response.data.data) {
        return response.data.data.map((model: any) =>
          ApiModel.create({ id: model.id, name: model.id }).getValue(),
        );
      } else {
        logger.info("Failed to fetch available models");
        return [];
      }
    } catch (error) {
      logger.error("Error fetching available models:", error);
      throw error;
    }
  }
}
