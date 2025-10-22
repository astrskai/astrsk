"use client";

import { ChevronLeft, Info, Loader2 } from "lucide-react";
import { TopNavigation } from "@/components/layout/top-navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { logger } from "@/shared/utils";

import { useApiConnections } from "@/app/hooks/use-api-connections";
import { ApiService } from "@/app/services";
import { queryClient } from "@/app/queries/query-client";
import { apiConnectionQueries } from "@/app/queries/api-connection-queries";
import { Combobox } from "@/components/ui/combobox";
import { cn } from "@/components-v2/lib/utils";
import {
  ProviderListItem,
  ProviderListItemDetail,
  apiSourceLogo,
} from "@/features/settings/providers/provider-list-item";
import { SvgIcon } from "@/components/ui/svg-icon";
import { TypoBase, TypoSmall, TypoTiny } from "@/components/ui/typo";
import { Button } from "@/components-v2/ui/button";
import { Card, CardContent } from "@/components-v2/ui/card";
import { Sheet, SheetContent } from "@/components-v2/ui/sheet";
import { FloatingLabelInput } from "@/components-v2/ui/floating-label-input";
import { ScrollArea, ScrollBar } from "@/components-v2/ui/scroll-area";
import { useMobileNavigation } from "@/contexts/mobile-navigation-context";
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
  isMobile = false,
}: {
  apiConnection?: ApiConnection;
  apiSource?: ApiSource;
  onOpenEdit?: () => void;
  onDisconnect?: (usedResourceIds: {
    flowIds: UniqueEntityID[];
    sessionIds: UniqueEntityID[];
  }) => void;
  isMobile?: boolean;
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

  // For mobile, render consistent card styling for both connected and non-connected providers
  if (isMobile) {
    const providerName = apiSourceLabel.get(source) ?? source;
    const logo = apiSourceLogo.get(source);

    // For non-connected providers, create a simplified card view
    if (!apiConnection) {
      return (
        <Card
          key={source.toString()}
          className={cn(
            "group/card relative cursor-pointer overflow-hidden rounded-[8px]",
            "border-border-container border",
            source === ApiSource.AstrskAi &&
              "bg-button-foreground-primary border-border-light",
          )}
          onClick={onOpenEdit}
        >
          <CardContent className="bg-background-surface-3 p-4">
            <div className="flex items-center gap-3">
              {logo && <SvgIcon name={logo} size={32} />}
              <div className="text-text-primary text-[20px] leading-[24px] font-[600]">
                {providerName}
              </div>
            </div>
          </CardContent>
          <div
            className={cn(
              "pointer-events-none absolute inset-0 rounded-[8px]",
              "inset-ring-primary-normal inset-ring-2",
              "hidden group-hover/card:block",
            )}
          />
        </Card>
      );
    }

    // For connected providers, create a mobile-optimized version that matches desktop design
    return (
      <Card
        key={apiConnection.id.toString()}
        className={cn(
          "group/card relative cursor-pointer overflow-hidden rounded-[8px]",
          "border-border-container border",
          "bg-background-surface-3",
          source === ApiSource.AstrskAi &&
            "bg-button-foreground-primary border-border-light",
        )}
        onClick={onOpenEdit}
      >
        <CardContent className="flex flex-row p-0">
          {/* Left panel - main content */}
          <div className="flex-1 p-4">
            <div className="mb-3 flex items-center gap-3">
              {logo && <SvgIcon name={logo} size={32} />}
              <div className="text-text-primary text-[20px] leading-[24px] font-[600]">
                {source === ApiSource.AstrskAi ? (
                  <SvgIcon
                    name="astrsk_logo_typo"
                    width={63.24}
                    height={17.8}
                  />
                ) : (
                  providerName
                )}
              </div>
            </div>

            {/* Show details for non-astrsk providers or promotional text for astrsk */}
            {source === ApiSource.AstrskAi ? (
              <div className="text-text-input-subtitle text-[12px] leading-[15.6px] font-[600]">
                To mark our v1.0 release,
                <br />
                <span className="text-text-muted-title">
                  Gemini 2.5 Flash is on the house
                </span>
                <br />
                for all users for a limited period!
              </div>
            ) : (
              details.length > 0 && (
                <div className="space-y-2">
                  {details.map((detail) => (
                    <div key={detail.label} className="flex flex-col gap-1">
                      <TypoTiny className="text-text-input-subtitle">
                        {detail.label}
                      </TypoTiny>
                      <TypoSmall className="text-text-primary truncate">
                        {detail.value}
                      </TypoSmall>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Right panel - indicator/status */}
          <div
            className={cn(
              "flex min-w-[40px] flex-col items-center justify-center",
              "bg-background-surface-2",
              source === ApiSource.AstrskAi && "bg-primary-dark",
            )}
          >
            <div
              className="h-2 w-2 rounded-full bg-green-500"
              title="Connected"
            />
          </div>
        </CardContent>
        <div
          className={cn(
            "pointer-events-none absolute inset-0 rounded-[8px]",
            "inset-ring-primary-normal inset-ring-2",
            "hidden group-hover/card:block",
          )}
        />
      </Card>
    );
  }

  // For desktop, use the full ProviderListItem component with buttons
  const item = (
    <ProviderListItem
      key={apiConnection?.id.toString() ?? source.toString()}
      apiSource={source}
      details={details}
      isActive={!!apiConnection}
      onOpenEdit={onOpenEdit}
      onDisconnect={onDisconnect}
      hideButton
    />
  );

  return item;
};

const providerOrder: ApiSource[] = [
  ApiSource.AstrskAi,
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

interface ModelPageMobileProps {
  className?: string;
}

export default function ModelPageMobile({ className }: ModelPageMobileProps) {
  const { setIsOpen } = useMobileNavigation();
  const [apiConnections] = useApiConnections({});

  // Connect page state
  const [showConnectPage, setShowConnectPage] = useState(false);

  // Invalidate api connections
  const invalidateApiConnections = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: apiConnectionQueries.all(),
    });
  }, []);

  // Edit connection
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

      // Open connect page
      setShowConnectPage(true);
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

    // Check model URL
    if (showModelUrl.get(source)) {
      if (modelUrl.trim() === "") {
        return false;
      }
    }

    // Form is valid
    return true;
  }, [apiKey, baseUrl, editingApiConnection, modelUrl]);

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

      // Close connect page
      setShowConnectPage(false);

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
    <div
      className={cn("bg-background-surface-2 flex h-dvh flex-col", className)}
    >
      {/* Mobile Header */}
      <TopNavigation title="Providers" onMenuClick={() => setIsOpen(true)} />

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="space-y-3 p-4">
          {/* Active Connections */}
          {apiConnections && apiConnections.length > 0 && (
            <>
              {apiConnections.map((apiConnection: ApiConnection) =>
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
                  isMobile: true,
                }),
              )}
            </>
          )}

          {/* Available Providers */}
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
              isMobile: true,
            });
          })}

          {/* Request Provider Card */}
          <div className="bg-background-surface-3 w-full rounded-[8px] p-8">
            <div className="flex flex-col gap-2 text-center">
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
        <ScrollBar orientation="vertical" className="w-1.5" />
      </ScrollArea>

      {/* Provider Connection Sheet */}
      <Sheet open={showConnectPage} onOpenChange={setShowConnectPage}>
        <SheetContent
          side="right"
          className="bg-background-surface-2 flex h-full w-full flex-col p-0"
          hideClose
        >
          {editingApiConnection && (
            <>
              {/* Connect Page Header */}
              <TopNavigation
                title={
                  apiSourceLabel.get(editingApiConnection.source) ||
                  "Connect Provider"
                }
                leftAction={
                  <Button
                    variant="ghost_white"
                    size="icon"
                    className="h-[40px] w-[40px] p-[8px]"
                    onClick={() => setShowConnectPage(false)}
                  >
                    <ChevronLeft className="min-h-6 min-w-6" />
                  </Button>
                }
              />

              {/* Connect Form Content - Scrollable */}
              <div className="flex flex-1 flex-col justify-center overflow-y-auto">
                <div className="space-y-6 p-6">
                  {/* Description */}
                  {editingApiConnection.source &&
                    descriptionBySource.get(editingApiConnection.source) && (
                      <div className="text-text-input-subtitle [&>a]:text-secondary-normal [&>a]:underline">
                        {descriptionBySource.get(editingApiConnection.source)}
                      </div>
                    )}

                  {/* Provider Info */}
                  <div className="flex flex-col gap-2">
                    <TypoTiny className="text-text-input-subtitle">
                      Provider
                    </TypoTiny>
                    <TypoBase className="text-text-primary">
                      {apiSourceLabel.get(editingApiConnection.source)}
                    </TypoBase>
                  </div>

                  {/* Form Fields */}
                  {editingApiConnection.source &&
                    showBaseUrl.get(editingApiConnection.source) && (
                      <FloatingLabelInput
                        label="Base URL"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                      />
                    )}
                  {editingApiConnection.source ===
                    ApiSource.OpenAICompatible && (
                    <div
                      className={cn(
                        "flex flex-row items-start gap-[4px]",
                        "text-text-secondary text-[14px] leading-[17px] font-[400]",
                        "[&>a]:text-secondary-normal [&>a]:underline",
                      )}
                    >
                      <div className="pt-[1px]">
                        <Info size={16} />
                      </div>
                      <div>
                        If the Base URL with <code>/v1</code> doesn't work, try
                        without <code>/v1</code>, or vice versa.
                      </div>
                    </div>
                  )}
                  {editingApiConnection.source &&
                    showApiKey.get(editingApiConnection.source) && (
                      <FloatingLabelInput
                        label="API Key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                      />
                    )}
                  {editingApiConnection.source &&
                    showModelUrl.get(editingApiConnection.source) && (
                      <FloatingLabelInput
                        label="Model ID"
                        value={modelUrl}
                        onChange={(e) => setModelUrl(e.target.value)}
                      />
                    )}
                  {editingApiConnection.source === ApiSource.OpenRouter && (
                    <div className="flex flex-col gap-[8px]">
                      <Combobox
                        label="Provider sorting option"
                        triggerPlaceholder="Openrouter default"
                        searchPlaceholder=""
                        searchEmpty="No provider sorting found."
                        options={Array.from(
                          openrouterProviderSortLabel.entries(),
                        ).map(([value, label]) => ({
                          value: value,
                          label: label,
                        }))}
                        value={openrouterProviderSort?.toString()}
                        onValueChange={(value) => {
                          setOpenrouterProviderSort(
                            value as OpenrouterProviderSort,
                          );
                        }}
                      />
                      <div
                        className={cn(
                          "flex flex-row items-center gap-[4px]",
                          "text-text-secondary text-[14px] leading-[17px] font-[400]",
                          "[&>a]:text-secondary-normal [&>a]:underline",
                        )}
                      >
                        <Info size={16} />
                        <a
                          href="https://openrouter.ai/docs/features/provider-routing#price-based-load-balancing-default-strategy"
                          target="_blank"
                        >
                          Learn more about the OpenRouter sorting options
                        </a>
                      </div>
                    </div>
                  )}
                  {editingApiConnection.source === ApiSource.Mistral && (
                    <div
                      className={cn(
                        "flex flex-row items-start gap-[4px]",
                        "text-text-secondary text-[14px] leading-[17px] font-[400]",
                        "[&>a]:text-secondary-normal [&>a]:underline",
                      )}
                    >
                      <div className="pt-[1px]">
                        <Info size={16} />
                      </div>
                      <div>
                        Please notes that it takes about a minute or two for
                        Mistral to fully register a new API on their system.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Buttons at Bottom */}
              <div className="bg-background-surface-2 shrink-0 p-6 pt-0">
                {/* Check if this is a new connection (no existing connection with this source) */}
                {!apiConnections?.find(
                  (conn: ApiConnection) =>
                    conn.source === editingApiConnection.source,
                ) ? (
                  // New connection - only show Connect button
                  <Button
                    className="h-12 w-full"
                    disabled={!validateEditForm() || isLoading}
                    onClick={handleOnConnect}
                  >
                    {isLoading && <Loader2 className="mr-2 animate-spin" />}
                    Connect
                  </Button>
                ) : (
                  // Existing connection - show Save and Disconnect buttons horizontally
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="h-12 flex-1"
                      onClick={() => {
                        const existingConnection = apiConnections?.find(
                          (conn: ApiConnection) =>
                            conn.source === editingApiConnection.source,
                        );
                        if (existingConnection) {
                          handleOnDisconnect(existingConnection, {
                            flowIds: [],
                            sessionIds: [],
                          });
                        }
                        setShowConnectPage(false);
                      }}
                      disabled={isLoading}
                    >
                      Disconnect
                    </Button>
                    <Button
                      className="h-12 flex-1"
                      disabled={!validateEditForm() || isLoading}
                      onClick={handleOnConnect}
                    >
                      {isLoading && <Loader2 className="mr-2 animate-spin" />}
                      Save
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
