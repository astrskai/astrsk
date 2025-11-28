"use client";

import { Brain, Info, Key, Link, Loader2, Settings, Zap } from "lucide-react";
import { useCallback, useState } from "react";
import { toastError } from "@/shared/ui/toast";

import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { logger } from "@/shared/lib";

import { useApiConnections } from "@/shared/hooks/use-api-connections";
import { ApiService } from "@/app/services";
import { queryClient } from "@/shared/api/query-client";
import { apiConnectionQueries } from "@/entities/api/api-connection-queries";
import { Button } from "@/shared/ui/forms";
import {
  ProviderDisplay,
  ProviderDisplayDetailProps,
} from "./provider-display";
import { DefaultModelDisplay } from "./default-model-display";
import { Combobox } from "@/shared/ui";
import { useModelStore } from "@/shared/stores/model-store";
import { DialogBase } from "@/shared/ui/dialogs";

import { TableName } from "@/db/schema/table-name";
import {
  ApiConnection,
  ApiSource,
  apiSourceLabel,
  OpenrouterProviderSort,
  openrouterProviderSortLabel,
} from "@/entities/api/domain";

const maskApiKey = (apiKey?: string): string => {
  if (!apiKey) return "";
  if (apiKey.length <= 12) return `...${apiKey.slice(-4)}`;

  return `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`;
};

const getApiConnectionByApiSource = ({
  apiConnections = [],
  source,
}: {
  apiConnections?: ApiConnection[];
  source: ApiSource;
}) => {
  return apiConnections.find((connection) => connection.source === source);
};

const showBaseUrl = new Map<ApiSource, boolean>([
  [ApiSource.Ollama, true],
  [ApiSource.LMStudio, true],
  [ApiSource.KoboldCPP, true],
  [ApiSource.OpenAICompatible, true],
]);

const showModelUrl = new Map<ApiSource, boolean>([
  [ApiSource.OpenAICompatible, true],
]);

const showApiKey = new Map<ApiSource, boolean>([
  [ApiSource.OpenAI, true],
  [ApiSource.GoogleGenerativeAI, true],
  [ApiSource.Anthropic, true],
  [ApiSource.DeepSeek, true],
  [ApiSource.Mistral, true],
  [ApiSource.xAI, true],
  [ApiSource.OpenRouter, true],
  [ApiSource.OpenAICompatible, true],
  [ApiSource.AIHorde, true],
  [ApiSource.Cohere, true],
]);

const descriptionBySource = new Map<ApiSource, React.ReactNode>([
  [
    ApiSource.GoogleGenerativeAI,
    <>
      If you do not have an API key, 1){" "}
      <a href="https://ai.google.dev/aistudio" target="_blank" rel="noopener noreferrer">
        signin to Google AI studio
      </a>{" "}
      and 2){" "}
      <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
        get API key here
      </a>
      .
    </>,
  ],
  [
    ApiSource.DeepSeek,
    <>
      If you do not have an API key, 1){" "}
      <a href="https://platform.deepseek.com/sign_in" target="_blank" rel="noopener noreferrer">
        signin to Deepseek
      </a>{" "}
      and 2){" "}
      <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer">
        get API key here
      </a>
      .
    </>,
  ],
  [
    ApiSource.Anthropic,
    <>
      If you do not have an API key, 1){" "}
      <a href="https://claude.ai/login" target="_blank" rel="noopener noreferrer">
        signin to Anthropic
      </a>{" "}
      and 2){" "}
      <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer">
        get API key here
      </a>
      .
    </>,
  ],
  [
    ApiSource.OpenAI,
    <>
      If you do not have an API key, 1){" "}
      <a href="https://auth.openai.com/log-in" target="_blank" rel="noopener noreferrer">
        signin to OpenAI
      </a>{" "}
      and 2){" "}
      <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
        get API key here
      </a>
      .
    </>,
  ],
  [
    ApiSource.Mistral,
    <>
      If you do not have an API key, 1){" "}
      <a href="https://auth.mistral.ai/ui/login" target="_blank" rel="noopener noreferrer">
        signin to Mistral
      </a>{" "}
      and 2){" "}
      <a href="https://console.mistral.ai/api-keys" target="_blank" rel="noopener noreferrer">
        get API key here
      </a>
      .
    </>,
  ],
  [
    ApiSource.xAI,
    <>
      If you do not have an API key, 1){" "}
      <a href="https://accounts.x.ai/sign-in" target="_blank" rel="noopener noreferrer">
        signin to xAI
      </a>{" "}
      and 2){" "}
      <a href="https://console.x.ai/team/default/api-keys" target="_blank" rel="noopener noreferrer">
        get API key here
      </a>
      .
    </>,
  ],
  [
    ApiSource.OpenRouter,
    <>
      If you do not have an API key, 1){" "}
      <a href="https://openrouter.ai/" target="_blank" rel="noopener noreferrer">
        signin to OpenRouter
      </a>{" "}
      and 2){" "}
      <a href="https://openrouter.ai/settings/keys" target="_blank" rel="noopener noreferrer">
        get API key here
      </a>
      .
    </>,
  ],
  [
    ApiSource.OpenAICompatible,
    <>
      Please note that you can only connect to endpoints that provide inference
      API (<code>/v1/chat/completions</code>).
    </>,
  ],
]);

