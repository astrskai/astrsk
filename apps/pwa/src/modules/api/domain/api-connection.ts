import { Guard, Result } from "@/shared/core";
import { AggregateRoot, UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/utils";

export const ApiSource = {
  AstrskAi: "astrsk-ai",
  OpenAI: "openai",
  Anthropic: "anthropic",
  OpenRouter: "openrouter",
  OpenAICompatible: "openai-compatible",
  Wllama: "wllama",
  GoogleGenerativeAI: "google-generative-ai",
  KoboldCPP: "koboldcpp",
  AIHorde: "aihorde",
  Ollama: "ollama",
  Dummy: "dummy",
  DeepSeek: "deepseek",
  xAI: "xai",
  Mistral: "mistral",
  Cohere: "cohere",
} as const;

export type ApiSource = (typeof ApiSource)[keyof typeof ApiSource];

export const apiSourceLabel = new Map<ApiSource, string>([
  [ApiSource.AstrskAi, "astrsk.ai"],
  [ApiSource.OpenAI, "OpenAI"],
  [ApiSource.GoogleGenerativeAI, "Google AI Studio"],
  [ApiSource.Anthropic, "Anthropic"],
  [ApiSource.OpenRouter, "OpenRouter"],
  [ApiSource.OpenAICompatible, "OpenAI Compatible"],
  [ApiSource.Wllama, "Wllama"],
  [ApiSource.KoboldCPP, "KoboldCPP"],
  [ApiSource.AIHorde, "AI Horde"],
  [ApiSource.Ollama, "Ollama"],
  [ApiSource.DeepSeek, "DeepSeek"],
  [ApiSource.xAI, "xAI"],
  [ApiSource.Mistral, "Mistral"],
  [ApiSource.Dummy, "Dummy"],
  [ApiSource.Cohere, "Cohere"],
]);

export const OpenrouterProviderSort = {
  Default: "default",
  Price: "price",
  Throughput: "throughput",
  Latency: "latency",
} as const;

export type OpenrouterProviderSort =
  (typeof OpenrouterProviderSort)[keyof typeof OpenrouterProviderSort];

export const openrouterProviderSortLabel = new Map<
  OpenrouterProviderSort,
  string
>([
  [OpenrouterProviderSort.Default, "Default"],
  [OpenrouterProviderSort.Price, "Lowest price"],
  [OpenrouterProviderSort.Throughput, "Highest throughput"],
  [OpenrouterProviderSort.Latency, "Lowest latency"],
]);

export interface ApiConnectionProps {
  title: string;
  source: ApiSource;

  // For openai-compatible, ollama
  baseUrl?: string;

  // For openai, anthropic, openrouter, openai-compatible
  apiKey?: string;

  // For wllama
  modelUrls?: string[];

  // For openrouter
  openrouterProviderSort?: OpenrouterProviderSort;

  updatedAt: Date;
}

export const ApiConnectionPropsKeys = [
  "title",
  "source",
  "baseUrl",
  "apiKey",
  "modelUrls",
  "openrouterProviderSort",
  "updatedAt",
];

export class ApiConnection extends AggregateRoot<ApiConnectionProps> {
  get title(): string {
    return this.props.title;
  }

  get source(): ApiSource {
    return this.props.source;
  }

  get baseUrl(): string | undefined {
    return this.props.baseUrl;
  }

  get apiKey(): string | undefined {
    return this.props.apiKey;
  }

  get modelUrls(): string[] | undefined {
    return this.props.modelUrls;
  }

  get openrouterProviderSort(): OpenrouterProviderSort | undefined {
    return this.props.openrouterProviderSort;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public setTitle(title: string): Result<void> {
    if (Guard.againstNullOrUndefined(title, "title").isFailure) {
      return formatFail("title is null or undefined");
    }

    this.props.title = title;
    return Result.ok<void>();
  }

  public setSource(source: ApiSource): Result<void> {
    if (Guard.againstNullOrUndefined(source, "source").isFailure) {
      return formatFail("source is null or undefined");
    }

    this.props.source = source;
    return Result.ok<void>();
  }

  public setBaseUrl(baseUrl: string): Result<void> {
    if (Guard.againstNullOrUndefined(baseUrl, "baseUrl").isFailure) {
      return formatFail("baseUrl is null or undefined");
    }

    if (
      this.props.source !== ApiSource.OpenAICompatible &&
      this.props.source !== ApiSource.Ollama &&
      this.props.source !== ApiSource.KoboldCPP &&
      this.props.source !== ApiSource.AstrskAi
    ) {
      return formatFail(
        "only astrsk-ai source, openai-compatible source, ollama source, and koboldcpp source can set baseUrl",
      );
    }

    this.props.baseUrl = baseUrl;
    return Result.ok<void>();
  }

  public setApiKey(apiKey: string): Result<void> {
    if (Guard.againstNullOrUndefined(apiKey, "apiKey").isFailure) {
      return formatFail("apiKey is null or undefined");
    }

    if (this.props.source === ApiSource.Wllama) {
      return formatFail("wllama source and koboldcpp source cannot set apiKey");
    }

    this.props.apiKey = apiKey;
    return Result.ok<void>();
  }

  public setModelUrls(modelUrls: string[]): Result<void> {
    if (Guard.againstNullOrUndefined(modelUrls, "modelUrls").isFailure) {
      return formatFail("modelUrls is null or undefined");
    }

    if (
      this.props.source !== ApiSource.Wllama &&
      this.props.source !== ApiSource.OpenAICompatible
    ) {
      return formatFail("only wllama source can set modelUrls");
    }

    this.props.modelUrls = modelUrls;
    return Result.ok<void>();
  }

  public setOpenrouterProviderSort(
    openrouterProviderSort: OpenrouterProviderSort,
  ): Result<void> {
    this.props.openrouterProviderSort = openrouterProviderSort;
    return Result.ok<void>();
  }

  public static create(
    props: ApiConnectionProps,
    id?: UniqueEntityID,
  ): Result<ApiConnection> {
    try {
      const apiConnection = new ApiConnection(
        {
          title: props.title,
          source: props.source,
          updatedAt: new Date(),
        },
        id,
      );

      if (props.baseUrl) {
        const setBaseUrlResult = apiConnection.setBaseUrl(props.baseUrl);
        if (setBaseUrlResult.isFailure) {
          return formatFail(
            "Failed to create ApiConnection",
            setBaseUrlResult.getError(),
          );
        }
      }

      if (props.apiKey) {
        const setApiKeyResult = apiConnection.setApiKey(props.apiKey);
        if (setApiKeyResult.isFailure) {
          return formatFail(
            "Failed to create ApiConnection",
            setApiKeyResult.getError(),
          );
        }
      }

      if (props.modelUrls) {
        const setModelUrlResult = apiConnection.setModelUrls(props.modelUrls);
        if (setModelUrlResult.isFailure) {
          return formatFail(
            "Failed to create ApiConnection",
            setModelUrlResult.getError(),
          );
        }
      }

      if (props.openrouterProviderSort) {
        const setOpenrouterProviderSortResult =
          apiConnection.setOpenrouterProviderSort(props.openrouterProviderSort);
        if (setOpenrouterProviderSortResult.isFailure) {
          return formatFail(
            "Failed to create ApiConnection",
            setOpenrouterProviderSortResult.getError(),
          );
        }
      }

      return Result.ok<ApiConnection>(apiConnection);
    } catch (error) {
      return formatFail<ApiConnection>("Failed to create ApiConnection", error);
    }
  }
}
