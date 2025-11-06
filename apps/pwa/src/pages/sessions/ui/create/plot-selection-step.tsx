import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Trash2 } from "lucide-react";
import { Button, SearchInput } from "@/shared/ui/forms";
import PlotPreview from "@/features/plot/ui/plot-preview";
import { cardQueries } from "@/entities/card/api/card-queries";
import { PlotCard } from "@/entities/card/domain/plot-card";
import { CardType } from "@/entities/card/domain";
import { IconFlow } from "@/shared/assets/icons";
import { cn } from "@/shared/lib";
import { useAsset } from "@/shared/hooks/use-asset";
import type { CharacterAction } from "@/features/character/model/character-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui";

interface PlotSelectionStepProps {
  selectedPlot: PlotCard | null;
  onPlotSelected: (plot: PlotCard | null) => void;
}

/**
 * Plot Preview Item (for dialog selection list)
 * Wrapper component that handles useAsset hook and passes imageUrl to PlotPreview
 */
interface PlotPreviewItemProps {
  card: PlotCard;
  cardId: string;
  isSelected: boolean;
  onCardClick: (cardId: string) => void;
  onDetailClick: (cardId: string) => void;
  onMouseEnter: () => void;
}

const PlotPreviewItem = ({
  card,
  cardId,
  isSelected,
  onCardClick,
  onDetailClick,
  onMouseEnter,
}: PlotPreviewItemProps) => {
  const [imageUrl] = useAsset(card.props.iconAssetId);

  return (
    <div className="relative transition-all">
      <div
        onClick={() => onCardClick(cardId)}
        onMouseEnter={onMouseEnter}
        className="pointer-events-auto"
      >
        <PlotPreview
          imageUrl={imageUrl}
          title={card.props.title}
          summary={card.props.cardSummary}
          tags={card.props.tags || []}
          tokenCount={card.props.tokenCount}
          firstMessages={card.props.scenarios?.length || 0}
          className={cn(
            isSelected && "border-normal-primary border-2 shadow-lg",
          )}
        />
      </div>

      {/* Mobile Detail Button */}
      <div className="absolute right-2 bottom-2 z-10 md:hidden">
        <Button
          size="sm"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDetailClick(cardId);
          }}
        >
          Detail
        </Button>
      </div>
    </div>
  );
};

/**
 * Selected Plot Card
 * Wrapper component for selected plot with Remove action
 */
interface SelectedPlotCardProps {
  card: PlotCard;
  onRemove: (e: React.MouseEvent) => void;
}

const SelectedPlotCard = ({ card, onRemove }: SelectedPlotCardProps) => {
  const [imageUrl] = useAsset(card.props.iconAssetId);

  const actions: CharacterAction[] = [
    {
      icon: Trash2,
      label: `Remove ${card.props.title}`,
      onClick: onRemove,
    },
  ];

  return (
    <PlotPreview
      imageUrl={imageUrl}
      title={card.props.title}
      summary={card.props.cardSummary}
      tags={card.props.tags || []}
      tokenCount={card.props.tokenCount}
      firstMessages={card.props.scenarios?.length || 0}
      actions={actions}
      isShowActions={true}
    />
  );
};

/**
 * Plot Detail Panel
 * Displays detailed information about a selected plot
 */
