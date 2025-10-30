import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AssetsHeader } from "@/widgets/assets-header";
import { FlowsGrid, CreateFlowDialog } from "@/features/flow/ui";
import {
  FlowImportDialog,
  AgentModel,
} from "@/features/flow/components/flow-import-dialog";
import { HelpVideoDialog, Loading, SearchEmptyState } from "@/shared/ui";
import { flowQueries } from "@/app/queries/flow-queries";
import { FlowService } from "@/app/services/flow-service";
import { logger } from "@/shared/lib";
import { Flow } from "@/entities/flow/domain/flow";

/**
 * Flows List Page
 * Displays all flows with search and create functionality
 */
export function FlowsListPage() {
  // 1. State hooks
  const [keyword, setKeyword] = useState<string>("");
  const [isOpenHelpDialog, setIsOpenHelpDialog] = useState<boolean>(false);
  const [isOpenCreateDialog, setIsOpenCreateDialog] = useState<boolean>(false);
  const [isOpenImportDialog, setIsOpenImportDialog] = useState<boolean>(false);
  const [newlyCreatedFlowId, setNewlyCreatedFlowId] = useState<string | null>(
    null,
  );

  // 2. Query client
  const queryClient = useQueryClient();

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

        // Refresh flow list and wait for refetch to complete
        await queryClient.refetchQueries({
          queryKey: flowQueries.lists(),
        });

        // Trigger animation for newly created flow
        setNewlyCreatedFlowId(flow.id.toString());

        toast.success("Flow created successfully");
      } catch (error) {
        logger.error(error);
        toast.error("Failed to create flow", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [queryClient],
  );

  const handleFileSelect = useCallback(async (file: File) => {
    try {
      // Get models from file
      const modelNameOrError =
        await FlowService.getModelsFromFlowFile.execute(file);
      if (modelNameOrError.isFailure) {
        toast.error("Failed to read flow file", {
          description: modelNameOrError.getError(),
        });
        return;
      }

      // Parse the file to get agent names
      const text = await file.text();
      const flowJson = JSON.parse(text);
      const agentIdToModelNames = modelNameOrError.getValue();

      // Enhance with agent names
      const enhancedModels: AgentModel[] = agentIdToModelNames.map((item) => ({
        ...item,
        agentName: flowJson.agents[item.agentId]?.name || "Unknown Agent",
      }));

      return enhancedModels;
    } catch (error) {
      logger.error("Error reading flow file:", error);
      toast.error("Failed to read flow file");
    }
  }, []);

  const handleImportFlow = useCallback(
    async (
      file: File,
      agentModelOverrides?: Map<
        string,
        { apiSource: string; modelId: string; modelName: string }
      >,
    ) => {
      try {
        // Import flow from file
        const importedFlowOrError =
          await FlowService.importFlowWithNodes.execute({
            file,
            agentModelOverrides:
              agentModelOverrides && agentModelOverrides.size > 0
                ? agentModelOverrides
                : undefined,
          });

        if (importedFlowOrError.isFailure) {
          throw new Error(importedFlowOrError.getError());
        }

        const importedFlow = importedFlowOrError.getValue();

        // Refresh flow list
        await queryClient.refetchQueries({
          queryKey: flowQueries.lists(),
        });

        // Trigger animation for imported flow
        setNewlyCreatedFlowId(importedFlow.id.toString());

        toast.success("Flow imported successfully", {
          description: importedFlow.props.name || "Untitled Flow",
        });
      } catch (error) {
        logger.error(error);
        toast.error("Failed to import flow", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [queryClient],
  );

  // 5. Regular event handlers - not passed as props, no need for useCallback
  const handleImportClick = () => {
    setIsOpenImportDialog(true);
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
    <div className="bg-background-surface-2 flex h-full w-full flex-col">
      {/* Header */}
      <AssetsHeader
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

      {/* Import Flow Dialog */}
      <FlowImportDialog
        open={isOpenImportDialog}
        onOpenChange={setIsOpenImportDialog}
        onFileSelect={handleFileSelect}
        onImport={handleImportFlow}
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
