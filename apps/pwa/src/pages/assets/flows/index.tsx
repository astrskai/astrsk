import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ListPageHeader } from "@/widgets/list-page-header";
import { ASSET_TABS } from "@/shared/config/asset-tabs";
import { FlowsGrid } from "./ui/list";
import { CreateFlowDialog } from "./ui/create";
import { FlowImportDialog } from "./ui/dialog/flow-import-dialog";
import { HelpVideoDialog, Loading, SearchEmptyState } from "@/shared/ui";
import { flowQueries } from "@/entities/flow/api/flow-queries";
import { FlowService } from "@/app/services/flow-service";
import { logger } from "@/shared/lib";
import { Flow } from "@/entities/flow/domain/flow";
import { useNavigate } from "@tanstack/react-router";
import { useResourceImport } from "@/shared/hooks/use-resource-import";

/**
 * Flows List Page
 * Displays all flows with search and create functionality
 */
export function FlowsListPage() {
  const navigate = useNavigate();

  // 1. State hooks
  const [keyword, setKeyword] = useState<string>("");
  const [isOpenHelpDialog, setIsOpenHelpDialog] = useState<boolean>(false);
  const [isOpenCreateDialog, setIsOpenCreateDialog] = useState<boolean>(false);
  const [newlyCreatedFlowId, setNewlyCreatedFlowId] = useState<string | null>(
    null,
  );

  // 2. Unified resource import hook
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

  // 3. Data fetching hooks
  const { data: allFlows, isLoading: isLoadingFlows } = useQuery(
    flowQueries.list({ keyword }),
  );

  const flows = allFlows || [];

  // 4. Memoized callbacks - functions passed as props to child components
  const handleCreateFlow = useCallback(
    async (props: Partial<Flow["props"]>) => {
      try {
        // Create flow using the domain use case
        const flowOrError = await FlowService.createFlow.execute();
        if (flowOrError.isFailure) {
          throw new Error(flowOrError.getError());
        }
        const flow = flowOrError.getValue();

        // Update the flow name if provided and different from default
        if (props.name && props.name !== "New Flow") {
          const updatedFlowOrError = flow.update({ name: props.name });
          if (updatedFlowOrError.isFailure) {
            throw new Error(updatedFlowOrError.getError());
          }
          const updatedFlow = updatedFlowOrError.getValue();

          // Save updated flow
          const savedFlowOrError =
            await FlowService.saveFlow.execute(updatedFlow);
          if (savedFlowOrError.isFailure) {
            throw new Error(savedFlowOrError.getError());
          }
        }

        toast.success("Flow created successfully");

        // Navigate to flow detail page immediately
        navigate({
          to: "/assets/workflows/$flowId",
          params: { flowId: flow.id.toString() },
        });
      } catch (error) {
        logger.error(error);
        toast.error("Failed to create flow", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [navigate],
  );

  /**
   * Wrap handleImportFlow to set newly created flow ID for animation
   */
  const handleImportFlowWithAnimation = useCallback(
    async (
      file: File,
      agentModelOverrides?: Map<
        string,
        { apiSource: string; modelId: string; modelName: string }
      >,
    ) => {
      await handleImportFlow(file, agentModelOverrides, setNewlyCreatedFlowId);
    },
    [handleImportFlow],
  );

  // 5. Regular event handlers - not passed as props, no need for useCallback
  const handleImportClick = () => {
    triggerImport();
  };
  const handleCreateClick = () => {
    setIsOpenCreateDialog(true);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Export clicked for: flows");
  };

  const handleHelpClick = () => {
    setIsOpenHelpDialog(true);
  };

  const handleClearSearch = () => {
    setKeyword("");
  };

  return (
    <div className="flex h-full w-full flex-col">
      {/* Hidden file input for import - triggers file selection */}
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
        activeTab="workflow"
        keyword={keyword}
        onKeywordChange={setKeyword}
        onImportClick={handleImportClick}
        onExportClick={handleExport}
        onHelpClick={handleHelpClick}
      />

      {/* Create Flow Dialog */}
      <CreateFlowDialog
        open={isOpenCreateDialog}
        onOpenChange={setIsOpenCreateDialog}
        onCreate={handleCreateFlow}
      />

      {/* Import Flow Dialog - skips file selection step, shows agent model overrides */}
      <FlowImportDialog
        open={isOpenImportDialog}
        onOpenChange={setIsOpenImportDialog}
        onImport={handleImportFlowWithAnimation}
        onFileSelect={async () => agentModels}
        file={importingFile}
        agentModels={agentModels}
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
            onCreateFlow={handleCreateClick}
            showNewFlowCard={!keyword}
            newlyCreatedFlowId={newlyCreatedFlowId}
          />
        )}
      </div>
    </div>
  );
}
