import { useState, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  AssetsPageHeader,
  AssetType,
  CharactersGrid,
  PlotsGrid,
  FlowsGrid,
} from "@/features/asset/ui";
import { HelpVideoDialog, Loading } from "@/shared/ui";
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
  const [isImporting, setIsImporting] = useState<boolean>(false);

  const navigate = useNavigate();
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

      setIsImporting(true);

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
        setIsImporting(false);
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

  const handleCreateCharacter = () => {
    navigate({ to: "/assets/create/character" });
  };

  const handleCreatePlot = () => {
    // TODO: Navigate to plot creation page
    console.log("Create plot clicked");
  };

  const handleCreateFlow = () => {
    // TODO: Navigate to flow creation page
    console.log("Create flow clicked");
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
              <div className="flex h-full items-center justify-center">
                <Loading />
              </div>
            ) : characters.length > 0 || !keyword ? (
              <CharactersGrid
                characters={characters}
                onCreateCharacter={handleCreateCharacter}
                keyword={keyword}
              />
            ) : (
              // Search with no results
              <div className="text-text-secondary flex h-full items-center justify-center">
                <div className="text-center">
                  <p className="mb-2 text-lg">No characters found</p>
                  <p className="text-sm">Try a different search term</p>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "plots" && (
          <>
            {isLoadingCards ? (
              <div className="flex h-full items-center justify-center">
                <Loading />
              </div>
            ) : plots.length > 0 || !keyword ? (
              <PlotsGrid
                plots={plots}
                onCreatePlot={handleCreatePlot}
                keyword={keyword}
              />
            ) : (
              // Search with no results
              <div className="text-text-secondary flex h-full items-center justify-center">
                <div className="text-center">
                  <p className="mb-2 text-lg">No plots found</p>
                  <p className="text-sm">Try a different search term</p>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "flows" && (
          <>
            {isLoadingFlows ? (
              <div className="flex h-full items-center justify-center">
                <Loading />
              </div>
            ) : flows.length > 0 || !keyword ? (
              <FlowsGrid
                flows={flows}
                onCreateFlow={handleCreateFlow}
                keyword={keyword}
              />
            ) : (
              // Search with no results
              <div className="text-text-secondary flex h-full items-center justify-center">
                <div className="text-center">
                  <p className="mb-2 text-lg">No flows found</p>
                  <p className="text-sm">Try a different search term</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
