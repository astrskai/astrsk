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
    // Remove trailing slash for consistent URL building
    const cleanBaseUrl = this.getBaseUrl().replace(/\/$/, "");

    // Try without /v1 first, then with /v1 as fallback
    const urlsToTry = [
      `${cleanBaseUrl}/models`,
      `${cleanBaseUrl}/v1/models`,
    ];

    for (const modelsUrl of urlsToTry) {
      try {
        logger.debug(`[OpenAI Compatible] Trying: ${modelsUrl}`);

        const response = await this.httpClient.get(modelsUrl, {
          headers: {
            Authorization: `Bearer ${this.getApiKey()}`,
          },
        });

        if (response.status === 200 && response.data.data) {
          logger.info(`[OpenAI Compatible] Success with: ${modelsUrl}`);
          return response.data.data.map((model: any) =>
            ApiModel.create({ id: model.id, name: model.id }).getValue(),
          );
        }
      } catch (error) {
        logger.warn(`[OpenAI Compatible] Failed with ${modelsUrl}, trying next...`);
        // Try next URL
        continue;
      }
    }

    // All attempts failed
    logger.error("[OpenAI Compatible] All model fetch attempts failed");
    return [];
  }
}
