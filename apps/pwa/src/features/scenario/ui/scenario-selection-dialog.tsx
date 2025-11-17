import { useMemo, useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronLeft } from "lucide-react";
import { Button, SearchInput } from "@/shared/ui/forms";
import ScenarioPreview from "@/features/scenario/ui/scenario-preview";
import Carousel from "@/shared/ui/carousel-v2";
import { cardQueries } from "@/entities/card/api/card-queries";
import { PlotCard } from "@/entities/card/domain/plot-card";
import { CardType } from "@/entities/card/domain";
import { cn } from "@/shared/lib";
import { useAsset } from "@/shared/hooks/use-asset";
import type { CharacterAction } from "@/features/character/model/character-actions";
import DialogBase from "@/shared/ui/dialogs/base";

interface ScenarioSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedScenario: PlotCard | null;
  onConfirm: (scenario: PlotCard | null) => void;
  title?: string;
  description?: string;
  confirmButtonText?: string;
}

/**
 * Scenario Preview Item (for dialog selection list)
 * Wrapper component that handles useAsset hook and passes imageUrl to ScenarioPreview
 */
interface ScenarioPreviewItemProps {
  card: PlotCard;
  cardId: string;
  isSelected: boolean;
  onCardClick: (cardId: string) => void;
  onDetailClick: (cardId: string) => void;
  onMouseEnter: () => void;
}

const ScenarioPreviewItem = ({
  card,
  cardId,
  isSelected,
  onCardClick,
  onDetailClick,
  onMouseEnter,
}: ScenarioPreviewItemProps) => {
  const [imageUrl] = useAsset(card.props.iconAssetId);

  const bottomActions: CharacterAction[] = [
    {
      label: `Detail >`,
      onClick: (e) => {
        e.stopPropagation();
        onDetailClick(cardId);
      },
      bottomActionsClassName: "block md:hidden",
    },
  ];

  return (
    <div className="relative transition-all">
      <div
        onClick={() => onCardClick(cardId)}
        onMouseEnter={onMouseEnter}
        className="pointer-events-auto"
      >
        <ScenarioPreview
          imageUrl={imageUrl}
          title={card.props.title}
          summary={card.props.cardSummary}
          tags={card.props.tags || []}
          tokenCount={card.props.tokenCount}
          firstMessages={card.props.scenarios?.length || 0}
          className={cn(
            isSelected &&
              "border-normal-primary hover:border-normal-primary/70 border-2 shadow-lg",
          )}
          bottomActions={bottomActions}
        />
      </div>
    </div>
  );
};

/**
 * Scenario Detail Panel
 * Displays detailed information about a selected scenario
 */
