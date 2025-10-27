import { Flow } from "@/entities/flow/domain/flow";
import { cn } from "@/shared/lib";
import { FlowIcon } from "@/shared/assets/icons";

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

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-2xl transition-all",
        "bg-background-surface-1 border-2 p-6",
        "hover:border-primary/50 hover:shadow-lg",
        isSelected ? "border-primary shadow-lg" : "border-border",
      )}
    >
      {/* Flow Name */}
      <h3 className="text-text-primary mb-3 flex items-center gap-2 text-lg font-semibold">
        <FlowIcon className="h-5 w-5" />
        {flow.props.name || "Untitled Flow"}
      </h3>

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
      </div>
    </div>
  );
}