const renderProviderListItem = ({
  apiConnection,
  apiSource,
  onOpenEdit,
  onDisconnect,
}: {
  apiConnection?: ApiConnection;
  apiSource?: ApiSource;
  onOpenEdit?: () => void;
  onDisconnect?: (usedResourceIds: {
    flowIds: UniqueEntityID[];
    sessionIds: UniqueEntityID[];
  }) => void;
}) => {
  // Get source
  const source = apiConnection?.source ?? apiSource;
  if (!source) {
    return null;
  }

  // Get details by source
  const details: ProviderDisplayDetailProps[] = [];
  if (apiConnection) {
    if (showBaseUrl.get(source)) {
      details.push({
        label: "Base URL",
        value: apiConnection.baseUrl ?? "",
      });
    }
    if (showModelUrl.get(source)) {
      details.push({
        label: "Model ID",
        value: apiConnection.modelUrls?.join(", ") ?? "",
      });
    }
    if (source === ApiSource.OpenRouter) {
      details.push({
        label: "Provider sorting",
        value:
          openrouterProviderSortLabel.get(
            apiConnection.openrouterProviderSort ??
              OpenrouterProviderSort.Default,
          ) ?? "",
      });
    }
    if (showApiKey.get(source) && source !== ApiSource.OpenAICompatible) {
      details.push({
        label: "API key",
        value: maskApiKey(apiConnection.apiKey),
      });
    }
  }

  return (
    <ProviderDisplay
      key={apiConnection?.id.toString() ?? source.toString()}
      apiSource={source}
      details={details}
      isActive={!!apiConnection}
      onOpenEdit={onOpenEdit}
      onDisconnect={onDisconnect}
    />
  );
};

const providerOrder: ApiSource[] = [
  // ApiSource.AstrskAi,
  ApiSource.OpenAI,
  ApiSource.GoogleGenerativeAI,
  ApiSource.Anthropic,
  ApiSource.DeepSeek,
  ApiSource.Mistral,
  ApiSource.xAI,
  ApiSource.Cohere,
  ApiSource.OpenRouter,
  ApiSource.Ollama,
  ApiSource.LMStudio,
  ApiSource.KoboldCPP,
  ApiSource.AIHorde,
  // ApiSource.Wllama,
  ApiSource.OpenAICompatible,
];

