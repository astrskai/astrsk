import { Plus, Upload, Copy, Trash2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import { PlotCard } from "@/entities/card/domain/plot-card";
import { CreateItemCard } from "@/shared/ui";
import { Button } from "@/shared/ui/forms";
import { ActionConfirm } from "@/shared/ui/dialogs";
import PlotPreview from "@/features/plot/ui/plot-preview";
import type { CharacterAction } from "@/features/character/model/character-actions";
import { useCardActions } from "@/features/common/model/use-card-actions";
import { useAsset } from "@/shared/hooks/use-asset";

interface PlotsGridProps {
  plots: PlotCard[];
  showNewPlotCard: boolean;
}

/**
 * Plot Grid Item
 * Wrapper component that handles useAsset hook
 */
interface PlotGridItemProps {
  plot: PlotCard;
  loading: { exporting?: boolean; copying?: boolean; deleting?: boolean };
  onPlotClick: (plotId: string) => void;
  onExport: (cardId: string, title: string) => (e: React.MouseEvent) => void;
  onCopy: (cardId: string, title: string) => (e: React.MouseEvent) => void;
  onDeleteClick: (
    cardId: string,
    title: string,
  ) => (e: React.MouseEvent) => void;
}

function PlotGridItem({
  plot,
  loading,
  onPlotClick,
  onExport,
  onCopy,
  onDeleteClick,
}: PlotGridItemProps) {
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
    <PlotPreview
      imageUrl={imageUrl}
      title={plot.props.title}
      summary={plot.props.cardSummary}
      tags={plot.props.tags || []}
      tokenCount={plot.props.tokenCount}
      firstMessages={plot.props.scenarios?.length || 0}
      onClick={() => onPlotClick(cardId)}
      actions={actions}
      isShowActions={true}
    />
  );
}

/**
 * Plots grid component
 * Displays plot cards in a responsive grid with optional New Plot Card
 *
 * Layout:
 * - Mobile: Button above grid + 1 column per row
 * - Desktop: New card inside grid + 2 columns per row
 */
export function PlotsGrid({ plots, showNewPlotCard }: PlotsGridProps) {
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

  const handlePlotClick = (plotId: string) => {
    navigate({
      to: "/assets/plots/$plotId",
      params: { plotId },
    });
  };

  const handleCreatePlot = () => {
    navigate({ to: "/assets/plots/new" });
  };

  return (
    <>
      <div className="flex flex-col gap-4 p-4">
        {/* Mobile: Create Button (outside grid) */}
        {showNewPlotCard && (
          <Button
            onClick={handleCreatePlot}
            icon={<Plus className="min-h-4 min-w-4" />}
            className="w-full md:hidden"
          >
            Create new plot
          </Button>
        )}

        {/* Plots Grid */}
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 justify-center gap-4 md:grid-cols-2">
          {/* Desktop: New Plot Card (inside grid) */}
          {showNewPlotCard && (
            <CreateItemCard
              title="New Plot"
              description="Create a new plot"
              onClick={handleCreatePlot}
              className="hidden aspect-[2/1] md:flex lg:aspect-[3/1.2]"
            />
          )}

          {/* Existing Plots */}
          {plots.map((plot) => {
            const cardId = plot.id.toString();
            const loading = loadingStates[cardId] || {};

            return (
              <PlotGridItem
                key={cardId}
                plot={plot}
                loading={loading}
                onPlotClick={handlePlotClick}
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
        title="Delete Plot"
        description={
          deleteDialogState.usedSessionsCount > 0
            ? `This plot is used in ${deleteDialogState.usedSessionsCount} session(s). Deleting it may affect those sessions.`
            : "This plot will be permanently deleted and cannot be recovered."
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="destructive"
      />
    </>
  );
}
