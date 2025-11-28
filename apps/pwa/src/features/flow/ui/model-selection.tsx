import { useEffect, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { useQuery } from "@tanstack/react-query";

import { Agent, ModelTier } from "@/entities/agent/domain/agent";
import { apiConnectionQueries } from "@/entities/api/api-connection-queries";
import { ApiSource, apiSourceLabel } from "@/entities/api/domain";
import { ApiModel } from "@/entities/api/domain/api-model";
import { TaskType } from "@/entities/flow/domain/flow";
import type { ApiConnectionWithModels } from "@/shared/hooks/use-api-connections-with-models";
import { MobileOverrideProvider } from "@/shared/hooks/use-mobile-override";
import { useModelStore } from "@/shared/stores/model-store";
import { Combobox, ComboboxOption } from "@/shared/ui";

// Special values for tier-based model selection
const MODEL_TIER_VALUES = {
  LIGHT: "model-tier|light",
  HEAVY: "model-tier|heavy",
} as const;

const getApiModelValue = (
  apiSource: string,
  modelId: string,
  modelName: string,
  apiConnectionId?: string,
) => {
  if (!apiConnectionId) {
    return `${apiSource}|${modelId}|${modelName}`;
  }
  return `api-model|${apiConnectionId}|${apiSource}|${modelId}|${modelName}`;
};

// Get display name for tier-based model (shows configured default or "Not configured")
const getTierModelDisplayName = (tier: ModelTier): string => {
  const modelStore = useModelStore.getState();
  const defaultModel = tier === ModelTier.Heavy
    ? modelStore.defaultStrongModel
    : modelStore.defaultLiteModel;

  if (defaultModel) {
    return defaultModel.modelName;
  }
  return "Not configured";
};

// Model options
const modelOptions = (
  apiConnectionsWithModels: ApiConnectionWithModels[],
): ComboboxOption[] => {
  const options: ComboboxOption[] = [];

  // Add tier-based options at the top (Light Model, Heavy Model)
  const lightDisplayName = getTierModelDisplayName(ModelTier.Light);
  const heavyDisplayName = getTierModelDisplayName(ModelTier.Heavy);

  options.push({
    label: "Default Models",
    value: "default-models-group",
    sub: [
      {
        label: `Light Model (${lightDisplayName})`,
        value: MODEL_TIER_VALUES.LIGHT,
      },
      {
        label: `Strong Model (${heavyDisplayName})`,
        value: MODEL_TIER_VALUES.HEAVY,
      },
    ],
  });

  // Add all provider models
  if (apiConnectionsWithModels) {
    for (const apiConnectionWithModels of apiConnectionsWithModels) {
      const { apiConnection, models } = apiConnectionWithModels;

      // TEMPORARY: Hide astrsk connections from model selection
      if (apiConnection.source === ApiSource.AstrskAi) {
        continue;
      }

      // Show "Title - Provider Type" format (e.g., "DeepSeek Production - OpenAI Compatible")
      const providerLabel = apiSourceLabel.get(apiConnection.source) || "";
      const displayLabel = apiConnection.title && apiConnection.title !== apiConnection.source
        ? `${apiConnection.title} - ${providerLabel}`
        : providerLabel;

      options.push({
        label: displayLabel,
        value: apiConnection.id.toString(),
        sub: models.map((model: ApiModel) => ({
          label: model.name,
          value: getApiModelValue(
            apiConnection.source,
            model.id,
            model.name,
            apiConnection.id.toString(),
          ),
        })),
      });
    }
  }

  return options;
};

/**
 * Flattens nested combobox options into a flat array of values
 */
const flattenOptions = (opts: ComboboxOption[]): string[] =>
  opts.flatMap((opt) => (opt.sub ? flattenOptions(opt.sub) : [opt.value]));

/**
 * Extracts the actual model ID from a potentially encoded modelId
 * For OpenAI Compatible, modelId is stored as "{title}|{actualModelId}"
 */
const extractActualModelId = (modelId: string | undefined, apiSource: string): string | undefined => {
  if (!modelId) return undefined;
  if (apiSource === ApiSource.OpenAICompatible && modelId.includes("|")) {
    return modelId.split("|").pop();
  }
  return modelId;
};

/**
 * Checks if an option value matches the stored model data
 * Option value format: "api-model|connectionId|source|modelId|modelName"
 */
const isMatchingOption = (
  optionValue: string,
  apiSource: string,
  modelId: string | undefined,
  modelName: string,
): boolean => {
  const parts = optionValue.split("|");
  if (parts.length < 5) return false;

  const [, , valueApiSource, valueModelId, valueModelName] = parts;

  if (valueApiSource !== apiSource) return false;
  if (valueModelName !== modelName) return false;

  // For Astrsk AI, only compare by model name (modelId format varies)
  if (apiSource === ApiSource.AstrskAi) return true;

  // For other sources, compare modelId
  const actualModelId = extractActualModelId(modelId, apiSource);
  return valueModelId === actualModelId;
};

/**
 * Finds the matching option value for the current model selection
 * Priority: specific model > model tier
 */
const getIntendedModelValue = (
  apiSource: string,
  modelId: string | undefined,
  modelName: string,
  allValues: string[] | undefined,
  modelTier?: ModelTier,
): string | undefined => {
  // Priority 1: Find specific model by apiSource/modelId/modelName
  if (allValues && apiSource && modelName) {
    const matchingValue = allValues.find((value) =>
      isMatchingOption(value, apiSource, modelId, modelName)
    );
    if (matchingValue) return matchingValue;
  }

  // Priority 2: Fall back to model tier if no specific model found
  if (modelTier) {
    return modelTier === ModelTier.Heavy
      ? MODEL_TIER_VALUES.HEAVY
      : MODEL_TIER_VALUES.LIGHT;
  }

  return undefined;
};

// Check if a model exists in the available API connections
const isModelAvailable = (
  modelName: string | undefined,
  apiSource: string | undefined,
  modelId: string | undefined,
  apiConnectionsWithModels: ApiConnectionWithModels[],
): boolean => {
  if (!modelName || !apiSource || !modelId) {
    return false;
  }

  for (const apiConnectionWithModels of apiConnectionsWithModels) {
    const { apiConnection, models } = apiConnectionWithModels;

    if (apiConnection.source === apiSource) {
      for (const model of models) {
        if (model.id === modelId && model.name === modelName) {
          return true;
        }
      }
    }
  }

  return false;
};

const UIType = {
  Large: "large",
  Simple: "simple",
} as const;

type UIType = (typeof UIType)[keyof typeof UIType];

const PromptItem = ({
  name,
  taskType,
  uiType = UIType.Large,
  modelChanged,
  agent,
}: {
  name: string;
  taskType: TaskType;
  uiType: UIType;
  modelChanged: (
    modelName?: string,
    isDirtyFromModel?: boolean,
    modelInfo?: { apiSource?: string; modelId?: string; modelTier?: ModelTier },
  ) => void;
  agent: Agent | undefined;
}) => {
  // Get current zoom level from React Flow
  const reactFlow = useReactFlow();
  const zoomScale = reactFlow.getViewport().zoom;

  const { data: apiConnectionsWithModels, refetch } = useQuery(
    apiConnectionQueries.listWithModels(),
  );

  // Refetch on mount to ensure fresh data
  useEffect(() => {
    refetch();
  }, [refetch]);

  const options = modelOptions(apiConnectionsWithModels ?? []);
  const allValues = flattenOptions(options);

  const handleModelChange = (
    apiConnectionId: string,
    apiSource: string,
    modelId: string,
    modelName: string,
  ) => {
    if (!agent) return;

    // For OpenAI compatible, encode title into modelId: "{title}|{actualModelId}"
    let finalModelId = modelId;
    if (apiSource === ApiSource.OpenAICompatible && apiConnectionId && apiConnectionsWithModels) {
      const connection = apiConnectionsWithModels.find(
        (c: ApiConnectionWithModels) => c.apiConnection.id.toString() === apiConnectionId
      );
      if (connection?.apiConnection.title) {
        finalModelId = `${connection.apiConnection.title}|${modelId}`;
      }
    }

    // Pass the full model information to the parent
    if (modelName) {
      modelChanged(modelName, true, {
        apiSource: apiSource,
        modelId: finalModelId,
      });
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="col-span-2">
        <Combobox
          label="Model"
          triggerPlaceholder="Select models"
          searchPlaceholder="Search models..."
          searchEmpty="No model found."
          zoomScale={zoomScale}
          isZoom={true}
          options={options}
          value={getIntendedModelValue(
            agent?.props.apiSource ?? "",
            agent?.props.modelId,
            agent?.props.modelName ?? "",
            allValues,
            agent?.props.modelTier,
          )}
          onValueChange={(selectedValue) => {
            // Handle tier-based selection (Light/Heavy Model)
            if (selectedValue.startsWith("model-tier|")) {
              const tier = selectedValue.split("|")[1] as "light" | "heavy";
              const tierEnum = tier === "heavy" ? ModelTier.Heavy : ModelTier.Light;
              const displayName = tier === "heavy" ? "Strong Model" : "Light Model";

              // Notify parent with tier info (mutation handles optimistic update)
              modelChanged(displayName, true, {
                apiSource: undefined,
                modelId: undefined,
                modelTier: tierEnum,
              });
              return;
            }

            // Handle specific model selection
            const splittedValue = selectedValue.split("|");
            handleModelChange(
              splittedValue[1],
              splittedValue[2],
              splittedValue[3],
              splittedValue[4],
            );
          }}
          // disabled={!promptId}
        />
      </div>
    </div>
  );
};

const ModelItem = ({
  connectionChanged,
  forceMobile = false,
}: {
  connectionChanged: (
    apiSource: string,
    modelId: string,
    modelName: string,
  ) => void;
  forceMobile?: boolean;
}) => {
  const [apiSource, setApiSource] = useState<string>("");
  const [modelId, setModelId] = useState<string>("");
  const [modelName, setModelName] = useState<string>("");

  const { data: apiConnectionsWithModels } = useQuery(
    apiConnectionQueries.listWithModels(),
  );

  const handleModelChange = (
    _apiConnectionId: string,
    apiSource: string,
    modelId: string,
    modelName: string,
  ) => {
    setApiSource(apiSource);
    setModelId(modelId);
    setModelName(modelName);
    connectionChanged(apiSource, modelId, modelName);
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="col-span-2">
        <MobileOverrideProvider forceMobile={forceMobile}>
          <Combobox
            label="Model"
            triggerPlaceholder="Select models"
            searchPlaceholder="Search models..."
            searchEmpty="No model found."
            options={modelOptions(apiConnectionsWithModels ?? [])}
            value={getIntendedModelValue(
              apiSource ?? "",
              modelId,
              modelName ?? "",
              flattenOptions(modelOptions(apiConnectionsWithModels ?? [])),
            )}
            onValueChange={(selectedValue) => {
              const splittedValue = selectedValue.split("|");
              handleModelChange(
                splittedValue[1],
                splittedValue[2],
                splittedValue[3],
                splittedValue[4],
              );
            }}
          />
        </MobileOverrideProvider>
      </div>
    </div>
  );
};

const AgentModels = ({
  agent,
  modelChanged,
}: {
  agent: Agent | undefined;
  modelChanged: (
    modelName?: string,
    isDirtyFromModel?: boolean,
    modelInfo?: { apiSource?: string; modelId?: string; modelTier?: ModelTier },
  ) => void;
}) => {
  return (
    <div className="flex flex-col gap-8">
      <PromptItem
        name="AI response"
        taskType={TaskType.AiResponse}
        uiType={UIType.Simple}
        agent={agent}
        modelChanged={modelChanged}
      />
    </div>
  );
};

export { AgentModels, ModelItem, isModelAvailable };
// export type { StepPromptsSchemaType };
