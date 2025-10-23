import { ModelProviderInfo } from "@/features/flow/flow-multi/validation/types/validation-types";
import { ApiSource } from "@/modules/api/domain";

export class ModelProviderRegistry {
  private static providers: Map<string, ModelProviderInfo> = new Map([
    ['openai', {
      provider: ApiSource.OpenAI,
      modelPatterns: [
        /^gpt-5/i,
        /^gpt-4/i,
        /^gpt-3\.5/i,
        /^o1/i,
      ],
      supportedFeatures: {
        structuredOutput: true,
      }
    }],
    ['anthropic', {
      provider: ApiSource.Anthropic,
      modelPatterns: [
        /^claude/i,
      ],
      supportedFeatures: {
        structuredOutput: true,
      }
    }],
    ['google-generative-ai', {
      provider: ApiSource.GoogleGenerativeAI,
      modelPatterns: [
        /^gemini/i,
        /^palm/i,
      ],
      supportedFeatures: {
        structuredOutput: true,
      }
    }],
    ['mistral', {
      provider: ApiSource.Mistral,
      modelPatterns: [
        /^mistral/i,
        /^mixtral/i,
        /^codestral/i,
      ],
      supportedFeatures: {
        structuredOutput: true,
      }
    }],
    ['deepseek', {
      provider: ApiSource.DeepSeek,
      modelPatterns: [
        /^deepseek/i,
      ],
      supportedFeatures: {
        structuredOutput: true,
      }
    }],
    ['xai', {
      provider: ApiSource.xAI,
      modelPatterns: [
        /^grok/i,
      ],
      supportedFeatures: {
        structuredOutput: true,
      }
    }],
    ['cohere', {
      provider: ApiSource.Cohere,
      modelPatterns: [
        /^command/i,
        /^c4ai/i,
      ],
      supportedFeatures: {
        structuredOutput: true,
      }
    }],
  ]);

  /**
   * Detect the actual model provider based on model name
   * This helps identify Google models on OpenRouter, etc.
   */
  static detectModelProvider(modelName: string | undefined): ModelProviderInfo | undefined {
    if (!modelName) return undefined;

    for (const [, providerInfo] of this.providers) {
      for (const pattern of providerInfo.modelPatterns) {
        if (pattern.test(modelName)) {
          return providerInfo;
        }
      }
    }

    return undefined;
  }

  /**
   * Get provider info by API source
   */
  static getProviderBySource(apiSource: string | undefined): ModelProviderInfo | undefined {
    if (!apiSource) return undefined;
    return this.providers.get(apiSource);
  }

  /**
   * Check if a provider requires system messages at the start
   */
  static requiresSystemMessageAtStart(provider: string): boolean {
    return ['anthropic', 'google-generative-ai'].includes(provider);
  }

  /**
   * Check if a provider requires user message after system message
   */
  static requiresUserAfterSystem(provider: string): boolean {
    return provider === 'google-generative-ai';
  }
}