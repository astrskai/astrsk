import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AssetsHeader, FlowsGrid } from "@/features/asset/ui";
import { HelpVideoDialog, Loading, SearchEmptyState } from "@/shared/ui";
import { flowQueries } from "@/app/queries/flow-queries";
import { Flow } from "@/entities/flow/domain/flow";

/**
 * Flows List Page
 * Displays all flows with search functionality
 */
export function FlowsListPage() {
  const [keyword, setKeyword] = useState<string>("");
  const [isOpenHelpDialog, setIsOpenHelpDialog] = useState<boolean>(false);

  // Fetch flows
  const { data: allFlows, isLoading: isLoadingFlows } = useQuery(
    flowQueries.list(),
  );

  // Filter flows by keyword
  const flows =
    allFlows?.filter(
      (flow: Flow) =>
        !keyword ||
        flow.props.name?.toLowerCase().includes(keyword.toLowerCase()),
    ) || [];

  const handleImport = useCallback(() => {
    // TODO: Implement flow import
    toast.info("Flow import not yet implemented");
  }, []);

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Export clicked for: flows");
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
        type="flows"
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
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
      </div>
    </div>
  );
}
