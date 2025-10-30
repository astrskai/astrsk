import { useState, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AssetsHeader, PlotsGrid } from "@/features/asset/ui";
import { HelpVideoDialog, Loading, SearchEmptyState } from "@/shared/ui";
import { cardQueries } from "@/app/queries/card-queries";
import { CardService } from "@/app/services/card-service";
import { CardType } from "@/entities/card/domain";
import { PlotCard } from "@/entities/card/domain/plot-card";

/**
 * Plots List Page
 * Displays all plot cards with search and import functionality
 */
export function PlotsListPage() {
  const [keyword, setKeyword] = useState<string>("");
  const [isOpenHelpDialog, setIsOpenHelpDialog] = useState<boolean>(false);

  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch cards
  const { data: allCards, isLoading: isLoadingCards } = useQuery(
    cardQueries.list({ keyword }),
  );

  // Filter by plot type
  const plots =
    allCards?.filter((card: PlotCard) => card.props.type === CardType.Plot) ||
    [];

  /**
   * Handle import card from file
   * Only supports PNG images with embedded metadata
   */
  const handleFileImport = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type - only PNG images allowed
      if (file.type !== "image/png") {
        toast.error("Invalid file type", {
          description: "Only PNG images with embedded metadata are supported",
        });
        return;
      }

      try {
        // Import card from file
        const result = await CardService.importCardFromFile.execute(file);

        if (result.isFailure) {
          toast.error("Failed to import card", {
            description: result.getError(),
          });
          return;
        }

        const importedCards = result.getValue();

        // Show success message
        toast.success("Card imported successfully", {
          description: `Imported ${importedCards.length} card(s)`,
        });

        // Refresh card list
        await queryClient.invalidateQueries({
          queryKey: cardQueries.lists(),
        });
      } catch (error) {
        toast.error("Failed to import card", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [queryClient],
  );

  /**
   * Trigger file input click
   */
  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Export clicked for: plots");
  };

  const handleHelpClick = () => {
    setIsOpenHelpDialog(true);
  };

  const handleClearSearch = () => {
    setKeyword("");
  };

  return (
    <div className="bg-background-surface-2 flex h-full w-full flex-col">
      {/* Hidden file input for card import */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png"
        onChange={handleFileImport}
        className="hidden"
      />

      {/* Header */}
      <AssetsHeader
        keyword={keyword}
        onKeywordChange={setKeyword}
        onImportClick={handleImport}
        onExportClick={handleExport}
        onHelpClick={handleHelpClick}
      />

      <HelpVideoDialog
        open={isOpenHelpDialog}
        onOpenChange={setIsOpenHelpDialog}
        type="cards"
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingCards ? (
          <Loading />
        ) : keyword && plots.length === 0 ? (
          // Search with no results - show empty state with clear action
          <SearchEmptyState
            keyword={keyword}
            message="No plots found"
            description="Try a different search term"
            onClearSearch={handleClearSearch}
          />
        ) : (
          // Show grid with plots (or NewPlotCard if empty)
          <PlotsGrid plots={plots} showNewPlotCard={!keyword} />
        )}
      </div>
    </div>
  );
}
