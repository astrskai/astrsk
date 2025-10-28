import { useState, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AssetsPageHeader,
  AssetType,
  CharactersGrid,
  PlotsGrid,
  FlowsGrid,
} from "@/features/asset/ui";
import { HelpVideoDialog, Loading, SearchEmptyState } from "@/shared/ui";
import { cardQueries } from "@/app/queries/card-queries";
import { flowQueries } from "@/app/queries/flow-queries";
import { CardService } from "@/app/services/card-service";
import { CardType } from "@/entities/card/domain";
import { CharacterCard } from "@/entities/card/domain/character-card";
import { PlotCard } from "@/entities/card/domain/plot-card";
import { Flow } from "@/entities/flow/domain/flow";
/**
 * Assets page - displays Characters, Plots, and Flows in a unified view
 * Users can switch between asset types using tab navigation
 */
export function AssetsPage() {
  const [activeTab, setActiveTab] = useState<AssetType>("characters");
  const [keyword, setKeyword] = useState<string>("");
  const [isOpenHelpDialog, setIsOpenHelpDialog] = useState<boolean>(false);

  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch cards and flows based on active tab
  const { data: allCards, isLoading: isLoadingCards } = useQuery(
    cardQueries.list({ keyword }),
  );

  const { data: allFlows, isLoading: isLoadingFlows } = useQuery(
    flowQueries.list(),
  );

  // Filter by card type based on active tab
  const characters =
    activeTab === "characters"
      ? allCards?.filter(
          (card: CharacterCard) => card.props.type === CardType.Character,
        ) || []
      : [];

  const plots =
    activeTab === "plots"
      ? allCards?.filter(
          (card: PlotCard) => card.props.type === CardType.Plot,
        ) || []
      : [];

  // Filter flows by keyword
  const flows =
    activeTab === "flows"
      ? allFlows?.filter(
          (flow: Flow) =>
            !keyword ||
            flow.props.name?.toLowerCase().includes(keyword.toLowerCase()),
        ) || []
      : [];

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
    if (activeTab === "flows") {
      // TODO: Implement flow import
      toast.info("Flow import not yet implemented");
      return;
    }

    // Trigger file input for card import
    fileInputRef.current?.click();
  }, [activeTab]);

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Export clicked for:", activeTab);
  };

  const handleHelpClick = () => {
    setIsOpenHelpDialog(true);
  };

  const handleCreateFlow = () => {
    // TODO: Navigate to flow creation page
    console.log("Create flow clicked");
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
      <AssetsPageHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        keyword={keyword}
        onKeywordChange={setKeyword}
        onImportClick={handleImport}
        onExportClick={handleExport}
        onHelpClick={handleHelpClick}
      />

      <HelpVideoDialog
        open={isOpenHelpDialog}
        onOpenChange={setIsOpenHelpDialog}
        type={activeTab === "flows" ? "flows" : "cards"}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "characters" && (
          <>
            {isLoadingCards ? (
              <Loading />
            ) : keyword && characters.length === 0 ? (
              // Search with no results - show empty state with clear action
              <SearchEmptyState
                keyword={keyword}
                message="No characters found"
                description="Try a different search term"
                onClearSearch={handleClearSearch}
              />
            ) : (
              // Show grid with characters (or NewCharacterCard if empty)
              <CharactersGrid
                characters={characters}
                showNewCharacterCard={!keyword}
              />
            )}
          </>
        )}

        {activeTab === "plots" && (
          <>
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
          </>
        )}

        {activeTab === "flows" && (
          <>
            {isLoadingFlows ? (
              <Loading />
            ) : keyword && flows.length === 0 ? (
              // Search with no results - show empty state with clear action
              <SearchEmptyState
                keyword={keyword}
                message="No flows found"
                description="Try a different search term"
                onClearSearch={handleClearSearch}
              />
            ) : (
              // Show grid with flows (or NewFlowCard if empty)
              <FlowsGrid
                flows={flows}
                onCreateFlow={handleCreateFlow}
                keyword={keyword}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
