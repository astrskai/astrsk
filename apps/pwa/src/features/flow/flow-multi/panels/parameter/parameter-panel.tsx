import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchInput } from "@/shared/ui";
import { ParameterSettingsFields } from "@/features/flow/flow-multi/panels/parameter/parameter-settings/parameter-settings-fields";
import { ParameterPanelProps } from "./parameter-panel-types";
import { agentQueries } from "@/app/queries/agent/query-factory";
import { useUpdateAgentParametersQueue } from "@/app/queries/agent/mutations/parameter-mutations";
import { toast } from "sonner";

export function ParameterPanel({ flowId, agentId }: ParameterPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Get queue-based mutation hook for saving all changes
  const updateParameters = useUpdateAgentParametersQueue(agentId || "");

  // Query only for agent parameters - not the entire agent
  const {
    data: parameters,
    isLoading,
    error,
  } = useQuery({
    ...agentQueries.parameters(agentId),
    enabled: !!agentId && !updateParameters.isProcessing,
  });

  // Handle parameter changes - save immediately without debouncing
  const handleParameterChange = useCallback(
    (parameterId: string, enabled: boolean, value?: any) => {
      if (!parameters) return;

      // Create new Maps from the current parameters
      const enabledParameters = new Map<string, boolean>(
        parameters.enabledParameters,
      );
      const parameterValues = new Map<string, any>(parameters.parameterValues);

      // Update the specific parameter
      enabledParameters.set(parameterId, enabled);
      if (enabled && value !== undefined) {
        parameterValues.set(parameterId, value);
      } else if (!enabled) {
        parameterValues.delete(parameterId);
      }

      // Queue the update - ensures all changes are saved
      updateParameters.mutate(enabledParameters, parameterValues);
    },
    [parameters, updateParameters],
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-background-surface-2 flex h-full items-center justify-center">
        <div className="text-text-subtle flex items-center gap-2">
          <span>Loading parameters...</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (!parameters) {
    return (
      <div className="bg-background-surface-2 flex h-full items-center justify-center">
        <div className="text-text-subtle flex items-center gap-2">
          <span>Parameters not found</span>
        </div>
      </div>
    );
  }

  // Parameters should already be Maps from the query select function
  const initialEnabledParameters =
    parameters.enabledParameters || new Map<string, boolean>();
  const initialParameterValues =
    parameters.parameterValues || new Map<string, any>();

  return (
    <div className="bg-background-surface-2 flex h-full flex-col p-4">
      <SearchInput
        placeholder="Search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />
      <ParameterSettingsFields
        key={agentId} // Force re-mount when agent changes
        searchTerm={searchTerm}
        initialEnabledParameters={initialEnabledParameters}
        initialParameterValues={initialParameterValues}
        onParameterChange={handleParameterChange}
        className="flex-1"
      />
    </div>
  );
}
