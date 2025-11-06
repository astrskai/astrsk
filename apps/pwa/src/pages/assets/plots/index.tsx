import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ListPageHeader } from "@/widgets/list-page-header";
import { ASSET_TABS } from "@/shared/config/asset-tabs";
import { PlotsGrid } from "./ui/list";
import { HelpVideoDialog, Loading, SearchEmptyState } from "@/shared/ui";
import { cardQueries } from "@/entities/card/api/card-queries";
import { CardType } from "@/entities/card/domain";
import { PlotCard } from "@/entities/card/domain/plot-card";
import { useResourceImport } from "@/shared/hooks/use-resource-import";
import { FlowImportDialog } from "@/pages/assets/flows/ui/dialog/flow-import-dialog";

/**
 * Plots List Page
 * Displays all plot cards with search and import functionality
 */
export function PlotsListPage() {
  const [keyword, setKeyword] = useState<string>("");
  const [isOpenHelpDialog, setIsOpenHelpDialog] = useState<boolean>(false);

  // Unified resource import hook
  const {
    fileInputRef,
    isOpenImportDialog,
    setIsOpenImportDialog,
    importingFile,
    agentModels,
    handleFileSelect,
    handleImportFlow,
    triggerImport,
  } = useResourceImport();

  // Fetch cards
  const { data: allCards, isLoading: isLoadingCards } = useQuery(
    cardQueries.list({ keyword }),
  );

  // Filter by plot type
  const plots =
    allCards?.filter((card: PlotCard) => card.props.type === CardType.Plot) ||
    [];

  // Event handlers
  const handleImport = () => {
    triggerImport();
  };

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
    <div className="flex h-full w-full flex-col">
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,.json,application/json"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Header */}
      <ListPageHeader
        title="Assets"
        tabs={ASSET_TABS}
        activeTab="plots"
        keyword={keyword}
        onKeywordChange={setKeyword}
        onImportClick={handleImport}
        onExportClick={handleExport}
        onHelpClick={handleHelpClick}
      />

      {/* Import Flow Dialog - for JSON imports */}
      <FlowImportDialog
        open={isOpenImportDialog}
        onOpenChange={setIsOpenImportDialog}
        onImport={handleImportFlow}
        onFileSelect={async () => agentModels}
        file={importingFile}
        agentModels={agentModels}
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
