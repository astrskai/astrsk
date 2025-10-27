import { Plus } from "lucide-react";
import { Flow } from "@/entities/flow/domain/flow";
import { FlowCard } from "@/features/session/ui/create-session/flow-card";
import { NewFlowCard } from "./new-flow-card";
import { Button } from "@/shared/ui/forms";

interface FlowsGridProps {
  flows: Flow[];
  onCreateFlow: () => void;
  keyword: string;
}

/**
 * Flows grid component
 * Displays flow cards in a responsive grid with optional New Flow Card
 *
 * Layout:
 * - Mobile: Button above grid + 1 column
 * - Desktop: New card inside grid + 2-3 columns
 */
export function FlowsGrid({
  flows,
  onCreateFlow,
  keyword,
}: FlowsGridProps) {
  const showNewFlowCard = !keyword;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Mobile: Create Button (outside grid) */}
      {showNewFlowCard && (
        <Button
          onClick={onCreateFlow}
          icon={<Plus size={16} />}
          className="w-full md:hidden"
        >
          Create new flow
        </Button>
      )}

      {/* Flows Grid */}
      <div className="mx-auto grid w-full grid-cols-1 justify-center gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Desktop: New Flow Card (inside grid) */}
        {showNewFlowCard && (
          <NewFlowCard
            onClick={onCreateFlow}
            className="hidden md:block"
          />
        )}

        {/* Existing Flows */}
        {flows.map((flow) => (
          <FlowCard
            key={flow.id.toString()}
            flow={flow}
            isSelected={false}
            onClick={() => {
              // TODO: Navigate to flow detail page
              console.log("Flow clicked:", flow.id.toString());
            }}
          />
        ))}
      </div>
    </div>
  );
}
