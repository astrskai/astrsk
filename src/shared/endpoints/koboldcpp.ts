import { LlmEndpoint } from "@/shared/endpoints";
import { HttpClient, isHttpError } from "@/shared/infra";
import { logger } from "@/shared/utils";

import { ApiModel } from "@/modules/api/domain";

interface KoboldCPPRequestProps {
  model: string;
  messages?: Array<{ role: string; content: string }>;
  prompt?: string;
  stream?: boolean;
  max_tokens?: number;
}

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

  async makeRequest(props: KoboldCPPRequestProps) {
    const { model, messages, prompt, stream = false } = props;
    const baseVersion = messages ? "/v1/" : "/api/v1/";
    const endpoint = messages ? "chat/completions" : "generate";
    const data = messages
      ? { model, messages, stream }
      : { model, prompt, stream };

    try {
      const response = await this.httpClient.post(
        `${this.getBaseUrl()}${baseVersion}${endpoint}`,
        data,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      return response;
    } catch (error) {
      if (isHttpError(error) && error.response) {
        return error.response;
      }
      throw error;
    }
  }

  async checkConnection(props: KoboldCPPRequestProps): Promise<boolean> {
    try {
      props.max_tokens = 1;
      const response = await this.makeRequest(props);

      if (props.stream) {
        logger.info("KoboldCPP streaming connection successful");
        return true;
      } else if (
        response.status === 200 &&
        response.data.choices &&
        response.data.choices.length > 0
      ) {
        logger.info("KoboldCPP connection successful");
        return true;
      } else {
        logger.info("KoboldCPP connection failed");
        return false;
      }
    } catch (error) {
      logger.error("Error connecting to KoboldCPP:", error);
      return false;
    }
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

// Usage
// const openAIEndpoint = new OpenAIComptableEndpoint();
// const result = await openAIEndpoint.checkConnection({
//   apiKey: 'your-openai-api-key-here',
//   baseUrl: 'https://api.openai.com',
//   model: 'gpt-3.5-turbo',
//   messages: [{role: 'user', content: 'Hello, this is a test message.'}],
//   stream: true // Add this line to enable streaming
// });
