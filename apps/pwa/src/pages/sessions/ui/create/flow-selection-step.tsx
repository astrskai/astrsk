import { useState } from "react";
import { Trash2 } from "lucide-react";
import FlowPreview from "@/features/flow/ui/flow-preview";
import { Flow } from "@/entities/flow/domain/flow";
import { IconWorkflow } from "@/shared/assets/icons";
import { cn } from "@/shared/lib";
import type { FlowAction } from "@/features/flow/ui/flow-preview";
import { FlowSelectionDialog } from "@/features/flow/ui/flow-selection-dialog";

interface FlowSelectionStepProps {
  selectedFlow: Flow | null;
  onFlowSelected: (flow: Flow | null) => void;
}

/**
 * Flow Selection Step
 * First step in create session wizard
 * Allows user to select a flow from available flows
 */
export function FlowSelectionStep({
  selectedFlow,
  onFlowSelected,
}: FlowSelectionStepProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddFlowClick = () => {
    setIsDialogOpen(true);
  };

  const handleRemoveFlow = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFlowSelected(null);
  };

  const bottomActions: FlowAction[] = [
    {
      icon: Trash2,
      label: `Remove`,
      onClick: handleRemoveFlow,
      bottomActionsClassName: "block md:hidden",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="mx-auto w-full max-w-2xl">
        <h2 className="text-text-primary mb-2 text-base font-semibold md:text-[1.2rem]">
          Select a Roleplay Workflow
          <span className="text-status-required">*</span>
        </h2>
        <p className="text-text-secondary text-xs md:text-sm">
          A workflow is a bundle of prompt presets and AI models that defines
          your roleplay progression.
        </p>
      </div>

      {/* Selected Flow Display */}
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        {selectedFlow ? (
          <FlowPreview
            title={selectedFlow.props.name || "Untitled Flow"}
            description={selectedFlow.props.description}
            nodeCount={selectedFlow.props.nodes.length}
            onClick={handleAddFlowClick}
            actions={[
              {
                icon: Trash2,
                label: `Remove ${selectedFlow.props.name || "flow"}`,
                onClick: handleRemoveFlow,
              },
            ]}
            bottomActions={bottomActions}
            moreActionsClassName="hidden"
            isShowActions={true}
          />
        ) : (
          /* Empty State - Show Select Button Card */
          <div
            onClick={handleAddFlowClick}
            className={cn(
              "group relative cursor-pointer overflow-hidden rounded-lg transition-all",
              "bg-black-alternate border-1 border-gray-700 p-6",
              "hover:border-primary/50 hover:shadow-lg",
            )}
          >
            <div className="flex flex-col items-center justify-center py-8">
              <IconWorkflow className="text-text-secondary mb-3 h-12 w-12" />
              <h3 className="text-text-primary mb-2 text-lg font-semibold">
                Add Flow
              </h3>
              <p className="text-text-secondary text-sm">
                Click to select a flow
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Flow Selection Dialog */}
      <FlowSelectionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedFlow={selectedFlow}
        onConfirm={onFlowSelected}
        title="Select Flow"
        description="Choose a flow to use for this session"
        confirmButtonText="Add"
      />
    </div>
  );
}
