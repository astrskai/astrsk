import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ListPageHeader } from "@/widgets/header";
import {
  SORT_OPTIONS,
  DEFAULT_SORT_VALUE,
  type SortOptionValue,
} from "@/shared/config/sort-options";
import { ScenariosGridV2 } from "./ui/list/scenarios-grid-v2";
import {
  HelpVideoDialog,
  Loading,
  SearchEmptyState,
  EmptyState,
} from "@/shared/ui";
import { cardQueries } from "@/entities/card/api";
import { CardType } from "@/entities/card/domain";
import { PlotCard } from "@/entities/card/domain/plot-card";
import { useResourceImport } from "@/shared/hooks/use-resource-import";
import { FlowImportDialog } from "@/pages/assets/workflows/ui/dialog/flow-import-dialog";

/**
 * Scenarios Page
 * Displays all scenario cards with search and import functionality
 */
export function ScenariosPage() {
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

  // Filter by scenario type
  const scenarios = useMemo(() => {
    return (
      allCards?.filter((card: PlotCard) => card.props.type === CardType.Plot) ||
      []
    );
  }, [allCards]);

  // Event handlers
  const handleImport = () => {
    triggerImport();
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
        title="Scenarios"
        keyword={keyword}
        onKeywordChange={setKeyword}
        onImportClick={handleImport}
        onHelpClick={handleHelpClick}
        createLabel="New Scenario"
        onCreateClick={handleCreateScenario}
        sortOptions={SORT_OPTIONS}
        sortValue={sortOption}
        onSortChange={setSortOption}
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
      <div className="flex w-full flex-1 flex-col gap-4 p-4 md:p-8">
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
          <ScenariosGridV2 scenarios={scenarios} />
        )}
      </div>
    </div>
  );
}
