import { Plus } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useCallback } from "react";
import { Flow } from "@/entities/flow/domain/flow";
import { FlowCard } from "./flow-card";
import { NewFlowCard } from "./new-flow-card";
import { Button } from "@/shared/ui/forms";
import { useNewItemAnimation } from "@/shared/hooks/use-new-item-animation";

interface FlowsGridProps {
  flows: Flow[];
  onCreateFlow: () => void;
  showNewFlowCard: boolean;
  newlyCreatedFlowId?: string | null; // ID of the newly created/copied flow
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
  showNewFlowCard,
  newlyCreatedFlowId = null,
}: FlowsGridProps) {
  // Custom hooks
  const { animatingId, triggerAnimation } = useNewItemAnimation();
  const navigate = useNavigate();

  // Effects - Track newly created flow from parent (via prop)
  useEffect(() => {
    if (newlyCreatedFlowId) {
      triggerAnimation(newlyCreatedFlowId);
    }
  }, [newlyCreatedFlowId, triggerAnimation]);

  // Memoized callbacks - handleCopySuccess is passed as prop to FlowCard
  const handleCopySuccess = useCallback(
    (copiedFlowId: string) => {
      triggerAnimation(copiedFlowId);
    },
    [triggerAnimation],
  );

  const handleFlowClick = useCallback(
    (flowId: string) => {
      // Navigate to flow detail page
      // flow-multi-page will sync the flowId to store automatically
      navigate({
        to: "/assets/flows/$flowId",
        params: { flowId },
      });
    },
    [navigate],
  );

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
      <div className="mx-auto grid w-full max-w-7xl auto-rows-fr grid-cols-1 justify-center gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Desktop: New Flow Card (inside grid) */}
        {showNewFlowCard && (
          <NewFlowCard onClick={onCreateFlow} className="hidden md:block" />
        )}

        {/* Existing Flows */}
        {flows.map((flow) => (
          <FlowCard
            key={flow.id.toString()}
            flow={flow}
            isSelected={false}
            showActions={true}
            isNewlyCreated={animatingId === flow.id.toString()}
            onCopySuccess={handleCopySuccess}
            onClick={() => handleFlowClick(flow.id.toString())}
          />
        ))}
      </div>
    </div>
  );
}
