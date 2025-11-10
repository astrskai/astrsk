import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ListPageHeader } from "@/widgets/list-page-header";
import { ASSET_TABS } from "@/shared/config/asset-tabs";
import {
  SORT_OPTIONS,
  DEFAULT_SORT_VALUE,
  type SortOptionValue,
} from "@/shared/config/sort-options";
import { ScenariosGrid } from "./ui/list";
import {
  HelpVideoDialog,
  Loading,
  SearchEmptyState,
  EmptyState,
} from "@/shared/ui";
import { Select } from "@/shared/ui/forms";
import { cardQueries } from "@/entities/card/api";
import { CardType } from "@/entities/card/domain";
import { PlotCard } from "@/entities/card/domain/plot-card";
import { useResourceImport } from "@/shared/hooks/use-resource-import";
import { FlowImportDialog } from "@/pages/assets/workflows/ui/dialog/flow-import-dialog";

/**
 * Plots List Page
 * Displays all plot cards with search and import functionality
 */
export function PlotsListPage() {
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState<string>("");
  const [isOpenHelpDialog, setIsOpenHelpDialog] = useState<boolean>(false);
  const [sortOption, setSortOption] =
    useState<SortOptionValue>(DEFAULT_SORT_VALUE);

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
    cardQueries.list({ keyword, sort: sortOption }),
  );

  // Filter by plot type
  const scenarios = useMemo(() => {
    return (
      allCards?.filter((card: PlotCard) => card.props.type === CardType.Plot) ||
      []
    );
  }, [allCards]);

  const handleSortOptionChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setSortOption(event.target.value);
  };

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

  const handleCreateScenario = () => {
    navigate({ to: "/assets/scenarios/new" });
  };

  return (
    <div className="flex w-full flex-1 flex-col">
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
        activeTab="scenario"
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
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4">
        {isLoadingCards ? (
          <Loading />
        ) : keyword && scenarios.length === 0 ? (
          <SearchEmptyState keyword={keyword} />
        ) : !keyword && scenarios.length === 0 ? (
          <EmptyState
            title="No scenarios available"
            description="Start your new scenario"
            buttonLabel="Create new scenario"
            onButtonClick={handleCreateScenario}
          />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-200">
                <span className="font-semibold text-gray-50">
                  {scenarios.length}
                </span>{" "}
                {scenarios.length === 1 ? "scenario" : "scenarios"}
              </span>
              <Select
                options={SORT_OPTIONS}
                value={sortOption}
                onChange={handleSortOptionChange}
                selectSize="sm"
                className="w-[150px] md:w-[180px]"
              />
            </div>

            <ScenariosGrid
              scenarios={scenarios}
              showNewScenarioCard={!keyword}
            />
          </>
        )}
      </div>
    </div>
  );
}
