// TODO: remove this file

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useReactFlow } from "@xyflow/react";

import { useQuery } from "@tanstack/react-query";
import { apiConnectionQueries } from "@/app/queries/api-connection-queries";
import type { ApiConnectionWithModels } from "@/app/hooks/use-api-connections-with-models";
import { Combobox, ComboboxOption } from "@/shared/ui";
import { MobileOverrideProvider } from "@/shared/hooks/use-mobile-override";

import { Agent } from "@/entities/agent/domain/agent";
import { ApiSource, apiSourceLabel } from "@/entities/api/domain";
import { ApiModel } from "@/entities/api/domain/api-model";
import { TaskType } from "@/entities/flow/domain/flow";

const PromptAndModelSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("api-model"),

    // Prompt
    promptId: z.string(),

    // API Model
    apiConnectionId: z.string(),
    apiSource: z.string(),
    modelId: z.string(),
    modelName: z.string(),
    tokenizerType: z.string().nullable(),
    openrouterProvider: z.string().nullable(),

    // Pinned Model
    pinnedModelId: z.null(),
  }),
  z.object({
    type: z.literal("pinned-model"),

    // Prompt
    promptId: z.string(),

    // API Model
    apiConnectionId: z.null(),
    apiSource: z.null(),
    modelId: z.null(),
    modelName: z.null(),
    tokenizerType: z.null(),
    openrouterProvider: z.null(),

    // Pinned Model
    pinnedModelId: z.string(),
  }),
]);

const StepPromptsSchema = z.object({
  aiResponse: PromptAndModelSchema,
  userResponse: PromptAndModelSchema,
});

type StepPromptsSchemaType = z.infer<typeof StepPromptsSchema>;

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