const PlotDetailPanel = ({ plot }: { plot: PlotCard }) => {
  const [plotImageUrl] = useAsset(plot.props.iconAssetId);

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <h3 className="hidden text-lg font-semibold text-gray-50 md:block">
        {plot.props.title}
      </h3>

      {/* Plot Image */}
      <div className="relative mx-auto aspect-[3/4] max-w-xs overflow-hidden rounded-lg">
        <img
          src={plotImageUrl || "/img/placeholder/plot-card-image.png"}
          alt={plot.props.title}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2">
        <h4 className="text-text-primary text-lg font-semibold">Description</h4>
        <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
          {plot.props.description || "No description available"}
        </p>
      </div>

      {/* Tags */}
      {plot.props.tags && plot.props.tags.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="text-text-primary text-lg font-semibold">Tags</h4>
          <div className="flex flex-wrap gap-2">
            {plot.props.tags.map((tag, index) => (
              <span
                key={`${plot.props.title}-tag-${index}-${tag}`}
                className="text-black-alternate rounded-md bg-gray-300 px-2.5 py-0.5 text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Token Count */}
      {plot.props.tokenCount && plot.props.tokenCount > 0 && (
        <div className="text-text-secondary flex items-center gap-2 text-sm">
          <span className="font-semibold">Token Count:</span>
          <span>{plot.props.tokenCount}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Plot Selection Step
 * Fourth step in create session wizard
 * Allows user to select one plot card (optional)
 */
export function PlotSelectionStep({
  selectedPlot,
  onPlotSelected,
}: PlotSelectionStepProps) {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(
    selectedPlot?.id.toString() || null,
  );
  const [previewPlotId, setPreviewPlotId] = useState<string | null>(null);
  const [showMobileDetail, setShowMobileDetail] = useState<boolean>(false);
  const [mobileDetailPlotId, setMobileDetailPlotId] = useState<string | null>(
    null,
  );

  const { data: plotCards } = useQuery(
    cardQueries.list({ type: [CardType.Plot] }),
  );

  // Sync local selection state with prop
  useEffect(() => {
    setSelectedPlotId(selectedPlot?.id.toString() || null);
  }, [selectedPlot]);

  // Get preview plot details (desktop)
  const previewPlot = useMemo(() => {
    if (!previewPlotId || !plotCards) return null;
    return plotCards.find(
      (card: PlotCard) => card.id.toString() === previewPlotId,
    ) as PlotCard | null;
  }, [previewPlotId, plotCards]);

  // Get mobile detail plot
  const mobileDetailPlot = useMemo(() => {
    if (!mobileDetailPlotId || !plotCards) return null;
    return plotCards.find(
      (card: PlotCard) => card.id.toString() === mobileDetailPlotId,
    ) as PlotCard | null;
  }, [mobileDetailPlotId, plotCards]);

  // Filter plot cards by search keyword
  const filteredPlotCards = useMemo(() => {
    if (!plotCards) return [];
    if (!searchKeyword.trim()) return plotCards;

    const keyword = searchKeyword.toLowerCase();
    return plotCards.filter((card: PlotCard) => {
      const title = card.props.title?.toLowerCase() || "";
      return title.includes(keyword);
    });
  }, [plotCards, searchKeyword]);

  const handleAddPlotClick = () => {
    // Reset mobile detail state
    setShowMobileDetail(false);
    setMobileDetailPlotId(null);
    setIsDialogOpen(true);
  };

  const handlePlotCardClick = (cardId: string) => {
    // Single select - toggle or replace
    setSelectedPlotId((prev) => (prev === cardId ? null : cardId));
  };

  const handleDialogAdd = () => {
    if (selectedPlotId && plotCards) {
      const card = plotCards.find(
        (c: PlotCard) => c.id.toString() === selectedPlotId,
      ) as PlotCard | undefined;
      onPlotSelected(card || null);
      setIsDialogOpen(false);
      setSearchKeyword("");
      // Reset mobile detail state
      setShowMobileDetail(false);
      setMobileDetailPlotId(null);
    }
  };

  const handleDialogCancel = () => {
    setIsDialogOpen(false);
    setSearchKeyword("");
    // Reset mobile detail state
    setShowMobileDetail(false);
    setMobileDetailPlotId(null);
  };

  const handleRemovePlot = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlotSelected(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-text-primary mb-2 text-base font-semibold lg:text-xl">
          Select a Scenario&nbsp;(optional)
        </h2>
        <p className="text-text-secondary text-sm">
          A scenario provides story context and starting messages for your
          session.
        </p>
      </div>

      {/* Selected Plot Display */}
      <div className="flex flex-col gap-4">
        {selectedPlot ? (
          <div className="mx-auto w-full max-w-2xl">
            <SelectedPlotCard card={selectedPlot} onRemove={handleRemovePlot} />
          </div>
        ) : (
          /* Empty State - Show Select Button Card */
          <div
            onClick={handleAddPlotClick}
            className={cn(
              "group relative cursor-pointer overflow-hidden rounded-2xl transition-all",
              "bg-black-alternate border-1 border-gray-700 p-6",
              "hover:border-primary/50 hover:shadow-lg",
            )}
          >
            <div className="flex flex-col items-center justify-center py-8">
              <IconFlow className="text-text-secondary mb-3 min-h-12 min-w-12" />
              <h3 className="text-text-primary mb-2 text-lg font-semibold">
                Select Scenario
              </h3>
              <p className="text-text-secondary text-sm">
                Click to select a scenario (optional)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Plot Selection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="flex h-[90dvh] max-h-[90dvh] max-w-5xl flex-col gap-2 md:max-w-6xl">
          <DialogHeader>
            {showMobileDetail && mobileDetailPlot ? (
              <div className="flex items-center gap-2 md:hidden">
                <button
                  onClick={() => setShowMobileDetail(false)}
                  className="text-text-primary hover:text-primary flex items-center gap-2 transition-colors"
                >
                  <ChevronLeft className="min-h-5 min-w-5" />
                  <DialogTitle className="text-left">
                    {mobileDetailPlot.props.title}
                  </DialogTitle>
                </button>
              </div>
            ) : null}
            <div className={cn(showMobileDetail && "hidden md:block")}>
              <DialogTitle>Select Scenario</DialogTitle>
              <DialogDescription>
                Choose a scenario (optional)
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* Split Layout */}
          <div className="flex min-h-0 flex-1 gap-6 py-4">
            {/* Mobile Detail View */}
            {showMobileDetail && mobileDetailPlot && (
              <div className="flex min-h-0 w-full flex-col md:hidden">
                {/* Plot Detail Content */}
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <PlotDetailPanel plot={mobileDetailPlot} />
                </div>
              </div>
            )}

            {/* Left Side: Search + Plot List */}
            <div
              className={cn(
                "flex min-h-0 w-full flex-col gap-4 md:w-1/2",
                showMobileDetail && "hidden md:flex",
              )}
            >
              {/* Search Input */}
              <SearchInput
                name="plot-search"
                placeholder="Search plots..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="flex-shrink-0"
              />

              {/* Plot Preview List */}
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="flex flex-col gap-3">
                  {filteredPlotCards.map((card: PlotCard) => {
                    const cardId = card.id.toString();
                    const isSelected = selectedPlotId === cardId;

                    return (
                      <PlotPreviewItem
                        key={`${card.props.title}-${card.id.toString()}`}
                        card={card}
                        cardId={cardId}
                        isSelected={isSelected}
                        onCardClick={handlePlotCardClick}
                        onDetailClick={(cardId) => {
                          setMobileDetailPlotId(cardId);
                          setShowMobileDetail(true);
                        }}
                        onMouseEnter={() => {
                          setPreviewPlotId(cardId);
                        }}
                      />
                    );
                  })}
                </div>

                {/* Empty State */}
                {filteredPlotCards.length === 0 && (
                  <div className="text-text-secondary flex flex-col items-center justify-center py-12 text-center">
                    {searchKeyword ? (
                      <>
                        <p className="mb-2 text-lg">No scenarios found</p>
                        <p className="text-sm">Try a different search term</p>
                      </>
                    ) : (
                      <>
                        <p className="mb-2 text-lg">No scenarios available</p>
                        <p className="text-sm">
                          Create a scenario first to continue
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Plot Detail (Desktop only) */}
            <div className="hidden w-1/2 flex-col overflow-y-auto rounded-lg bg-gray-900 p-4 md:flex">
              {previewPlot ? (
                <PlotDetailPanel plot={previewPlot} />
              ) : (
                <div className="text-text-secondary flex h-full flex-col items-center justify-center text-center">
                  <IconFlow className="mb-3 h-12 w-12 opacity-50" />
                  <p className="text-lg">Hover over a scenario</p>
                  <p className="text-sm">
                    Move your mouse over a scenario to see details
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={handleDialogCancel}>
              Cancel
            </Button>
            <Button onClick={handleDialogAdd} disabled={!selectedPlotId}>
              Select
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
