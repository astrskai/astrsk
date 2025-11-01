import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, SearchInput } from "@/shared/ui/forms";
import { CardSelectItem } from "@/features/session/ui/create-session/card-select-item";
import { CardDisplay } from "@/features/card/ui";
import { cardQueries } from "@/app/queries/card-queries";
import { CharacterCard } from "@/entities/card/domain/character-card";
import { CardType } from "@/entities/card/domain";
import { IconFlow } from "@/shared/assets/icons";
import { cn } from "@/shared/lib";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui";

interface PlotSelectionStepProps {
  selectedPlot: CharacterCard | null;
  onPlotSelected: (plot: CharacterCard | null) => void;
}

/**
 * Plot Selection Step
 * Fourth step in create session wizard
 * Allows user to select one plot card (optional)
 */
export function PlotSelectionStep({
  selectedPlot,
  onPlotSelected,
}: PlotSelectionStepProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(
    selectedPlot?.id.toString() || null,
  );
  const { data: plotCards } = useQuery(
    cardQueries.list({ type: [CardType.Plot] }),
  );

  // Filter plot cards by search keyword
  const filteredPlotCards = useMemo(() => {
    if (!plotCards) return [];
    if (!searchKeyword.trim()) return plotCards;

    const keyword = searchKeyword.toLowerCase();
    return plotCards.filter((card: CharacterCard) => {
      const title = card.props.title?.toLowerCase() || "";
      return title.includes(keyword);
    });
  }, [plotCards, searchKeyword]);

  const handleAddPlotClick = () => {
    setIsDialogOpen(true);
  };

  const handlePlotCardClick = (cardId: string) => {
    // Single select - toggle or replace
    setSelectedPlotId((prev) => (prev === cardId ? null : cardId));
  };

  const handleDialogAdd = () => {
    if (selectedPlotId && plotCards) {
      const card = plotCards.find(
        (c: CharacterCard) => c.id.toString() === selectedPlotId,
      ) as CharacterCard | undefined;
      onPlotSelected(card || null);
      setIsDialogOpen(false);
      setSearchKeyword("");
    }
  };

  const handleDialogCancel = () => {
    setIsDialogOpen(false);
    setSearchKeyword("");
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-text-primary mb-2 text-xl font-semibold">
          4. Select Plot&nbsp;(optional)
        </h2>
        <p className="text-text-secondary text-sm">
          Pick a plot to frame your session. The chosen plot will define the
          background context and provide a list of first messages to choose
          from.
        </p>
      </div>

      {/* Select from List Card */}
      <div
        onClick={handleAddPlotClick}
        className={cn(
          "group relative cursor-pointer overflow-hidden rounded-2xl transition-all",
          "bg-background-surface-1 border-2 p-6",
          "hover:border-primary/50 hover:shadow-lg",
          selectedPlot ? "border-primary shadow-lg" : "border-border",
        )}
      >
        {selectedPlot ? (
          <>
            {/* Selected Plot Display */}
            <h3 className="text-text-primary mb-4 flex items-center gap-2 text-lg font-semibold">
              <IconFlow className="h-5 w-5" />
              Selected Plot
            </h3>
            <div className="flex justify-center">
              <div className="w-48">
                <CardDisplay
                  cardId={selectedPlot.id}
                  title={selectedPlot.props.title}
                  type={selectedPlot.props.type}
                  tags={selectedPlot.props.tags}
                  tokenCount={selectedPlot.props.tokenCount}
                  iconAssetId={selectedPlot.props.iconAssetId}
                  isSelected={false}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Select from List Placeholder */}
            <div className="flex flex-col items-center justify-center py-8">
              <IconFlow className="text-text-secondary mb-3 h-12 w-12" />
              <h3 className="text-text-primary mb-2 text-lg font-semibold">
                Select from the list
              </h3>
              <p className="text-text-secondary text-sm">
                Click to select a plot (optional)
              </p>
            </div>
          </>
        )}
      </div>

      {/* Plot Selection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Select Plot</DialogTitle>
            <DialogDescription>Choose a plot card (optional)</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            {/* Search Input */}
            <SearchInput
              name="plot-search"
              placeholder="Search plots..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full max-w-md"
            />

            {/* Plot Cards Grid */}
            <div className="max-h-[400px] overflow-y-auto">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredPlotCards.map((card: CharacterCard) => (
                  <CardSelectItem
                    key={card.id.toString()}
                    card={card}
                    isSelected={selectedPlotId === card.id.toString()}
                    onClick={() => handlePlotCardClick(card.id.toString())}
                  />
                ))}
              </div>

              {/* Empty State */}
              {filteredPlotCards.length === 0 && (
                <div className="text-text-secondary flex flex-col items-center justify-center py-12 text-center">
                  {searchKeyword ? (
                    <>
                      <p className="mb-2 text-lg">No plots found</p>
                      <p className="text-sm">Try a different search term</p>
                    </>
                  ) : (
                    <>
                      <p className="mb-2 text-lg">No plot cards available</p>
                      <p className="text-sm">
                        Create a plot card first to continue
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={handleDialogCancel}>
              Cancel
            </Button>
            <Button onClick={handleDialogAdd} disabled={!selectedPlotId}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
