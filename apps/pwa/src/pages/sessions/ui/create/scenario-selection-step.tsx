import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Trash2, BookOpen } from "lucide-react";
import { Button, SearchInput } from "@/shared/ui/forms";
import ScenarioPreview from "@/features/scenario/ui/scenario-preview";
import { cardQueries } from "@/entities/card/api/card-queries";
import { PlotCard } from "@/entities/card/domain/plot-card";
import { ScenarioCard } from "@/entities/card/domain/scenario-card";
import { CardType } from "@/entities/card/domain";
import { cn } from "@/shared/lib";
import { useAsset } from "@/shared/hooks/use-asset";
import Carousel from "@/shared/ui/carousel-v2";
import type { CharacterAction } from "@/features/character/model/character-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui";

interface ScenarioSelectionStepProps {
  selectedScenario: PlotCard | ScenarioCard | null;
  onScenarioSelected: (plot: PlotCard | ScenarioCard | null) => void;
}

/**
 * Scenario Preview Item (for dialog selection list)
 * Wrapper component that handles useAsset hook and passes imageUrl to ScenarioPreview
 */
interface ScenarioPreviewItemProps {
  card: PlotCard | ScenarioCard;
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
          firstMessages={
            card instanceof PlotCard
              ? card.props.scenarios?.length || 0
              : card instanceof ScenarioCard
                ? card.props.firstMessages?.length || 0
                : 0
          }
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
 * Selected Scenario Card
 * Wrapper component for selected scenario with Remove action
 */
interface SelectedScenarioCardProps {
  card: PlotCard | ScenarioCard;
  onClick: () => void;
  onRemove: (e: React.MouseEvent) => void;
}

const SelectedScenarioCard = ({
  card,
  onClick,
  onRemove,
}: SelectedScenarioCardProps) => {
  const [imageUrl] = useAsset(card.props.iconAssetId);

  const actions: CharacterAction[] = [
    {
      icon: Trash2,
      label: `Remove`,
      onClick: (e) => {
        e.stopPropagation();
        onRemove(e);
      },
      bottomActionsClassName: "block md:hidden",
    },
  ];

  return (
    <ScenarioPreview
      imageUrl={imageUrl}
      title={card.props.title}
      summary={card.props.cardSummary}
      tags={card.props.tags || []}
      tokenCount={card.props.tokenCount}
      firstMessages={
        card instanceof PlotCard
          ? card.props.scenarios?.length || 0
          : card instanceof ScenarioCard
            ? card.props.firstMessages?.length || 0
            : 0
      }
      actions={actions}
      isShowActions={true}
      bottomActions={actions}
      onClick={onClick}
      moreActionsClassName="hidden"
    />
  );
};

/**
 * Scenario Detail Panel
 * Displays detailed information about a selected scenario
 */
const ScenarioDetailPanel = ({
  plot,
}: {
  plot: PlotCard | ScenarioCard;
}) => {
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
              key={`${plot.props.title}-tag-${index}-${tag}`}
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

      {(() => {
        // PlotCard uses 'scenarios', ScenarioCard uses 'firstMessages'
        const firstMessages =
          plot instanceof PlotCard
            ? plot.props.scenarios
            : plot instanceof ScenarioCard
              ? plot.props.firstMessages
              : undefined;

        return (
          firstMessages &&
          firstMessages.length > 0 && (
            <div>
              <h4 className="text-text-secondary text-center text-xs">
                First message
              </h4>
              <Carousel
                slides={firstMessages.map((message, index) => ({
                  title: message.name,
                  content: (
                    <div
                      key={`${index}-${message.name}`}
                      className="text-text-secondary p-2 text-sm whitespace-pre-wrap"
                    >
                      {message.description || "No content"}
                    </div>
                  ),
            }))}
            options={{ loop: true }}
          />
        </div>
          )
        );
      })()}

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
 * Scenario Selection Step
 * Fourth step in create session wizard
 * Allows user to select one scenario card (optional)
 */
export default function ScenarioSelectionStep({
  selectedScenario,
  onScenarioSelected,
}: ScenarioSelectionStepProps) {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(
    selectedScenario?.id.toString() || null,
  );
  const [previewScenarioId, setPreviewScenarioId] = useState<string | null>(
    null,
  );
  const [showMobileDetail, setShowMobileDetail] = useState<boolean>(false);
  const [mobileDetailScenarioId, setMobileDetailScenarioId] = useState<
    string | null
  >(null);

  const { data: scenarioCards } = useQuery(
    cardQueries.list({ type: [CardType.Plot, CardType.Scenario] }),
  );

  // Sync local selection state with prop
  useEffect(() => {
    setSelectedScenarioId(selectedScenario?.id.toString() || null);
  }, [selectedScenario]);

  // Get preview scenario details (desktop)
  const previewScenario = useMemo(() => {
    if (!previewScenarioId || !scenarioCards) return null;
    return scenarioCards.find(
      (card: PlotCard | ScenarioCard) => card.id.toString() === previewScenarioId,
    ) as PlotCard | ScenarioCard | null;
  }, [previewScenarioId, scenarioCards]);

  // Get mobile detail scenario
  const mobileDetailScenario = useMemo(() => {
    if (!mobileDetailScenarioId || !scenarioCards) return null;
    return scenarioCards.find(
      (card: PlotCard | ScenarioCard) =>
        card.id.toString() === mobileDetailScenarioId,
    ) as PlotCard | ScenarioCard | null;
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

  const handleAddScenarioClick = () => {
    // Reset mobile detail state
    setShowMobileDetail(false);
    setMobileDetailScenarioId(null);
    setIsDialogOpen(true);
  };

  const handleScenarioCardClick = (cardId: string) => {
    // Single select - toggle or replace
    setSelectedScenarioId((prev) => (prev === cardId ? null : cardId));
  };

  const handleDialogAdd = () => {
    if (selectedScenarioId && scenarioCards) {
      const card = scenarioCards.find(
        (c: PlotCard) => c.id.toString() === selectedScenarioId,
      ) as PlotCard | undefined;
      onScenarioSelected(card || null);
      setIsDialogOpen(false);
      setSearchKeyword("");
      // Reset mobile detail state
      setShowMobileDetail(false);
      setMobileDetailScenarioId(null);
    }
  };

  const handleDialogCancel = () => {
    setIsDialogOpen(false);
    setSearchKeyword("");
    // Reset mobile detail state
    setShowMobileDetail(false);
    setMobileDetailScenarioId(null);
  };

  const handleRemoveScenario = (e: React.MouseEvent) => {
    e.stopPropagation();
    onScenarioSelected(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="mx-auto w-full max-w-2xl">
        <h2 className="text-text-primary mb-2 text-base font-semibold lg:text-[1.2rem]">
          Select a Scenario&nbsp;(optional)
        </h2>
        <p className="text-text-secondary text-xs md:text-sm">
          A scenario provides story context and starting messages for your
          session.
        </p>
      </div>

      {/* Selected Scenario Display */}
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        {selectedScenario ? (
          <SelectedScenarioCard
            card={selectedScenario}
            onClick={handleAddScenarioClick}
            onRemove={handleRemoveScenario}
          />
        ) : (
          /* Empty State - Show Select Button Card */
          <div
            onClick={handleAddScenarioClick}
            className={cn(
              "group relative cursor-pointer overflow-hidden rounded-2xl transition-all",
              "bg-black-alternate border-1 border-gray-700 p-6",
              "hover:border-primary/50 hover:shadow-lg",
            )}
          >
            <div className="flex flex-col items-center justify-center py-8">
              <BookOpen className="text-text-secondary mb-3 min-h-12 min-w-12" />
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

      {/* Scenario Selection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="flex h-[90dvh] max-h-[90dvh] max-w-5xl flex-col gap-2 md:max-w-6xl">
          <DialogHeader>
            {showMobileDetail && mobileDetailScenario ? (
              <div className="flex items-center gap-2 md:hidden">
                <button
                  onClick={() => setShowMobileDetail(false)}
                  className="text-text-primary hover:text-primary flex items-center gap-2 transition-colors"
                >
                  <ChevronLeft className="min-h-5 min-w-5" />
                  <DialogTitle className="text-left">
                    {mobileDetailScenario.props.title}
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
                    const isSelected = selectedScenarioId === cardId;

                    return (
                      <ScenarioPreviewItem
                        key={`${card.props.title}-${card.id.toString()}`}
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

          <DialogFooter>
            <Button variant="ghost" onClick={handleDialogCancel}>
              Cancel
            </Button>
            <Button onClick={handleDialogAdd} disabled={!selectedScenarioId}>
              Select
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
