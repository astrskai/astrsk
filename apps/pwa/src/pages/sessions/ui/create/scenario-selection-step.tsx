import { useState } from "react";
import { Trash2, BookOpen } from "lucide-react";
import ScenarioCardUI from "@/features/scenario/ui/scenario-card";
import { ScenarioCard } from "@/entities/card/domain/scenario-card";
import { cn } from "@/shared/lib";
import { useAsset } from "@/shared/hooks/use-asset";
import type { CardAction } from "@/features/common/ui";
import { ScenarioSelectionDialog } from "@/features/scenario/ui/scenario-selection-dialog";

interface ScenarioSelectionStepProps {
  selectedScenario: ScenarioCard | null;
  onScenarioSelected: (plot: ScenarioCard | null) => void;
}

/**
 * Selected Scenario Card
 * Wrapper component for selected scenario with Remove action
 */
interface SelectedScenarioCardProps {
  card: ScenarioCard;
  onClick: () => void;
  onRemove: (e: React.MouseEvent) => void;
}

const SelectedScenarioCard = ({
  card,
  onClick,
  onRemove,
}: SelectedScenarioCardProps) => {
  const [imageUrl] = useAsset(card.props.iconAssetId);

  const actions: CardAction[] = [
    {
      icon: Trash2,
      label: `Remove`,
      onClick: (e) => {
        e.stopPropagation();
        onRemove(e);
      },
      className: "text-red-400 hover:text-red-300",
    },
  ];

  return (
    <ScenarioCardUI
      imageUrl={imageUrl}
      title={card.props.title}
      summary={card.props.cardSummary}
      tags={card.props.tags || []}
      tokenCount={card.props.tokenCount}
      firstMessages={card.props.firstMessages?.length || 0}
      actions={actions}
      onClick={onClick}
    />
  );
};

/**
 * Scenario Selection Step
 * Fourth step in create session wizard
 * Allows user to select one scenario card (optional)
 */
export default function ScenarioSelectionStep({
  selectedScenario,
  onScenarioSelected,
}: ScenarioSelectionStepProps) {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  const handleAddScenarioClick = () => {
    setIsDialogOpen(true);
  };

  const handleRemoveScenario = (e: React.MouseEvent) => {
    e.stopPropagation();
    onScenarioSelected(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="mx-auto w-full max-w-2xl">
        <h2 className="text-fg-default mb-2 text-base font-semibold lg:text-[1.2rem]">
          Select a Scenario&nbsp;(optional)
        </h2>
        <p className="text-fg-muted text-xs md:text-sm">
          A scenario provides story context and starting messages for your
          session.
        </p>
      </div>

      {/* Selected Scenario Display */}
      {selectedScenario ? (
        <div className="mx-auto flex w-full max-w-xs flex-col gap-4">
          <SelectedScenarioCard
            card={selectedScenario}
            onClick={handleAddScenarioClick}
            onRemove={handleRemoveScenario}
          />
        </div>
      ) : (
        /* Empty State - Show Select Button Card */
        <div className="mx-auto w-full max-w-2xl">
          <div
            onClick={handleAddScenarioClick}
            className={cn(
              "group relative cursor-pointer overflow-hidden rounded-2xl transition-all",
              "bg-black-alternate border-1 border-gray-700 p-6",
              "hover:border-primary/50 hover:shadow-lg",
            )}
          >
            <div className="flex flex-col items-center justify-center py-8">
              <BookOpen className="text-fg-muted mb-3 min-h-12 min-w-12" />
              <h3 className="text-fg-default mb-2 text-lg font-semibold">
                Select Scenario
              </h3>
              <p className="text-fg-muted text-sm">
                Click to select a scenario (optional)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scenario Selection Dialog */}
      <ScenarioSelectionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedScenario={selectedScenario}
        onConfirm={onScenarioSelected}
        title="Select Scenario"
        description="Choose a scenario (optional)"
        confirmButtonText="Select"
      />
    </div>
  );
}
