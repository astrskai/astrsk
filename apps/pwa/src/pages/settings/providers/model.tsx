"use client";

import { Info, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { logger } from "@/shared/lib";

import { useApiConnections } from "@/shared/hooks/use-api-connections";
import { ApiService } from "@/app/services";
import { queryClient } from "@/shared/api/query-client";
import { apiConnectionQueries } from "@/entities/api/api-connection-queries";
import { Button } from "@/shared/ui/forms";
import { cn } from "@/shared/lib";
import {
  ProviderDisplay,
  ProviderDisplayDetailProps,
} from "./provider-display";
import {
  Combobox,
  FloatingLabelInput,
  TypoBase,
  TypoTiny,
  TypoXLarge,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui";

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
      <a href="https://ai.google.dev/aistudio" target="_blank">
        signin to Google AI studio
      </a>{" "}
      and 2){" "}
      <a href="https://aistudio.google.com/app/apikey" target="_blank">
        get API key here
      </a>
      .
    </>,
  ],
  [
    ApiSource.DeepSeek,
    <>
      If you do not have an API key, 1){" "}
      <a href="https://platform.deepseek.com/sign_in" target="_blank">
        signin to Deepseek
      </a>{" "}
      and 2){" "}
      <a href="https://platform.deepseek.com/api_keys" target="_blank">
        get API key here
      </a>
      .
    </>,
  ],
  [
    ApiSource.Anthropic,
    <>
      If you do not have an API key, 1){" "}
      <a href="https://claude.ai/login" target="_blank">
        signin to Anthropic
      </a>{" "}
      and 2){" "}
      <a href="https://console.anthropic.com/settings/keys" target="_blank">
        get API key here
      </a>
      .
    </>,
  ],
  [
    ApiSource.OpenAI,
    <>
      If you do not have an API key, 1){" "}
      <a href="https://auth.openai.com/log-in" target="_blank">
        signin to OpenAI
      </a>{" "}
      and 2){" "}
      <a href="https://platform.openai.com/api-keys" target="_blank">
        get API key here
      </a>
      .
    </>,
  ],
  [
    ApiSource.Mistral,
    <>
      If you do not have an API key, 1){" "}
      <a href="https://auth.mistral.ai/ui/login" target="_blank">
        signin to Mistral
      </a>{" "}
      and 2){" "}
      <a href="https://console.mistral.ai/api-keys" target="_blank">
        get API key here
      </a>
      .
    </>,
  ],
  [
    ApiSource.xAI,
    <>
      If you do not have an API key, 1){" "}
      <a href="https://accounts.x.ai/sign-in" target="_blank">
        signin to xAI
      </a>{" "}
      and 2){" "}
      <a href="https://console.x.ai/team/default/api-keys" target="_blank">
        get API key here
      </a>
      .
    </>,
  ],
  [
    ApiSource.OpenRouter,
    <>
      If you do not have an API key, 1){" "}
      <a href="https://openrouter.ai/" target="_blank">
        signin to OpenRouter
      </a>{" "}
      and 2){" "}
      <a href="https://openrouter.ai/settings/keys" target="_blank">
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
    if (showModelUrl.get(source)) {
      details.push({
        label: "Model ID",
        value: apiConnection.modelUrls?.join(", ") ?? "",
      });
    }
    if (showBaseUrl.get(source)) {
      details.push({
        label: "Base URL",
        value: apiConnection.baseUrl ?? "",
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

export default function ModelPage({ className }: { className?: string }) {
  // 1. State hooks
  const [isOpenEdit, setIsOpenEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingApiConnection, setEditingApiConnection] =
    useState<ApiConnection | null>(null);
  const [apiKey, setApiKey] = useState<string>("");
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [openrouterProviderSort, setOpenrouterProviderSort] =
    useState<OpenrouterProviderSort | null>(null);
  const [modelUrl, setModelUrl] = useState<string>("");

  // 2. Custom hooks (data fetching)
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
    [],
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
        toast.error("Failed to connect provider", {
          description: error.message,
        });
      }
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
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
          toast.error("Failed to disconnect provider", {
            description: error.message,
          });
        }
      }
    },
    [invalidateApiConnections],
  );

  return (
    <div className={cn("flex h-full flex-col overflow-hidden", className)}>
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full px-4 py-4 md:max-w-6xl md:py-20">
          {/* Desktop title - hidden on mobile */}
          <TypoXLarge className="text-text-primary mb-8 hidden font-semibold md:block">
            Providers
          </TypoXLarge>

          <div className="flex flex-col items-center gap-4 pb-4 md:mt-8 md:flex-row md:flex-wrap md:justify-center">
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
            <div className="bg-background-surface-3 relative w-full shrink-0 rounded-lg md:h-[186px] md:w-[335px]">
              <div className="flex w-full flex-col justify-start gap-2 p-6 md:justify-center md:p-8">
                <div className="text-text-secondary text-left text-base leading-5 font-semibold">
                  Don&apos;t see your favorite provider?
                </div>
                <div className="text-text-input-subtitle [&>a]:text-secondary-normal text-left text-xs leading-[15px] font-normal">
                  Drop a request in our{" "}
                  <a href="https://discord.gg/J6ry7w8YCF" target="_blank">
                    Discord!
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isOpenEdit} onOpenChange={setIsOpenEdit}>
        <DialogContent
          className="bg-background-surface-2 border-border-light border"
          hideClose
        >
          <DialogHeader>
            <DialogTitle>Connect provider</DialogTitle>
            <DialogDescription>
              <TypoBase className="text-text-subtle [&>a]:text-secondary-normal font-[400]">
                {editingApiConnection?.source &&
                  descriptionBySource.get(editingApiConnection.source)}
              </TypoBase>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <TypoTiny className="text-text-input-subtitle">Provider</TypoTiny>
            <TypoBase className="text-text-primary">
              {editingApiConnection &&
                apiSourceLabel.get(editingApiConnection.source)}
            </TypoBase>
          </div>
          {editingApiConnection?.source &&
            showBaseUrl.get(editingApiConnection?.source) && (
              <FloatingLabelInput
                label="Base URL*"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            )}
          {editingApiConnection?.source === ApiSource.OpenAICompatible && (
            <div
              className={cn(
                "mt-[-16px] flex flex-row items-start gap-[4px]",
                "text-text-secondary text-[16px] leading-[19px] font-[400]",
                "[&>a]:text-secondary-normal",
              )}
            >
              <div className="pt-[1px]">
                <Info size={16} />
              </div>
              <div>
                If the Base URL with <code>/v1</code> doesn't work, try without{" "}
                <code>/v1</code>, or vice versa.
              </div>
            </div>
          )}
          {editingApiConnection?.source &&
            showApiKey.get(editingApiConnection?.source) && (
              <FloatingLabelInput
                label="API key*"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            )}
          {editingApiConnection?.source &&
            showModelUrl.get(editingApiConnection?.source) && (
              <FloatingLabelInput
                label="Model ID (Optional)"
                value={modelUrl}
                onChange={(e) => setModelUrl(e.target.value)}
              />
            )}
          {editingApiConnection?.source === ApiSource.OpenRouter && (
            <div className="flex flex-col gap-[8px]">
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
              <div
                className={cn(
                  "flex flex-row items-center gap-[4px]",
                  "text-text-secondary text-[16px] leading-[19px] font-[400]",
                  "[&>a]:text-secondary-normal",
                )}
              >
                <Info size={16} />
                <a
                  href="https://openrouter.ai/docs/features/provider-routing#price-based-load-balancing-default-strategy"
                  target="_blank"
                >
                  Learn more
                </a>{" "}
                about the OpenRouter sorting options
              </div>
            </div>
          )}
          {editingApiConnection?.source === ApiSource.Mistral && (
            <div
              className={cn(
                "mt-[-16px] flex flex-row items-start gap-[4px]",
                "text-text-secondary text-[16px] leading-[19px] font-[400]",
                "[&>a]:text-secondary-normal",
              )}
            >
              <div className="pt-[1px]">
                <Info size={16} />
              </div>
              <div>
                Please notes that it takes about a minute or two for Mistral to
                fully register a new API on their system.
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              disabled={!validateEditForm() || isLoading}
              onClick={handleOnConnect}
            >
              {isLoading && <Loader2 className="animate-spin" />}
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
