"use client";

import { Info, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { logger } from "@/shared/utils";

import { useApiConnections } from "@/app/hooks/use-api-connections";
import { ApiService } from "@/app/services";
import { queryClient } from "@/app/queries/query-client";
import { apiConnectionQueries } from "@/app/queries/api-connection-queries";
import { Combobox } from "@/components/ui/combobox";
import { cn } from "@/shared/lib/cn";
import {
  ProviderListItem,
  ProviderListItemDetail,
} from "@/features/settings/providers/provider-list-item";
import { TypoBase, TypoTiny, TypoXLarge } from "@/components/ui/typo";
import { Button } from "@/components-v2/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components-v2/ui/dialog";
import { FloatingLabelInput } from "@/components-v2/ui/floating-label-input";
import { ScrollArea } from "@/components-v2/ui/scroll-area";
import { TableName } from "@/db/schema/table-name";
import {
  ApiConnection,
  ApiSource,
  apiSourceLabel,
  OpenrouterProviderSort,
  openrouterProviderSortLabel,
} from "@/modules/api/domain";

const maskApiKey = (apiKey?: string) => {
  if (!apiKey) {
    return "";
  }
  if (apiKey.length <= 12) {
    return `...${apiKey.slice(-4)}`;
  }
  const firstPart = apiKey.slice(0, 8);
  const lastPart = apiKey.slice(-4);
  return `${firstPart}...${lastPart}`;
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
  const details: ProviderListItemDetail[] = [];
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
    <ProviderListItem
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
  ApiSource.KoboldCPP,
  ApiSource.AIHorde,
  // ApiSource.Wllama,
  ApiSource.OpenAICompatible,
];

export default function ModelPage({ className }: { className?: string }) {
  const [apiConnections] = useApiConnections({});

  // Invalidate api connections
  const invalidateApiConnections = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: apiConnectionQueries.all(),
    });
  }, []);

  // Edit connection
  const [isOpenEdit, setIsOpenEdit] = useState(false);
  const [editingApiConnection, setEditingApiConnection] =
    useState<ApiConnection | null>(null);
  const [apiKey, setApiKey] = useState<string>("");
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [openrouterProviderSort, setOpenrouterProviderSort] =
    useState<OpenrouterProviderSort | null>(null);
  const [modelUrl, setModelUrl] = useState<string>("");
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

  // Save api connection
  const [isLoading, setIsLoading] = useState(false);
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
      if (
        editingApiConnection.source === ApiSource.OpenRouter &&
        openrouterProviderSort
      ) {
        editingApiConnection.setOpenrouterProviderSort(openrouterProviderSort);
      }

      // Check api key is valid
      const checkApiKeyResult =
        await ApiService.checkApiKey.execute(editingApiConnection);
      if (checkApiKeyResult.isFailure) {
        throw new Error(checkApiKeyResult.getError());
      }
      if (checkApiKeyResult.isSuccess && !checkApiKeyResult.getValue()) {
        throw new Error("API key is invalid");
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
  }, [
    apiKey,
    baseUrl,
    editingApiConnection,
    invalidateApiConnections,
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
    <ScrollArea className={cn("bg-background-surface-1 h-full", className)}>
      <div className={cn("mx-auto my-[70px] max-w-[1100px]")}>
        <TypoXLarge className="text-text-primary font-semibold">
          Providers
        </TypoXLarge>

        <div className="flex flex-wrap justify-start pt-[32px] pr-0 pb-[16px]">
          {apiConnections
            ?.filter(
              (
                apiConnection: ApiConnection,
                index: number,
                array: ApiConnection[],
              ) => {
                // For AstrskAi connections, only keep the first occurrence
                if (apiConnection.source === ApiSource.AstrskAi) {
                  return false;
                } else {
                  return true;
                }
              },
            )
            ?.map((apiConnection: ApiConnection) =>
              renderProviderListItem({
                apiConnection: apiConnection,
                onOpenEdit: () => {
                  if (apiConnection.source === ApiSource.AstrskAi) {
                    return;
                  }
                  handleOnOpenEdit({
                    apiConnection: apiConnection,
                  });
                },
                onDisconnect: (usedResourceIds) => {
                  if (apiConnection.source === ApiSource.AstrskAi) {
                    return;
                  }
                  handleOnDisconnect(apiConnection, usedResourceIds);
                },
              }),
            )}
          {providerOrder.map((apiSource) => {
            // Get api connection by provider
            const apiConnection = getApiConnectionByApiSource({
              apiConnections: apiConnections,
              source: apiSource,
            });

            // Provider is already connected
            if (apiConnection && apiSource !== ApiSource.OpenAICompatible) {
              return null;
            }

            // Provider is not connected
            return renderProviderListItem({
              apiSource: apiSource,
              onOpenEdit: () =>
                handleOnOpenEdit({
                  apiSource: apiSource,
                }),
            });
          })}
          <div
            className={cn(
              "relative inline-block align-top",
              "mr-[16px] mb-[calc(-6px+16px)] h-[186px] w-[335px]",
              "bg-background-surface-3 rounded-[8px]",
            )}
          >
            <div className="flex h-full w-full flex-col justify-center gap-[8px] p-[32px]">
              <div className="text-text-secondary text-[16px] leading-[20px] font-[600]">
                Don&apos;t see your favorite provider?
              </div>
              <div className="text-text-input-subtitle [&>a]:text-secondary-normal text-[12px] leading-[15px] font-[400]">
                Drop a request in our{" "}
                <a href="https://discord.gg/J6ry7w8YCF" target="_blank">
                  Discord!
                </a>
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
              <Button size="lg" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button
              size="lg"
              disabled={!validateEditForm() || isLoading}
              onClick={handleOnConnect}
            >
              {isLoading && <Loader2 className="animate-spin" />}
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScrollArea>
  );
}