// Model options
const modelOptions = (
  apiConnectionsWithModels: ApiConnectionWithModels[],
): ComboboxOption[] => {
  const options: ComboboxOption[] = [];

  // Add all models
  if (apiConnectionsWithModels) {
    for (const apiConnectionWithModels of apiConnectionsWithModels) {
      const { apiConnection, models } = apiConnectionWithModels;

      options.push({
        label: apiSourceLabel.get(apiConnection.source) ?? "",
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

const flattenOptions = (opts: ComboboxOption[]): string[] =>
  opts.flatMap((opt) => (opt.sub ? flattenOptions(opt.sub) : [opt.value]));

const getIntendedModelValue = (
  apiConnectionId: string | undefined,
  apiSource: string,
  modelId: string,
  modelName: string,
  allValues: string[] | undefined,
) => {
  if (apiConnectionId) {
    const result = getApiModelValue(
      apiSource ?? "",
      modelId ?? "",
      modelName ?? "",
      apiConnectionId ?? "",
    );
    return result;
  } else {
    if (!allValues || !apiSource || !modelId || !modelName) {
      return undefined;
    }

    // When we don't have apiConnectionId, we need to find the matching value
    // by checking if the value contains our apiSource, modelId, and modelName

    // Extract the actual model ID from composite format (e.g., "deepseek:deepseek-chat" -> "deepseek-chat")
    const actualModelId = modelId.includes(":")
      ? modelId.split(":")[1]
      : modelId;

    for (const value of allValues) {
      // Split the value to check its components
      const parts = value.split("|");
      if (parts.length >= 5) {
        // Format: api-model|connectionId|source|modelId|modelName
        const valueApiSource = parts[2];
        const valueModelId = parts[3];
        const valueModelName = parts[4];

        // For Astrsk AI, compare by model name since modelId format varies
        if (apiSource === ApiSource.AstrskAi) {
          if (valueApiSource === apiSource && valueModelName === modelName) {
            return value;
          }
        } else {
          if (
            valueApiSource === apiSource &&
            valueModelId === actualModelId &&
            valueModelName === modelName
          ) {
            return value;
          }
        }
      }
    }
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
    modelInfo?: { apiSource?: string; modelId?: string },
  ) => void;
  agent: Agent | undefined;
}) => {
  // Get current zoom level from React Flow
  const reactFlow = useReactFlow();
  const zoomScale = reactFlow.getViewport().zoom;

  const methods = useForm<StepPromptsSchemaType>({
    defaultValues: {
      aiResponse: {
        type: "api-model",
        apiSource:
          agent?.props.apiSource == null ? undefined : agent?.props.apiSource,
        modelId:
          agent?.props.modelId == null ? undefined : agent?.props.modelId,
        modelName:
          agent?.props.modelName == null ? undefined : agent?.props.modelName,
      },
    },
  });
  const { watch, setValue, trigger } = methods;
  const field =
    taskType === TaskType.AiResponse ? "aiResponse" : "userResponse";
  // const type = watch(`${field}.type`);
  const apiConnectionId = watch(`${field}.apiConnectionId`);
  const apiSource = watch(`${field}.apiSource`);
  const modelId = watch(`${field}.modelId`);
  const modelName = watch(`${field}.modelName`);

  // API models - using React Query directly for better control

  const { data: apiConnectionsWithModels, refetch } = useQuery(
    apiConnectionQueries.listWithModels(),
  );

  useEffect(() => {
    refetch();
  }, []);

  // NOTE: We're not automatically validating/clearing Astrsk API models
  // because it's difficult to determine when models are actually loaded vs still loading.
  // The dropdown will show available models and user can manually change if needed.

  // Helper to flatten option values

  // useEffect(() => {
  //   // Compute intended value from agent
  //   const intendedValue = getApiModelValue(
  //     agent.props.apiSource ?? "",
  //     agent.props.modelId ?? "",
  //     agent.props.modelName ?? "",
  //   );
  //   const allValues = flattenOptions(modelOptions());
  //   // Only set if it exists and is not already set
  //   for (const value of allValues) {
  //     if (intendedValue && value.includes(intendedValue)) {
  //       setIntendedModelValue(value);
  //       break;
  //     }
  //   }
  // }, [
  //   JSON.stringify(modelOptions()),
  //   agent,
  //   intendedModelValue,
  //   setIntendedModelValue,
  // ]);

  const handleModelChange = (
    apiSource: string,
    modelId: string,
    modelName: string,
  ) => {
    if (!agent) {
      return;
    }

    // Only create a composite modelId if apiSource is valid
    // const formattedApiSource =
    //   apiSource && Object.values(ApiSource).includes(apiSource as ApiSource)
    //     ? (apiSource as ApiSource)
    //     : undefined;

    // Only create composite modelId if we have a valid apiSource
    // const compositeModelId = formattedApiSource
    //   ? `${formattedApiSource}:${modelId}`
    //   : modelId;

    // Don't update the agent here - let the parent component handle it
    // The parent component (AgentNode) will update and save the agent properly

    if (modelName) {
      // Pass the full model information to the parent
      modelChanged(modelName, true, {
        apiSource: apiSource,
        modelId: modelId,
      });
    }
    // setIsDirty(true);
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
          options={(() => {
            const opts = modelOptions(apiConnectionsWithModels ?? []);
            return opts;
          })()}
          value={(() => {
            const val = getIntendedModelValue(
              apiConnectionId ?? "",
              apiSource ?? "",
              modelId ?? "",
              modelName ?? "",
              flattenOptions(modelOptions(apiConnectionsWithModels ?? [])),
            );
            return val;
          })()}
          onValueChange={(selectedValue) => {
            const splittedValue = selectedValue.split("|");
            setValue(`${field}.apiConnectionId`, splittedValue[1]);
            setValue(`${field}.apiSource`, splittedValue[2]);
            setValue(`${field}.modelId`, splittedValue[3]);
            setValue(`${field}.modelName`, splittedValue[4]);
            handleModelChange(
              splittedValue[2],
              splittedValue[3],
              splittedValue[4],
            );
            trigger();
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
  const [apiConnectionId, setApiConnectionId] = useState<string>("");
  const [apiSource, setApiSource] = useState<string>("");
  const [modelId, setModelId] = useState<string>("");
  const [modelName, setModelName] = useState<string>("");

  // API models - using React Query directly
  const { data: apiConnectionsWithModels } = useQuery(
    apiConnectionQueries.listWithModels(),
  );

  // Handle model change
  const handleModelChange = (
    apiConnectionId: string,
    apiSource: string,
    modelId: string,
    modelName: string,
  ) => {
    setApiConnectionId(apiConnectionId);
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
              apiConnectionId ?? "",
              apiSource ?? "",
              modelId ?? "",
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
    modelInfo?: { apiSource?: string; modelId?: string },
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