const ScenarioDetailPanel = ({ plot }: { plot: PlotCard }) => {
  const [scenarioImageUrl] = useAsset(plot.props.iconAssetId);

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <h3 className="hidden text-lg font-semibold text-gray-50 md:block">
        {plot.props.title}
      </h3>

      {/* Scenario Image */}
      <div className="relative mx-auto aspect-[3/4] max-w-[200px] overflow-hidden rounded-lg md:max-w-xs">
        <img
          src={scenarioImageUrl || "/img/placeholder/scenario-card-image.png"}
          alt={plot.props.title}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Description */}
      <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
        {plot.props.description || "No description available"}
      </p>

      {/* Tags */}
      {plot.props.tags && plot.props.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {plot.props.tags.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="rounded-md bg-gray-800 px-2.5 py-0.5 text-sm font-semibold text-gray-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Token Count */}
      {plot.props.tokenCount && plot.props.tokenCount > 0 && (
        <div className="text-text-secondary flex items-center gap-2 text-sm">
          <span className="font-semibold text-gray-50">
            {plot.props.tokenCount}
          </span>
          <span>Tokens</span>
        </div>
      )}

      {plot.props.scenarios && plot.props.scenarios.length > 0 && (
        <div>
          <h4 className="text-text-secondary text-center text-xs">
            First message
          </h4>
          <Carousel
            slides={plot.props.scenarios.map((scenario, index) => ({
              title: scenario.name,
              content: (
                <div
                  key={`${index}-${scenario.name}`}
                  className="text-text-secondary p-2 text-sm whitespace-pre-wrap"
                >
                  {scenario.description || "No content"}
                </div>
              ),
            }))}
            options={{ loop: true }}
          />
        </div>
      )}

      {plot.props.lorebook && plot.props.lorebook.props.entries.length > 0 && (
        <div>
          <h4 className="text-text-secondary text-center text-xs">Lorebook</h4>
          <Carousel
            slides={plot.props.lorebook.props.entries.map((entry, index) => ({
              title: entry.name,
              content: (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {entry.keys.map((key, keyIndex) => (
                      <span
                        key={`${index}-${key}-${keyIndex}`}
                        className="rounded-md bg-gray-700/80 px-2.5 py-1 text-sm font-semibold text-white"
                      >
                        {key}
                      </span>
                    ))}
                  </div>
                  <div className="text-text-secondary p-2 text-sm whitespace-pre-wrap">
                    {entry.props.content || "No content"}
                  </div>
                </div>
              ),
            }))}
            options={{ loop: true }}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Scenario Selection Dialog
 * Reusable dialog for selecting scenario cards
 * Supports single selection only (no multiple selection)
 */
export function ScenarioSelectionDialog({
  open,
  onOpenChange,
  selectedScenario,
  onConfirm,
  title = "Select Scenario",
  description = "Choose a scenario (optional)",
  confirmButtonText = "Select",
}: ScenarioSelectionDialogProps) {
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  // Temporary state for dialog selection (only committed on Confirm)
  const [tempSelectedId, setTempSelectedId] = useState<string | null>(
    selectedScenario?.id.toString() || null,
  );
  const [previewScenarioId, setPreviewScenarioId] = useState<string | null>(
    null,
  );
  const [showMobileDetail, setShowMobileDetail] = useState<boolean>(false);
  const [mobileDetailScenarioId, setMobileDetailScenarioId] = useState<
    string | null
  >(null);

  const { data: scenarioCards } = useQuery({
    ...cardQueries.list({ type: [CardType.Plot] }),
    enabled: open, // Only fetch when dialog is open
  });

  // Initialize state when dialog opens
  useEffect(() => {
    if (open) {
      setTempSelectedId(selectedScenario?.id.toString() || null);
      setSearchKeyword("");
      setShowMobileDetail(false);
      setMobileDetailScenarioId(null);
    }
  }, [open, selectedScenario]);

  // Get preview scenario details (desktop)
  const previewScenario = useMemo(() => {
    if (!previewScenarioId || !scenarioCards) return null;
    return scenarioCards.find(
      (card: PlotCard) => card.id.toString() === previewScenarioId,
    ) as PlotCard | null;
  }, [previewScenarioId, scenarioCards]);

  // Get mobile detail scenario
  const mobileDetailScenario = useMemo(() => {
    if (!mobileDetailScenarioId || !scenarioCards) return null;
    return scenarioCards.find(
      (card: PlotCard) => card.id.toString() === mobileDetailScenarioId,
    ) as PlotCard | null;
  }, [mobileDetailScenarioId, scenarioCards]);

  // Filter scenario cards by search keyword
  const filteredScenarioCards = useMemo(() => {
    if (!scenarioCards) return [];
    if (!searchKeyword.trim()) return scenarioCards;

    const keyword = searchKeyword.toLowerCase();
    return scenarioCards.filter((card: PlotCard) => {
      const title = card.props.title?.toLowerCase() || "";
      return title.includes(keyword);
    });
  }, [scenarioCards, searchKeyword]);

  const handleScenarioCardClick = useCallback((cardId: string) => {
    // Single selection mode: toggle selection
    setTempSelectedId((prev) => (prev === cardId ? null : cardId));
  }, []);

  const handleClose = useCallback(() => {
    // Just close the dialog - useEffect will handle reset
    onOpenChange(false);
  }, [onOpenChange]);

  const handleConfirm = useCallback(() => {
    // Commit temp selection to actual state
    if (scenarioCards) {
      const selected = tempSelectedId
        ? (scenarioCards.find(
            (card: PlotCard) => card.id.toString() === tempSelectedId,
          ) as PlotCard | undefined)
        : null;
      onConfirm(selected || null);
      handleClose();
    }
  }, [tempSelectedId, scenarioCards, onConfirm, handleClose]);

  const handleCancel = useCallback(() => {
    handleClose();
  }, [handleClose]);

  // Just pass through to parent - useEffect handles initialization
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      onOpenChange(newOpen);
    },
    [onOpenChange],
  );

  return (
    <DialogBase
      open={open}
      onOpenChange={handleOpenChange}
      title={showMobileDetail && mobileDetailScenario ? "" : title}
      description={showMobileDetail && mobileDetailScenario ? "" : description}
      isShowCloseButton={false}
      size="2xl"
      content={
        <div className="flex h-[70dvh] max-h-[70dvh] flex-col gap-4">
          {/* Mobile Detail Header */}
          {showMobileDetail && mobileDetailScenario && (
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setShowMobileDetail(false)}
                className="text-text-primary hover:text-primary flex items-center gap-2 transition-colors"
                aria-label="Back to scenario list"
              >
                <ChevronLeft className="min-h-5 min-w-5" />
                <h3 className="text-lg font-semibold text-gray-50">
                  {mobileDetailScenario.props.title}
                </h3>
              </button>
            </div>
          )}

          {/* Split Layout */}
          <div className="flex min-h-0 flex-1 gap-6">
            {/* Mobile Detail View */}
            {showMobileDetail && mobileDetailScenario && (
              <div className="flex min-h-0 w-full flex-col md:hidden">
                {/* Scenario Detail Content */}
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <ScenarioDetailPanel plot={mobileDetailScenario} />
                </div>
              </div>
            )}

            {/* Left Side: Search + Scenario List */}
            <div
              className={cn(
                "flex min-h-0 w-full flex-col gap-4 md:w-1/2",
                showMobileDetail && "hidden md:flex",
              )}
            >
              {/* Search Input */}
              <SearchInput
                name="scenario-search"
                placeholder="Search scenarios..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="flex-shrink-0"
              />

              {/* Scenario Preview List */}
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="flex flex-col gap-3">
                  {filteredScenarioCards.map((card: PlotCard) => {
                    const cardId = card.id.toString();
                    const isSelected = tempSelectedId === cardId;

                    return (
                      <ScenarioPreviewItem
                        key={cardId}
                        card={card}
                        cardId={cardId}
                        isSelected={isSelected}
                        onCardClick={handleScenarioCardClick}
                        onDetailClick={(cardId) => {
                          setMobileDetailScenarioId(cardId);
                          setShowMobileDetail(true);
                        }}
                        onMouseEnter={() => {
                          setPreviewScenarioId(cardId);
                        }}
                      />
                    );
                  })}
                </div>

                {/* Empty State */}
                {filteredScenarioCards.length === 0 && (
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

            {/* Right Side: Scenario Detail (Desktop only) */}
            <div className="hidden w-1/2 flex-col overflow-y-auto rounded-lg bg-gray-900 p-4 md:flex">
              {previewScenario ? (
                <ScenarioDetailPanel plot={previewScenario} />
              ) : (
                <div className="text-text-secondary flex h-full flex-col items-center justify-center text-center">
                  <BookOpen className="mb-3 h-12 w-12 opacity-50" />
                  <p className="text-lg">Hover over a scenario</p>
                  <p className="text-sm">
                    Move your mouse over a scenario to see details
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-2 border-t border-gray-700 pt-4">
            <Button variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              {confirmButtonText}
              {tempSelectedId ? " (1)" : ""}
            </Button>
          </div>
        </div>
      }
    />
  );
}
