import { Flow, ReadyState } from "@/entities/flow/domain/flow";
import { cn } from "@/shared/lib";
import { FlowIcon } from "@/shared/assets/icons";
import { CircleAlert } from "lucide-react";
import { useFlowValidation } from "@/shared/hooks/use-flow-validation";

interface FlowCardProps {
  flow: Flow;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Flow card component for selection
 * Shows flow metadata in card format
 */
export function FlowCard({ flow, isSelected, onClick }: FlowCardProps) {
  const nodeCount = flow.props.nodes.length;
  const agentCount = flow.props.nodes.filter(
    (node) => node.type === "agent",
  ).length;

  // Validate flow
  const { isValid, isFetched } = useFlowValidation(flow.id);
  const isInvalid = isFetched && !isValid;

  // Get dataStore field names
  const dataStoreFields = flow.props.dataStoreSchema?.fields || [];
  const hasDataStoreFields = dataStoreFields.length > 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-2xl transition-all",
        "bg-background-surface-4 border-2 p-6",
        "hover:border-primary/50 hover:shadow-lg",
        isSelected ? "border-primary shadow-lg" : "border-border",
      )}
    >
      {/* Flow Name with Status */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-text-primary flex items-center gap-2 text-lg font-semibold">
          <FlowIcon className="h-5 w-5" />
          {flow.props.name || "Untitled Flow"}
        </h3>
        <div className="flex items-center gap-2">
          {/* Invalid Indicator */}
          {isInvalid && (
            <div className="text-status-destructive-light">
              <CircleAlert size={16} />
            </div>
          )}
          {/* Ready State Badge */}
          <div
            className={cn(
              "rounded-md px-2 py-0.5 text-xs font-medium",
              flow.props.readyState === ReadyState.Ready
                ? "bg-status-ready-dark/10 text-status-ready-dark"
                : flow.props.readyState === ReadyState.Error
                  ? "bg-status-destructive-light/10 text-status-destructive-light"
                  : "bg-background-surface-3 text-text-placeholder",
            )}
          >
            {flow.props.readyState === ReadyState.Ready
              ? "Ready"
              : flow.props.readyState === ReadyState.Error
                ? "Error"
                : "Draft"}
          </div>
        </div>
      </div>

      {/* Flow Metadata */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-text-secondary">Nodes:</span>
          <span className="text-text-primary font-medium">{nodeCount}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-text-secondary">Agents:</span>
          <span className="text-text-primary font-medium">{agentCount}</span>
        </div>

        {/* DataStore Fields */}
        {hasDataStoreFields && (
          <div className="mt-3 flex flex-col gap-2">
            <span className="text-text-secondary text-sm font-medium">
              Session stats
            </span>
            <div className="flex flex-wrap gap-1">
              {dataStoreFields.map((field, index) => (
                <span
                  key={index}
                  className="bg-background-surface-3 text-text-secondary rounded-md px-2 py-0.5 text-xs"
                >
                  {field.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
