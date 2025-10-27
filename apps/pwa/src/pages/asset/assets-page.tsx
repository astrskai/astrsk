import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { CardType } from "@/entities/card/domain";
import { CharacterCard } from "@/entities/card/domain/character-card";
import { PlotCard } from "@/entities/card/domain/plot-card";
import { Flow } from "@/entities/flow/domain/flow";
import { useNavigate } from "@tanstack/react-router";
/**
 * Assets page - displays Characters, Plots, and Flows in a unified view
 * Users can switch between asset types using tab navigation
 */
export function AssetsPage() {
  const [activeTab, setActiveTab] = useState<AssetType>("characters");
  const [keyword, setKeyword] = useState<string>("");
  const [isOpenHelpDialog, setIsOpenHelpDialog] = useState<boolean>(false);
  const navigate = useNavigate();

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

  const handleImport = () => {
    // TODO: Implement import functionality
    console.log("Import clicked for:", activeTab);
  };

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
