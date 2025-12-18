import { useQuery } from "@tanstack/react-query";

import { cn } from "@/shared/lib";
import { apiConnectionQueries } from "@/entities/api/api-connection-queries";
import { ApiSource, apiSourceLabel } from "@/entities/api/domain";
import { ApiModel } from "@/entities/api/domain/api-model";
import type { ApiConnectionWithModels } from "@/shared/hooks/use-api-connections-with-models";
import { Combobox, ComboboxOption } from "@/shared/ui";
import { useAuth } from "@/shared/hooks/use-auth";

export interface ModelOption {
  apiConnectionId: string;
  apiSource: string;
  modelId: string;
  modelName: string;
}

interface DefaultModelDisplayProps {
  icon: React.ReactNode;
  iconBgClassName: string;
  title: string;
  description: string;
  value: ModelOption | null;
  onValueChange: (value: ModelOption | null) => void;
}

// Helper to create model value string
const getApiModelValue = (
  apiSource: string,
  modelId: string,
  modelName: string,
  apiConnectionId: string,
) => {
  return `api-model|${apiConnectionId}|${apiSource}|${modelId}|${modelName}`;
};

// Build combobox options from API connections
const buildModelOptions = (
  apiConnectionsWithModels: ApiConnectionWithModels[],
): ComboboxOption[] => {
  const options: ComboboxOption[] = [];

  for (const apiConnectionWithModels of apiConnectionsWithModels) {
    const { apiConnection, models } = apiConnectionWithModels;

    const providerLabel = apiSourceLabel.get(apiConnection.source) || "";
    const displayLabel =
      apiConnection.title && apiConnection.title !== apiConnection.source
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

  return options;
};

const DefaultModelDisplay = ({
  icon,
  iconBgClassName,
  title,
  description,
  value,
  onValueChange,
}: DefaultModelDisplayProps) => {
  const { isAuthenticated } = useAuth();
  const { data: apiConnectionsWithModels } = useQuery(
    apiConnectionQueries.listWithModels(),
  );

  // COMMENTED OUT: Show AstrskAi models for all users (authentication check removed)
  // const filteredConnections = (apiConnectionsWithModels ?? []).filter(
  //   (conn: ApiConnectionWithModels) => conn.apiConnection.source !== ApiSource.AstrskAi || isAuthenticated
  // );
  const filteredConnections = apiConnectionsWithModels ?? [];

  const options = buildModelOptions(filteredConnections);

  const handleChange = (selectedValue: string) => {
    if (!selectedValue) {
      onValueChange(null);
      return;
    }

    // Parse: api-model|connectionId|apiSource|modelId|modelName
    const parts = selectedValue.split("|");
    if (parts.length >= 5) {
      onValueChange({
        apiConnectionId: parts[1],
        apiSource: parts[2],
        modelId: parts[3],
        modelName: parts[4],
      });
    }
  };

  const currentValue = value
    ? getApiModelValue(value.apiSource, value.modelId, value.modelName, value.apiConnectionId)
    : undefined;

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between rounded-xl border p-5 transition-colors",
        value
          ? "border-border-default bg-surface-raised hover:border-border-muted"
          : "border-amber-500/30 bg-amber-500/5",
      )}
    >
      {/* Indicator dot - only show when no model selected */}
      {!value && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
        </span>
      )}
      <div>
        <div className="mb-3 flex items-center gap-3">
          <div className={cn("rounded-lg p-2", iconBgClassName)}>{icon}</div>
          <h3 className="text-sm font-semibold text-fg-default">{title}</h3>
        </div>

        <div className="mb-3">
          <Combobox
            triggerPlaceholder="Select a model"
            searchPlaceholder="Search models..."
            searchEmpty="No model found."
            options={options}
            value={currentValue}
            onValueChange={handleChange}
          />
        </div>
      </div>

      <p className="mt-1 text-xs leading-relaxed text-fg-subtle">{description}</p>
    </div>
  );
};

export { DefaultModelDisplay };
