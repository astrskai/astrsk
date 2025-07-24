// import { Wllama } from "@wllama/wllama";

import { LlmEndpoint } from "@/shared/endpoints";
import { logger } from "@/shared/utils";

import { ApiModel } from "@/modules/api/domain";

export class WllamaEndpoint implements LlmEndpoint {
  private wllama: any;

  constructor() {
    const CONFIG_PATHS = {
      "single-thread/wllama.js": "/esm/single-thread/wllama.js",
      "single-thread/wllama.wasm": "/esm/single-thread/wllama.wasm",
      "multi-thread/wllama.js": "/esm/multi-thread/wllama.js",
      "multi-thread/wllama.wasm": "/esm/multi-thread/wllama.wasm",
      "multi-thread/wllama.worker.mjs": "/esm/multi-thread/wllama.worker.mjs",
    };
    // this.wllama = new Wllama(CONFIG_PATHS);
    this.wllama = null;
  }

  async makeRequest(props: any): Promise<any> {
    await this.initializeModel(props.modelUrl);
    return this.generateCompletion(props.prompt, props.options);
  }

  async checkConnection(props: any): Promise<boolean> {
    try {
      await this.initializeModel(props.modelUrl);
      return true;
    } catch (error) {
      logger.error("Connection check failed:", error);
      return false;
    }
  }

  async getAvailableModelList(): Promise<ApiModel[]> {
    // This method should be implemented to return a list of available models
    // For now, we'll return an empty array as Wllama doesn't provide a built-in method for this
    return [];
  }

  async initializeModel(modelUrl: string): Promise<void> {
    const progressCallback = ({
      loaded,
      total,
    }: {
      loaded: number;
      total: number;
    }) => {
      const progressPercentage = Math.round((loaded / total) * 100);
      logger.info(`Downloading... ${progressPercentage}%`);
    };

    await this.wllama.loadModelFromUrl(modelUrl, { progressCallback });
  }

  async generateCompletion(
    prompt: string,
    options?: {
      nPredict?: number;
      temperature?: number;
      topK?: number;
      topP?: number;
    },
  ): Promise<string> {
    return await this.wllama.createCompletion(prompt, {
      nPredict: options?.nPredict || 50,
      sampling: {
        temp: options?.temperature || 0.5,
        top_k: options?.topK || 40,
        top_p: options?.topP || 0.9,
      },
    });
  }
}
