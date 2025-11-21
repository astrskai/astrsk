import { useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { FlowsGrid } from "./ui/list";
import { CreateFlowDialog } from "./ui/create";
import { FlowImportDialog } from "./ui/dialog/flow-import-dialog";

import { ListPageHeader } from "@/widgets/list-page-header";
import { ASSET_TABS } from "@/shared/config/asset-tabs";
import {
  HelpVideoDialog,
  Loading,
  SearchEmptyState,
  EmptyState,
} from "@/shared/ui";
import { Select } from "@/shared/ui/forms";
import { Flow } from "@/entities/flow/domain/flow";
import { flowQueries } from "@/entities/flow/api";
import { FlowService } from "@/app/services/flow-service";
import { logger } from "@/shared/lib";
import { useResourceImport } from "@/shared/hooks/use-resource-import";
import {
  SortOptionValue,
  DEFAULT_SORT_VALUE,
  SORT_OPTIONS,
} from "@/shared/config/sort-options";

/**
 * Flows List Page
 * Displays all flows with search and create functionality
 */
export default function WorkflowsListPage() {
  const navigate = useNavigate();

  // 1. State hooks
  const [keyword, setKeyword] = useState<string>("");
  const [isOpenHelpDialog, setIsOpenHelpDialog] = useState<boolean>(false);
  const [isOpenCreateDialog, setIsOpenCreateDialog] = useState<boolean>(false);
  const [newlyCreatedFlowId, setNewlyCreatedFlowId] = useState<string | null>(
    null,
  );
  const [sortOption, setSortOption] =
    useState<SortOptionValue>(DEFAULT_SORT_VALUE);

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
  const { data: workflows = [], isLoading: isLoadingFlows } = useQuery(
    flowQueries.list({ keyword, sort: sortOption }),
  );

  const handleSortOptionChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setSortOption(event.target.value);
  };

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
          to: "/assets/workflows/$workflowId",
          params: { workflowId: flow.id.toString() },
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

  return (
    <div className="flex w-full flex-1 flex-col">
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
        title="Workflows"
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
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4">
        {isLoadingFlows ? (
          <Loading />
        ) : keyword && workflows.length === 0 ? (
          <SearchEmptyState keyword={keyword} />
        ) : !keyword && workflows.length === 0 ? (
          <EmptyState
            title="No workflows available"
            description="Start your new workflow"
            buttonLabel="Create new workflow"
            onButtonClick={handleCreateClick}
          />
        ) : (
          <>
            {/* Sort Controls */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-200">
                <span className="font-semibold text-gray-50">
                  {workflows.length}
                </span>{" "}
                {workflows.length === 1 ? "workflow" : "workflows"}
              </span>
              <Select
                options={SORT_OPTIONS}
                value={sortOption}
                onChange={handleSortOptionChange}
                selectSize="sm"
                className="w-[150px] md:w-[180px]"
              />
            </div>

            <FlowsGrid
              flows={workflows}
              onCreateFlow={handleCreateClick}
              showNewFlowCard={!keyword}
              newlyCreatedFlowId={newlyCreatedFlowId}
            />
          </>
        )}
      </div>
    </div>
  );
}
