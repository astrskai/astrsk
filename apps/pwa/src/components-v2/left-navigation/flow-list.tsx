// TODO: apply color palette

import { useFlowValidation } from "@/app/hooks/use-flow-validation";
import { flowQueries } from "@/app/queries/flow-queries";
import { queryClient } from "@/app/queries/query-client";
import { AgentService } from "@/app/services/agent-service";
import { FlowService } from "@/app/services/flow-service";
import { SessionService } from "@/app/services/session-service";
import { useAgentStore } from "@/app/stores/agent-store";
import { Page, useAppStore } from "@/app/stores/app-store";
import { FlowDialog } from "@/components-v2/flow/flow-dialog";
import { FlowImportDialog } from "@/components-v2/flow/components/flow-import-dialog";
import { SECTION_HEADER_HEIGHT } from "@/components-v2/left-navigation/constants";
import { SectionHeader } from "@/components-v2/left-navigation/left-navigation";
import { SearchInput, CreateButton, ImportButton } from "@/components-v2/left-navigation/shared-list-components";
import { SvgIcon } from "@/components-v2/svg-icon";
import { Button } from "@/components-v2/ui/button";
import { DeleteConfirm } from "@/components-v2/confirm";
import { Label } from "@/components-v2/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components-v2/ui/tooltip";
import { Agent } from "@/modules/agent/domain/agent";
import { Session } from "@/modules/session/domain/session";
import { ApiSource } from "@/modules/api/domain";
import { Flow } from "@/modules/flow/domain/flow";
import { UniqueEntityID } from "@/shared/domain";
import { cn, downloadFile, logger } from "@/shared/utils";
import * as amplitude from "@amplitude/analytics-browser";
import { useQuery } from "@tanstack/react-query";
import { delay } from "lodash-es";
import {
  CircleAlert,
  Copy,
  Download,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

const FlowItem = ({
  flowId,
  selected,
}: {
  flowId: UniqueEntityID;
  selected?: boolean;
}) => {
  // Fetch flow data
  const { data: flow } = useQuery(flowQueries.detail(flowId));

  // Validate flow
  const { isValid, isFetched } = useFlowValidation(flowId);
  const isInvalid = isFetched && !isValid;

  // Handle select
  const setActivePage = useAppStore.use.setActivePage();
  const setIsLoading = useAppStore.use.setIsLoading();
  const selectFlowId = useAgentStore.use.selectFlowId();
  const handleSelect = useCallback(() => {
    if (!flow) {
      return;
    }

    // Set loading state
    setIsLoading(true);

    // Start loading the flow immediately in the background
    selectFlowId(flow.id.toString());
    setActivePage(Page.Flow);

    // Keep the loading screen visible for a minimum duration
    setTimeout(() => {
      setIsLoading(false);
    }, 800); // 800ms minimum loading screen duration
  }, [flow, selectFlowId, setActivePage, setIsLoading]);

  // Handle export
  const handleExport = useCallback(async () => {
    try {
      // Check if service is initialized
      if (
        !FlowService.exportFlowToFile ||
        typeof FlowService.exportFlowToFile.execute !== "function"
      ) {
        console.error(
          "FlowService.exportFlowToFile not initialized:",
          FlowService.exportFlowToFile,
        );
        toast.error("Export service not initialized yet. Please try again.");
        return;
      }

      // Export flow to file
      const fileOrError = await FlowService.exportFlowToFile.execute(flowId);
      if (fileOrError.isFailure) {
        throw new Error(fileOrError.getError());
      }
      const file = fileOrError.getValue();

      if (!file) {
        throw new Error("Export returned empty file");
      }

      // Download flow file
      downloadFile(file);
      toast.success("Flow exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      logger.error(error);
      if (error instanceof Error) {
        toast.error("Failed to export flow", {
          description: error.message,
        });
      }
    }
  }, [flowId]);

  // Handle copy
  const handleCopy = useCallback(async () => {
    try {
      // Copy flow
      const copiedFlowOrError = await FlowService.cloneFlow.execute(flowId);
      if (copiedFlowOrError.isFailure) {
        throw new Error(copiedFlowOrError.getError());
      }
      const copiedFlow = copiedFlowOrError.getValue();

      // Select copied flow
      selectFlowId(copiedFlow.id.toString());

      // Invalidate flows
      await queryClient.invalidateQueries({
        queryKey: flowQueries.lists(),
      });

      toast.success("Flow copied successfully");
    } catch (error) {
      logger.error(error);
      if (error instanceof Error) {
        toast.error("Failed to copy flow", {
          description: error.message,
        });
      }
    }
  }, [flowId, selectFlowId]);

  // Handle delete
  const [isOpenDelete, setIsOpenDelete] = useState(false);
  const [usedSessions, setUsedSessions] = useState<Session[]>([]);
  const selectedFlowId = useAgentStore.use.selectedFlowId();

  const getUsedSessions = useCallback(async () => {
    const sessionsOrError = await SessionService.listSessionByFlow.execute({
      flowId: flowId,
    });
    if (sessionsOrError.isFailure) {
      return;
    }
    setUsedSessions(sessionsOrError.getValue());
  }, [flowId]);

  const handleDelete = useCallback(async () => {
    try {
      // Delete flow
      const deleteFlowOrError = await FlowService.deleteFlow.execute(flowId);
      if (deleteFlowOrError.isFailure) {
        throw new Error(deleteFlowOrError.getError());
      }

      // Unselect deleted flow
      if (selectedFlowId === flowId.toString()) {
        selectFlowId(null);
        setActivePage(Page.Init);
      }

      // Invalidate flows
      queryClient.invalidateQueries({
        queryKey: flowQueries.lists(),
      });
    } catch (error) {
      logger.error(error);
      if (error instanceof Error) {
        toast.error("Failed to delete flow", {
          description: error.message,
        });
      }
    } finally {
      // Close delete dialog
      setIsOpenDelete(false);
    }
  }, [flowId, selectFlowId, selectedFlowId, setActivePage]);

  return (
    <>
      {/* Flow Item */}
      <div
        className={cn(
          "pl-8 pr-4 py-2 group/item h-12 border-b-1 border-b-[#313131]",
          "bg-[#272727] hover:bg-[#313131]",
          "flex flex-row gap-1 items-center",
          selected && "bg-background-surface-4 rounded-[8px]",
        )}
        onClick={handleSelect}
      >
        {/* Flow Info */}
        {isInvalid && (
          <div className="shrink-0 text-[#DC2626]">
            <CircleAlert size={16} />
          </div>
        )}
        <div className="grow line-clamp-1 break-all font-[500] text-[12px] leading-[15px] text-[#F1F1F1]">
          {flow?.props.name}
        </div>
        <div className="group-hover/item:hidden shrink-0 font-[500] text-[10px] leading-[16px] text-[#9D9D9D]">
          {flow?.agentIds.length} Agents
        </div>

        {/* Actions */}
        <TooltipProvider>
          <div className="group-hover/item:flex hidden shrink-0 text-[#9D9D9D] flex-row gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleExport();
                  }}
                >
                  <Upload size={20} />
                  <span className="sr-only">Export</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={14} variant="button">
                <p>Export</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCopy();
                  }}
                >
                  <Copy size={20} />
                  <span className="sr-only">Copy</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={14} variant="button">
                <p>Copy</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isOpenDelete) {
                      await getUsedSessions();
                    }
                    setIsOpenDelete(true);
                  }}
                >
                  <Trash2 size={20} />
                  <span className="sr-only">Delete</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={14} variant="button">
                <p>Delete</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {/* Place dialog outside of flow item to prevent selecting flow */}
      <DeleteConfirm
        open={isOpenDelete}
        onOpenChange={setIsOpenDelete}
        description={
          <>
            This flow is used in{" "}
            <span className="text-secondary-normal">
              {usedSessions.length} sessions
            </span>
            .
            <br />
            Deleting it might corrupt or disable these sessions.
          </>
        }
        onDelete={handleDelete}
      />
    </>
  );
};