export default function ProvidersPage() {
  // 1. State hooks
  const [isOpenEdit, setIsOpenEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingApiConnection, setEditingApiConnection] =
    useState<ApiConnection | null>(null);
  const [title, setTitle] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [openrouterProviderSort, setOpenrouterProviderSort] =
    useState<OpenrouterProviderSort | null>(null);
  const [modelUrl, setModelUrl] = useState<string>("");

  // 2. Store/Context hooks
  const defaultLiteModel = useModelStore.use.defaultLiteModel();
  const setDefaultLiteModel = useModelStore.use.setDefaultLiteModel();
  const defaultStrongModel = useModelStore.use.defaultStrongModel();
  const setDefaultStrongModel = useModelStore.use.setDefaultStrongModel();

  // 3. Custom hooks (data fetching)
  const [apiConnections] = useApiConnections({});

  // 3. Memoized callbacks (useCallback)
  const invalidateApiConnections = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: apiConnectionQueries.all(),
    });
  }, []);

  const handleOnOpenEdit = useCallback(
    ({
      apiConnection,
      apiSource,
    }: {
      apiConnection?: ApiConnection;
      apiSource?: ApiSource;
    }) => {
      // Get api connection
      let connection = apiConnection;
      if (!connection && apiSource) {
        // Create new api connection
        connection = ApiConnection.create({
          title: apiSource.toString(),
          source: apiSource,
          updatedAt: new Date(),
        }).getValue();
      }
      if (!connection) {
        return null;
      }
      setEditingApiConnection(connection);

      // Set title - generate unique title for new OpenAI compatible connections
      let suggestedTitle = connection.title;
      if (connection.source === ApiSource.OpenAICompatible && !apiConnection) {
        // This is a new connection, find first available number
        const baseTitle = apiSourceLabel.get(connection.source) || connection.source.toString();
        const existingTitles = apiConnections
          .filter((conn: ApiConnection) => conn.source === ApiSource.OpenAICompatible)
          .map((conn: ApiConnection) => conn.title);

        // Find the first available number starting from 1
        let counter = 1;
        while (existingTitles.includes(`${baseTitle} ${counter}`)) {
          counter++;
        }
        suggestedTitle = `${baseTitle} ${counter}`;
      }
      setTitle(suggestedTitle);

      // Set input values by api source
      switch (connection.source) {
        case ApiSource.OpenAI:
        case ApiSource.GoogleGenerativeAI:
        case ApiSource.Anthropic:
        case ApiSource.DeepSeek:
        case ApiSource.Mistral:
        case ApiSource.xAI:
        case ApiSource.AIHorde:
          setApiKey(connection.apiKey ?? "");
          setBaseUrl("");
          break;

        case ApiSource.OpenRouter:
          setApiKey(connection.apiKey ?? "");
          setBaseUrl("");
          setOpenrouterProviderSort(
            connection.openrouterProviderSort ?? OpenrouterProviderSort.Default,
          );
          break;

        case ApiSource.Ollama:
          setApiKey(connection.apiKey ?? "");
          setBaseUrl(connection.baseUrl ?? "http://localhost:11434/api");
          break;

        case ApiSource.LMStudio:
          setApiKey(connection.apiKey ?? "");
          setBaseUrl(connection.baseUrl ?? "http://localhost:1234");
          break;

        case ApiSource.KoboldCPP:
          setApiKey(connection.apiKey ?? "");
          setBaseUrl(connection.baseUrl ?? "http://localhost:5001");
          break;

        case ApiSource.Wllama:
          setApiKey("");
          setBaseUrl("");
          setModelUrl(connection.modelUrls?.join(", ") ?? "");
          break;

        case ApiSource.OpenAICompatible:
          setApiKey(connection.apiKey ?? "");
          setBaseUrl(connection.baseUrl ?? "");
          setModelUrl(connection.modelUrls?.join(", ") ?? "");
          break;
      }

      // Open dialog
      setIsOpenEdit(true);
    },
    [apiConnections],
  );

  // Validate edit form
  const validateEditForm = useCallback(() => {
    // Check editing api connection is not null
    if (!editingApiConnection) {
      return false;
    }

    // Get api source
    const source = editingApiConnection.source;

    // Check api key
    if (showApiKey.get(source)) {
      if (apiKey.trim() === "") {
        return false;
      }
    }

    // Check base URL
    if (showBaseUrl.get(source)) {
      if (baseUrl.trim() === "") {
        return false;
      }
    }

    // Form is valid
    return true;
  }, [apiKey, baseUrl, editingApiConnection]);

  const handleOnConnect = useCallback(async () => {
    try {
      setIsLoading(true);

      // Check if editingApiSource is null
      if (!editingApiConnection) {
        throw new Error("Editing api connection is null");
      }

      // Validate user input
      if (!validateEditForm()) {
        throw new Error("Form is invalid");
      }

      // Update api connection
      // Generate unique title
      let finalTitle = title.trim();

      // If no custom title provided, use source label as base
      if (!finalTitle) {
        finalTitle = apiSourceLabel.get(editingApiConnection.source) || editingApiConnection.source.toString();
      }

      // Check for uniqueness and add number suffix if needed
      const existingTitles = apiConnections
        .filter((conn: ApiConnection) => conn.id.toString() !== editingApiConnection?.id.toString()) // Exclude current connection when editing
        .map((conn: ApiConnection) => conn.title);

      let uniqueTitle = finalTitle;
      let counter = 1;
      while (existingTitles.includes(uniqueTitle)) {
        uniqueTitle = `${finalTitle} ${counter}`;
        counter++;
      }

      editingApiConnection.setTitle(uniqueTitle);

      if (showBaseUrl.get(editingApiConnection.source)) {
        editingApiConnection.setBaseUrl(baseUrl);
      }
      if (showModelUrl.get(editingApiConnection.source)) {
        editingApiConnection.setModelUrls([modelUrl]);
      }
      if (showApiKey.get(editingApiConnection.source)) {
        editingApiConnection.setApiKey(apiKey);
      }
      // LM Studio and Ollama don't require API key, set a placeholder
      if (
        editingApiConnection.source === ApiSource.LMStudio ||
        editingApiConnection.source === ApiSource.Ollama
      ) {
        editingApiConnection.setApiKey("not-needed");
      }
      if (
        editingApiConnection.source === ApiSource.OpenRouter &&
        openrouterProviderSort
      ) {
        editingApiConnection.setOpenrouterProviderSort(openrouterProviderSort);
      }

      // Check api key is valid (skip for LM Studio and Ollama)
      if (
        editingApiConnection.source !== ApiSource.LMStudio &&
        editingApiConnection.source !== ApiSource.Ollama
      ) {
        const checkApiKeyResult =
          await ApiService.checkApiKey.execute(editingApiConnection);
        if (checkApiKeyResult.isFailure) {
          throw new Error(checkApiKeyResult.getError());
        }
        if (checkApiKeyResult.isSuccess && !checkApiKeyResult.getValue()) {
          throw new Error("API key is invalid");
        }
      }

      // Save api connection
      const saveResult =
        await ApiService.saveApiConnection.execute(editingApiConnection);
      if (saveResult.isFailure) {
        throw new Error(saveResult.getError());
      }

      // Invalidate api connections
      invalidateApiConnections();

      // Close dialog
      setIsOpenEdit(false);

      // Reset editing states
      setEditingApiConnection(null);
    } catch (error) {
      logger.error("Failed to connect provider", error);
      if (error instanceof Error) {
        toastError("Failed to connect provider", {
          description: error.message,
        });
      }
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    title,
    apiKey,
    baseUrl,
    editingApiConnection,
    modelUrl,
    openrouterProviderSort,
    validateEditForm,
  ]);

  // Delete api connection
  const handleOnDisconnect = useCallback(
    async (
      apiConnection: ApiConnection,
      usedResourceIds: {
        flowIds: UniqueEntityID[];
        sessionIds: UniqueEntityID[];
      },
    ) => {
      try {
        // Delete api connection
        const deleteResult = await ApiService.deleteApiConnection.execute(
          apiConnection.id,
        );
        if (deleteResult.isFailure) {
          throw new Error(deleteResult.getError());
        }

        // Invalidate api connections
        invalidateApiConnections();

        // Invalidate used resources validation
        for (const flowId of usedResourceIds.flowIds) {
          queryClient.invalidateQueries({
            queryKey: [TableName.Flows, flowId.toString(), "validation"],
          });
        }
        for (const sessionId of usedResourceIds.sessionIds) {
          queryClient.invalidateQueries({
            queryKey: [TableName.Sessions, sessionId.toString(), "validation"],
          });
        }
      } catch (error) {
        logger.error("Failed to disconnect provider", error);
        if (error instanceof Error) {
          toastError("Failed to disconnect provider", {
            description: error.message,
          });
        }
      }
    },
    [invalidateApiConnections],
  );

  return (
    <div className="py-8">
      {/* Info notice */}
      <div className="mb-6 rounded-xl border border-border-default bg-surface p-4">
        <p className="text-sm leading-relaxed text-fg-muted">
          Configure external model providers. API requests are sent directly from
          your browser to the provider API.
        </p>
      </div>

      {/* Global Default Settings Section */}
      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2 px-1">
          <Settings size={16} className="text-fg-muted" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-muted">
            Global Default Settings
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DefaultModelDisplay
            icon={<Zap size={18} className="text-blue-400" />}
            iconBgClassName="bg-blue-900/20"
            title="Lite Model"
            description="Lite models are used for simple tasks throughout the app such as data management during sessions."
            value={defaultLiteModel}
            onValueChange={setDefaultLiteModel}
          />

          <DefaultModelDisplay
            icon={<Brain size={18} className="text-purple-400" />}
            iconBgClassName="bg-purple-900/20"
            title="Strong Model"
            description="Strong models are used for main character response and other tasks that need more heavy lifting."
            value={defaultStrongModel}
            onValueChange={setDefaultStrongModel}
          />
        </div>
      </section>

      {/* Providers Section */}
      <section>
        <div className="mb-3 flex items-center gap-2 px-1">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-muted">
            Providers
          </h2>
        </div>

        {/* Provider list */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {apiConnections
              ?.filter(
                (apiConnection: ApiConnection) =>
                  apiConnection.source !== ApiSource.AstrskAi,
              )
              ?.map((apiConnection: ApiConnection) =>
                renderProviderListItem({
                  apiConnection,
                  onOpenEdit: () => {
                    if (apiConnection.source !== ApiSource.AstrskAi) {
                      handleOnOpenEdit({ apiConnection });
                    }
                  },
                  onDisconnect: (usedResourceIds) => {
                    if (apiConnection.source !== ApiSource.AstrskAi) {
                      handleOnDisconnect(apiConnection, usedResourceIds);
                    }
                  },
                }),
              )}
            {providerOrder.map((apiSource) => {
              const apiConnection = getApiConnectionByApiSource({
                apiConnections,
                source: apiSource,
              });

              // Skip already connected providers (except OpenAICompatible which allows multiple)
              if (apiConnection && apiSource !== ApiSource.OpenAICompatible) {
                return null;
              }

              return renderProviderListItem({
                apiSource,
                onOpenEdit: () => handleOnOpenEdit({ apiSource }),
              });
            })}
        </div>
      </section>

      {/* Request provider card */}
      <div className="mt-6 rounded-xl border border-dashed border-border-default bg-surface p-4">
        <p className="text-sm font-medium text-fg-default">
          Don&apos;t see your favorite provider?
        </p>
        <p className="mt-1 text-xs text-fg-muted">
          Drop a request in our{" "}
          <a
            href="https://discord.gg/J6ry7w8YCF"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-400 hover:text-brand-500"
          >
            Discord!
          </a>
        </p>
      </div>

      <DialogBase
        open={isOpenEdit}
        onOpenChange={setIsOpenEdit}
        title={`Connect ${editingApiConnection ? apiSourceLabel.get(editingApiConnection.source) : "Provider"}`}
        description={
          editingApiConnection?.source &&
          descriptionBySource.get(editingApiConnection.source) ? (
            <span className="text-sm leading-relaxed text-fg-muted [&>a]:text-brand-400 [&>a]:hover:text-brand-500">
              {descriptionBySource.get(editingApiConnection.source)}
            </span>
          ) : (
            "Enter your API credentials to enable this provider."
          )
        }
        size="md"
        content={
          <div className="space-y-4">
            {/* Base URL Input */}
            {editingApiConnection?.source &&
              showBaseUrl.get(editingApiConnection?.source) && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-fg-subtle">
                    Base URL
                  </label>
                  <div className="relative flex items-center">
                    <Link size={16} className="absolute left-3 text-fg-subtle" />
                    <input
                      type="text"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="http://localhost:11434"
                      className="h-10 w-full rounded-lg border border-border-default bg-surface pr-4 pl-9 text-sm text-fg-default placeholder-fg-subtle focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

            {/* OpenAI Compatible Base URL hint */}
            {editingApiConnection?.source === ApiSource.OpenAICompatible && (
              <div className="flex items-start gap-2 rounded-lg border border-border-default bg-surface p-3 text-xs text-fg-muted">
                <Info size={14} className="mt-0.5 shrink-0" />
                <span>
                  If the Base URL with <code className="rounded bg-surface-overlay px-1">/v1</code> doesn't work, try without{" "}
                  <code className="rounded bg-surface-overlay px-1">/v1</code>, or vice versa.
                </span>
              </div>
            )}

            {/* API Key Input */}
            {editingApiConnection?.source &&
              showApiKey.get(editingApiConnection?.source) && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-fg-subtle">
                    API Key
                  </label>
                  <div className="relative flex items-center">
                    <Key size={16} className="absolute left-3 text-fg-subtle" />
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="h-10 w-full rounded-lg border border-border-default bg-surface pr-4 pl-9 text-sm text-fg-default placeholder-fg-subtle focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

            {/* Model URL Input */}
            {editingApiConnection?.source &&
              showModelUrl.get(editingApiConnection?.source) && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-fg-subtle">
                    Model ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={modelUrl}
                    onChange={(e) => setModelUrl(e.target.value)}
                    placeholder="model-name"
                    className="h-10 w-full rounded-lg border border-border-default bg-surface px-4 text-sm text-fg-default placeholder-fg-subtle focus:border-brand-500 focus:outline-none"
                  />
                </div>
              )}

            {/* OpenRouter Provider Sorting */}
            {editingApiConnection?.source === ApiSource.OpenRouter && (
              <div className="space-y-2">
                <Combobox
                  label="Provider sorting option"
                  triggerPlaceholder="Provider sorting option"
                  searchPlaceholder=""
                  searchEmpty="No provider sorting found."
                  options={Array.from(openrouterProviderSortLabel.entries()).map(
                    ([value, label]) => ({
                      value: value,
                      label: label,
                    }),
                  )}
                  value={openrouterProviderSort?.toString()}
                  onValueChange={(value) => {
                    setOpenrouterProviderSort(value as OpenrouterProviderSort);
                  }}
                />
                <div className="flex items-center gap-1.5 text-xs text-fg-muted">
                  <Info size={12} />
                  <a
                    href="https://openrouter.ai/docs/features/provider-routing#price-based-load-balancing-default-strategy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-400 hover:text-brand-500"
                  >
                    Learn more
                  </a>{" "}
                  about provider sorting
                </div>
              </div>
            )}

            {/* Mistral hint */}
            {editingApiConnection?.source === ApiSource.Mistral && (
              <div className="flex items-start gap-2 rounded-lg border border-border-default bg-surface p-3 text-xs text-fg-muted">
                <Info size={14} className="mt-0.5 shrink-0" />
                <span>
                  It takes about a minute or two for Mistral to fully register a new API key.
                </span>
              </div>
            )}

            {/* OpenAI Compatible Title */}
            {editingApiConnection?.source === ApiSource.OpenAICompatible && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-fg-subtle">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., DeepSeek Production, Together.ai"
                  className="h-10 w-full rounded-lg border border-border-default bg-surface px-4 text-sm text-fg-default placeholder-fg-subtle focus:border-brand-500 focus:outline-none"
                />
              </div>
            )}
          </div>
        }
        footer={
          <div className="flex gap-3">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setIsOpenEdit(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={!validateEditForm() || isLoading}
              onClick={handleOnConnect}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Connect
            </Button>
          </div>
        }
      />
    </div>
  );
}
