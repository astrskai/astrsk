import { Upload, Copy, Trash2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import { CardType, PlotCard, ScenarioCard } from "@/entities/card/domain";
import { DialogConfirm } from "@/shared/ui/dialogs";
import ScenarioCardUI from "@/features/scenario/ui/scenario-card";
import type { CardAction } from "@/features/common/ui";
import { useCardActions } from "@/features/common/model/use-card-actions";
import { useAsset } from "@/shared/hooks/use-asset";
import { ExportType } from "@/shared/lib/cloud-upload-helpers";

interface ScenariosGridProps {
  scenarios: (PlotCard | ScenarioCard)[];
}

/**
 * Scenario Grid Item
 * Wrapper component that handles useAsset hook
 */
interface ScenarioGridItemProps {
  scenario: PlotCard | ScenarioCard;
  loading: { exporting?: boolean; copying?: boolean; deleting?: boolean };
  onScenarioClick: (plotId: string) => void;
  onExport: (
    cardId: string,
    title: string,
    exportType: ExportType,
  ) => (e: React.MouseEvent) => void;
  onCopy: (cardId: string, title: string) => (e: React.MouseEvent) => void;
  onDeleteClick: (
    cardId: string,
    title: string,
  ) => (e: React.MouseEvent) => void;
}

function ScenarioGridItem({
  scenario,
  loading,
  onScenarioClick,
  onExport,
  onCopy,
  onDeleteClick,
}: ScenarioGridItemProps) {
  const [imageUrl] = useAsset(scenario.props.iconAssetId);
  const cardId = scenario.id.toString();

  const actions: CardAction[] = [
    {
      icon: Upload,
      label: "Export",
      onClick: onExport(cardId, scenario.props.title, "file"),
      disabled: loading.exporting,
      loading: loading.exporting,
    },
    {
      icon: Upload,
      label: "Harpy",
      onClick: onExport(cardId, scenario.props.title, "cloud"),
      disabled: loading.exporting,
      loading: loading.exporting,
    },
    {
      icon: Copy,
      label: "Copy",
      onClick: onCopy(cardId, scenario.props.title),
      disabled: loading.copying,
      loading: loading.copying,
    },
    {
      icon: Trash2,
      label: "Delete",
      onClick: onDeleteClick(cardId, scenario.props.title),
      disabled: loading.deleting,
      loading: loading.deleting,
      className: "text-red-400 hover:text-red-300",
    },
  ];

  return (
    <ScenarioCardUI
      imageUrl={imageUrl}
      title={scenario.props.title}
      summary={scenario.props.cardSummary}
      tags={scenario.props.tags || []}
      tokenCount={scenario.props.tokenCount}
      firstMessages={
        scenario instanceof PlotCard
          ? scenario.props.scenarios?.length || 0
          : scenario instanceof ScenarioCard
            ? scenario.props.firstMessages?.length || 0
            : 0
      }
      onClick={() => onScenarioClick(cardId)}
      actions={actions}
    />
  );
}

/**
 * Scenarios grid component
 * Displays scenario cards in a responsive grid
 *
 * Layout: Uses auto-fill with minmax to ensure stable card sizes
 */
export function ScenariosGrid({ scenarios }: ScenariosGridProps) {
  const navigate = useNavigate();

  const {
    loadingStates,
    deleteDialogState,
    handleExport,
    handleCopy,
    handleDeleteClick,
    handleDeleteConfirm,
    closeDeleteDialog,
  } = useCardActions({ entityType: CardType.Scenario });

  const handleScenarioClick = (plotId: string) => {
    navigate({
      to: "/assets/scenarios/{-$scenarioId}",
      params: { scenarioId: plotId },
    });
  };

  return (
    <>
      {/* Scenarios Grid - Uses auto-fill with minmax to ensure stable card sizes */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
        {scenarios
          .filter((scenario) => scenario.id !== undefined)
          .map((scenario) => {
            const cardId = scenario.id.toString();
            const loading = loadingStates[cardId] || {};

            return (
              <ScenarioGridItem
                key={cardId}
                scenario={scenario}
                loading={loading}
                onScenarioClick={handleScenarioClick}
                onExport={handleExport}
                onCopy={handleCopy}
                onDeleteClick={handleDeleteClick}
              />
            );
          })}
      </div>

      <DialogConfirm
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