const FlowSection = ({ onClick }: { onClick?: () => void }) => {
  // Handle expand
  const [expanded, setExpanded] = useState(true);

  // Fetch flows
  const [keyword, setKeyword] = useState("");
  const { data: flows } = useQuery(
    flowQueries.list({
      keyword,
    }),
  );

  // Selected flow
  const activePage = useAppStore.use.activePage();
  const selectedFlowId = useAgentStore.use.selectedFlowId();

  // Handle create
  const selectFlowId = useAgentStore.use.selectFlowId();
  const setActivePage = useAppStore.use.setActivePage();
  const [isOpenCreate, setIsOpenCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const handleClickCreate = useCallback(() => {
    amplitude.track("create_flow_initiate");
    setIsOpenCreate(true);
  }, []);
  const handleDialogCreate = useCallback(
    async (props: Partial<Flow["props"]>) => {
      try {
        setIsCreating(true);
        
        // Create flow using the domain use case
        const flowOrError = await FlowService.createFlow.execute();
        if (flowOrError.isFailure) {
          throw new Error(flowOrError.getError());
        }
        const flow = flowOrError.getValue();
        
        // Update the flow name if provided
        if (props.name && props.name !== "New Flow") {
          const updatedFlowOrError = flow.update({ name: props.name });
          if (updatedFlowOrError.isFailure) {
            throw new Error(updatedFlowOrError.getError());
          }
          const updatedFlow = updatedFlowOrError.getValue();
          const savedFlowOrError = await FlowService.saveFlow.execute(updatedFlow);
          if (savedFlowOrError.isFailure) {
            throw new Error(savedFlowOrError.getError());
          }
          const savedFlow = savedFlowOrError.getValue();
          
          // Select created flow
          selectFlowId(savedFlow.id.toString());
        } else {
          // Select created flow with default name
          selectFlowId(flow.id.toString());
        }
        
        setActivePage(Page.Flow);

        // Invalidate flows
        queryClient.invalidateQueries({
          queryKey: flowQueries.lists(),
        });
        
        toast.success("Flow created successfully");
      } catch (error) {
        logger.error(error);
        toast.error("Failed to create flow", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setIsCreating(false);
      }
    },
    [selectFlowId, setActivePage],
  );
  const handleDialogClose = useCallback(() => {
    setIsOpenCreate(false);
  }, []);

  // Handle import
  const [isOpenImport, setIsOpenImport] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [agentModels, setAgentModels] = useState<ModelListItem[]>([]);
  const [agentModelOverrides, setAgentModelOverrides] = useState<
    Map<
      string,
      {
        apiSource: string;
        modelId: string;
        modelName: string;
      }
    >
  >(new Map());

  type ModelListItem = {
    agentId: string;
    agentName: string;
    modelName: string;
  };
  const handleModelNameClick = useCallback(async (file: File) => {
    if (!file) {
      return;
    }

    try {
      // Check if service is initialized
      if (
        !FlowService.getModelsFromFlowFile ||
        typeof FlowService.getModelsFromFlowFile.execute !== "function"
      ) {
        console.error("FlowService.getModelsFromFlowFile not initialized");
        toast.error("Service not initialized yet. Please try again.");
        return;
      }

      // Get models from file
      const modelNameOrError =
        await FlowService.getModelsFromFlowFile.execute(file);
      if (modelNameOrError.isFailure) {
        toast.error("Failed to read flow file", {
          description: modelNameOrError.getError(),
        });
        return;
      }

      // Parse the file to get agent names too
      const text = await file.text();
      const flowJson = JSON.parse(text);
      const agentIdToModelNames = modelNameOrError.getValue();

      // Enhance with agent names
      const enhancedModels = agentIdToModelNames.map((item) => ({
        ...item,
        agentName: flowJson.agents[item.agentId]?.name || "Unknown Agent",
      }));

      setAgentModels(enhancedModels);
    } catch (error) {
      console.error("Error reading flow file:", error);
      toast.error("Failed to read flow file");
    }
  }, []);
  const handleImport = useCallback(
    async (file: File, overrides?: Map<string, { apiSource: string; modelId: string; modelName: string }>) => {
      try {
        setIsImporting(true);

        // Check if service is initialized
        if (
          !FlowService.importFlowFromFile ||
          typeof FlowService.importFlowFromFile.execute !== "function"
        ) {
          console.error("FlowService.importFlowFromFile not initialized");
          toast.error("Import service not initialized yet. Please try again.");
          return;
        }

        // Use passed overrides or fall back to state
        const modelOverrides = overrides || agentModelOverrides;


        // Import flow from file
        const importedFlowOrError = await FlowService.importFlowFromFile.execute({
          file,
          agentModelOverrides:
            modelOverrides.size > 0 ? modelOverrides : undefined,
        });
        if (importedFlowOrError.isFailure) {
          toast.error(
            `Failed to import flow from file: ${importedFlowOrError.getError()}`,
          );
          return;
        }
        const importedFlow = importedFlowOrError.getValue();
        toast.success("Flow Imported!");

        // Invalidate flows
        await queryClient.invalidateQueries({
          queryKey: flowQueries.lists(),
        });

        // Wait a bit for queries to settle, then select the flow and navigate
        setTimeout(() => {
          selectFlowId(importedFlow.id.toString());
          setActivePage(Page.Flow);
        }, 100);

        // Close popup
        setIsOpenImport(false);
        setAgentModels([]);
        setAgentModelOverrides(new Map());
      } catch (error) {
        if (error instanceof Error) {
          toast.error("Failed to import flow", {
            description: error.message,
          });
        }
        logger.error("Failed to import flow", error);
      } finally {
        setIsImporting(false);
      }
    },
    [selectFlowId, setActivePage],
  );

  return (
    <>
      <SectionHeader
        name="Flow & Agents"
        icon={<SvgIcon name="agents" size={20} />}
        top={SECTION_HEADER_HEIGHT * 2}
        bottom={0}
        expanded={expanded}
        onToggle={() => setExpanded((prev) => !prev)}
        onClick={() => {
          setExpanded(true);
          delay(() => {
            onClick?.();
          }, 50);
        }}
      />
      <div className={cn(!expanded && "hidden")}>
        <div className="pl-8 pr-4 py-2 flex flex-row gap-2 items-center">
          <SearchInput
            className="grow"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
            }}
          />
        </div>
        <div className="pl-8 pr-4 py-2 flex flex-row gap-2 items-center">
          <CreateButton onClick={handleClickCreate} />
          <FlowDialog
            open={isOpenCreate}
            mode="create"
            onCreate={handleDialogCreate}
            onClose={handleDialogClose}
          />
          <ImportButton
            onClick={() => {
              // Check if services are initialized before opening import dialog
              if (
                !FlowService.importFlowFromFile ||
                !FlowService.getModelsFromFlowFile
              ) {
                toast.error(
                  "Services not initialized yet. Please wait a moment and try again.",
                );
                return;
              }
              setIsOpenImport(true);
            }}
          />
          <FlowImportDialog
            open={isOpenImport}
            onOpenChange={setIsOpenImport}
            onFileSelect={async (file) => {
              // Only try to get model names if service is ready
              if (
                FlowService.getModelsFromFlowFile &&
                typeof FlowService.getModelsFromFlowFile.execute === "function"
              ) {
                try {
                  // Get models from file
                  const modelNameOrError =
                    await FlowService.getModelsFromFlowFile.execute(file);
                  if (modelNameOrError.isFailure) {
                    toast.error("Failed to read flow file", {
                      description: modelNameOrError.getError(),
                    });
                    return [];
                  }

                  // Parse the file to get agent names too
                  const text = await file.text();
                  const flowJson = JSON.parse(text);
                  const agentIdToModelNames = modelNameOrError.getValue();

                  // Enhance with agent names
                  const enhancedModels = agentIdToModelNames.map(
                    (item: any) => ({
                      ...item,
                      agentName:
                        flowJson.agents[item.agentId]?.name || "Unknown Agent",
                    }),
                  );

                  setAgentModels(enhancedModels);
                  return enhancedModels;
                } catch (error) {
                  console.error("Error reading flow file:", error);
                  toast.error("Failed to read flow file");
                  return [];
                }
              } else {
                console.warn(
                  "FlowService.getModelsFromFlowFile not ready, skipping model extraction",
                );
                return [];
              }
            }}
            onImport={async (file, overrides) => {
              setAgentModelOverrides(overrides || new Map());
              // Pass the overrides directly instead of relying on state
              await handleImport(file, overrides);
            }}
          />
        </div>
        {flows && flows.length > 0 ? (
          flows.map((flow) => (
            <FlowItem
              key={flow.id.toString()}
              flowId={flow.id}
              selected={
                activePage === Page.Flow &&
                flow.id.toString() === selectedFlowId
              }
            />
          ))
        ) : (
          <div className="pl-8 pr-4 py-4 border-b-1 border-b-[#313131] grid place-items-center">
            <div className="font-[400] text-[12px] leading-[15px] text-[#9D9D9D]">
              No Flows
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export { FlowSection };
