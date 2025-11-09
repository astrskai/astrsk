import { Plus, Upload, Copy, Trash2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import { PlotCard } from "@/entities/card/domain/plot-card";
import { CreateItemCard } from "@/shared/ui";
import { Button } from "@/shared/ui/forms";
import { ActionConfirm } from "@/shared/ui/dialogs";
import ScenarioPreview from "@/features/scenario/ui/scenario-preview";
import type { CharacterAction } from "@/features/character/model/character-actions";
import { useCardActions } from "@/features/common/model/use-card-actions";
import { useAsset } from "@/shared/hooks/use-asset";

interface ScenariosGridProps {
  scenarios: PlotCard[];
  showNewScenarioCard: boolean;
}

/**
 * Scenario Grid Item
 * Wrapper component that handles useAsset hook
 */
interface ScenarioGridItemProps {
  plot: PlotCard;
  loading: { exporting?: boolean; copying?: boolean; deleting?: boolean };
  onScenarioClick: (plotId: string) => void;
  onExport: (cardId: string, title: string) => (e: React.MouseEvent) => void;
  onCopy: (cardId: string, title: string) => (e: React.MouseEvent) => void;
  onDeleteClick: (
    cardId: string,
    title: string,
  ) => (e: React.MouseEvent) => void;
}

function ScenarioGridItem({
  plot,
  loading,
  onScenarioClick,
  onExport,
  onCopy,
  onDeleteClick,
}: ScenarioGridItemProps) {
  const [imageUrl] = useAsset(plot.props.iconAssetId);
  const cardId = plot.id.toString();

  const actions: CharacterAction[] = [
    {
      icon: Upload,
      label: `Export ${plot.props.title}`,
      onClick: onExport(cardId, plot.props.title),
      disabled: loading.exporting,
      loading: loading.exporting,
    },
    {
      icon: Copy,
      label: `Copy ${plot.props.title}`,
      onClick: onCopy(cardId, plot.props.title),
      disabled: loading.copying,
      loading: loading.copying,
    },
    {
      icon: Trash2,
      label: `Delete ${plot.props.title}`,
      onClick: onDeleteClick(cardId, plot.props.title),
      disabled: loading.deleting,
      loading: loading.deleting,
    },
  ];

  return (
    <ScenarioPreview
      imageUrl={imageUrl}
      title={plot.props.title}
      summary={plot.props.cardSummary}
      tags={plot.props.tags || []}
      tokenCount={plot.props.tokenCount}
      firstMessages={plot.props.scenarios?.length || 0}
      onClick={() => onScenarioClick(cardId)}
      actions={actions}
      isShowActions={true}
    />
  );
}

/**
 * Scenarios grid component
 * Displays scenario cards in a responsive grid with optional New Scenario Card
 *
 * Layout:
 * - Mobile: Button above grid + 1 column per row
 * - Desktop: New card inside grid + 2 columns per row
 */
export function ScenariosGrid({
  scenarios,
  showNewScenarioCard,
}: ScenariosGridProps) {
  const navigate = useNavigate();

  const {
    loadingStates,
    deleteDialogState,
    handleExport,
    handleCopy,
    handleDeleteClick,
    handleDeleteConfirm,
    closeDeleteDialog,
  } = useCardActions({ entityType: "plot" });

  const handleScenarioClick = (plotId: string) => {
    navigate({
      to: "/assets/scenarios/$scenarioId",
      params: { scenarioId: plotId },
    });
  };

  const handleCreateScenario = () => {
    navigate({ to: "/assets/scenarios/new" });
  };

  return (
    <>
      <div className="flex w-full flex-col gap-4">
        {/* Mobile: Create Button (outside grid) */}
        {showNewScenarioCard && (
          <Button
            onClick={handleCreateScenario}
            icon={<Plus className="min-h-4 min-w-4" />}
            className="w-full md:hidden"
          >
            Create new scenario
          </Button>
        )}

        {/* Scenarios Grid */}
        <div className="grid w-full grid-cols-1 justify-center gap-4 md:grid-cols-2">
          {/* Desktop: New Scenario Card (inside grid) */}
          {showNewScenarioCard && (
            <CreateItemCard
              title="New Scenario"
              description="Create a new scenario"
              onClick={handleCreateScenario}
              className="hidden aspect-[2/1] md:flex lg:aspect-[3/1.1]"
            />
          )}

          {/* Existing Scenarios */}
          {scenarios.map((plot) => {
            const cardId = plot.id.toString();
            const loading = loadingStates[cardId] || {};

            return (
              <ScenarioGridItem
                key={cardId}
                plot={plot}
                loading={loading}
                onScenarioClick={handleScenarioClick}
                onExport={handleExport}
                onCopy={handleCopy}
                onDeleteClick={handleDeleteClick}
              />
            );
          })}
        </div>
      </div>

      <ActionConfirm
        open={deleteDialogState.isOpen}
        onOpenChange={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Delete Scenario"
        description={
          deleteDialogState.usedSessionsCount > 0
            ? `This scenario is used in ${deleteDialogState.usedSessionsCount} session(s). Deleting it may affect those sessions.`
            : "This scenario will be permanently deleted and cannot be recovered."
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="destructive"
      />
    </>
  );
}
