// TODO: apply color palette

import { useFlowValidation } from "@/shared/hooks/use-flow-validation";
import { flowQueries } from "@/entities/flow/api/flow-queries";
import {
  useCloneFlowWithNodes,
  useDeleteFlowWithNodes,
} from "@/entities/flow/api/mutations/flow-mutations";
import { queryClient } from "@/shared/api/query-client";
import { AgentService } from "@/app/services/agent-service";
import { FlowService } from "@/app/services/flow-service";
import { SessionService } from "@/app/services/session-service";
import { useAgentStore } from "@/shared/stores/agent-store";
import { useAppStore } from "@/shared/stores/app-store";
import { useNavigate, useLocation } from "@tanstack/react-router";
// import { FlowDialog } from "@/features/flow/flow-dialog";
import { FlowImportDialog } from "@/pages/assets/flows/ui/dialog/flow-import-dialog";
import {
  FlowExportDialog,
  AgentModelTierInfo,
} from "@/pages/assets/flows/ui/dialog/flow-export-dialog";
import { ModelTier } from "@/entities/agent/domain/agent";
import { SectionHeader } from "./index";
import {
  SearchInput,
  CreateButton,
  ImportButton,
} from "./shared-list-components";
import { DeleteConfirm, SvgIcon } from "@/shared/ui";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui";
import { Session } from "@/entities/session/domain/session";
import { Flow, ReadyState } from "@/entities/flow/domain/flow";
import { UniqueEntityID } from "@/shared/domain";
import { cn } from "@/shared/lib";
import { downloadFile, logger } from "@/shared/lib";
import { useQuery } from "@tanstack/react-query";
import { delay } from "lodash-es";
import { CircleAlert, Copy, Loader2, Trash2, Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { getUniqueEntityIDFromPath } from "@/shared/lib/url-utils";

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

  // Clone mutation
  const cloneFlowMutation = useCloneFlowWithNodes();

  // Delete mutation
  const deleteFlowMutation = useDeleteFlowWithNodes();

  // Export dialog state
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportAgents, setExportAgents] = useState<AgentModelTierInfo[]>([]);

  // Handle select
  const navigate = useNavigate();
  const selectFlowId = useAgentStore.use.selectFlowId();
  const setIsLoading = useAppStore.use.setIsLoading();

  const handleSelect = useCallback(() => {
    if (!flow) {
      return;
    }

    // Set loading state
    setIsLoading(true);

    // Start loading the flow immediately in the background
    selectFlowId(flow.id.toString());

    // Navigate to the flow
    navigate({
      to: "/assets/flows/$flowId",
      params: { flowId: flow.id.toString() },
    });

    // Keep the loading screen visible for a minimum duration
    setTimeout(() => {
      setIsLoading(false);
    }, 800); // 800ms minimum loading screen duration
  }, [flow, selectFlowId, setIsLoading, navigate]);

  // Handle export dialog open
  const handleExportClick = useCallback(async () => {
    try {
      if (!flow) return;

      // Get agents for this flow
      const agents: AgentModelTierInfo[] = [];

      // Get agent data from flow nodes
      for (const node of flow.props.nodes) {
        if (node.type === "agent") {
          const agentId = node.id;
          // Query agent data
          const agentQuery = await queryClient.fetchQuery({
            queryKey: ["agent", agentId],
            queryFn: async () => {
              const result = await AgentService.getAgent.execute(
                new UniqueEntityID(agentId),
              );
              if (result.isFailure) throw new Error(result.getError());
              return result.getValue();
            },
          });

          if (agentQuery) {
            agents.push({
              agentId: agentId,
              agentName: agentQuery.props.name,
              modelName: agentQuery.props.modelName || "",
              recommendedTier: ModelTier.Light,
              selectedTier: agentQuery.props.modelTier || ModelTier.Light,
            });
          }
        }
      }

      setExportAgents(agents);
      setIsExportDialogOpen(true);
    } catch (error) {
      console.error("Failed to prepare export:", error);
      toast.error("Failed to prepare export");
    }
  }, [flow]);

  // Handle export with tier selections
  const handleExport = useCallback(
    async (modelTierSelections: Map<string, ModelTier>) => {
      try {
        // Check if service is initialized
        if (
          !FlowService.exportFlowWithNodes ||
          typeof FlowService.exportFlowWithNodes.execute !== "function"
        ) {
          console.error(
            "FlowService.exportFlowWithNodes not initialized:",
            FlowService.exportFlowWithNodes,
          );
          toast.error("Export service not initialized yet. Please try again.");
          return;
        }

        // Export flow to file using enhanced export with model tier selections
        const fileOrError = await FlowService.exportFlowWithNodes.execute({
          flowId,
          modelTierSelections,
        });
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
        setIsExportDialogOpen(false);
      } catch (error) {
        console.error("Export error:", error);
        logger.error(error);
        if (error instanceof Error) {
          toast.error("Failed to export flow", {
            description: error.message,
          });
        }
      }
    },
    [flowId],
  );

  // Handle copy
  const handleCopy = useCallback(async () => {
    try {
      const copiedFlow = await cloneFlowMutation.mutateAsync(flowId.toString());

      // Select copied flow after the clone operation is fully complete
      // The mutation's onSuccess has already populated the cache
      selectFlowId(copiedFlow.id.toString());

      navigate({
        to: "/assets/flows/$flowId",
        params: { flowId: copiedFlow.id.toString() },
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
  }, [flowId, navigate, cloneFlowMutation, selectFlowId]);

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
      // Delete flow with all nodes
      await deleteFlowMutation.mutateAsync(flowId.toString());

      // Navigate away from deleted flow if currently viewing it
      if (selectedFlowId === flowId.toString()) {
        selectFlowId(null);
        navigate({ to: "/" });
      }

      toast.success("Flow deleted successfully");
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
  }, [flowId, navigate, deleteFlowMutation, selectFlowId, selectedFlowId]);

  return (
    <>
      {/* Flow Item */}
      <div
        className={cn(
          "group/item h-12 border-b-1 border-b-[#313131] py-2 pr-4 pl-8",
          "bg-[#272727] hover:bg-[#313131] pointer-coarse:focus-within:bg-[#313131]",
          "flex flex-row items-center gap-1",
          selected && "bg-background-surface-4 rounded-[8px]",
        )}
        tabIndex={0}
        onClick={handleSelect}
      >
        {/* Flow Info */}
        {isInvalid && (
          <div className="shrink-0 text-[#DC2626]">
            <CircleAlert size={16} />
          </div>
        )}
        <div className="line-clamp-1 grow text-[12px] leading-[15px] font-[500] break-all text-[#F1F1F1]">
          {flow?.props.name}
        </div>
        <div className="shrink-0 group-hover/item:hidden pointer-coarse:group-focus-within/item:hidden">
          <div
            className={cn(
              "px-2 py-0.5 text-xs leading-[16px] font-[500]",
              flow?.props.readyState === ReadyState.Ready
                ? "text-status-ready-dark"
                : flow?.props.readyState === ReadyState.Error
                  ? "text-status-destructive-light"
                  : "text-text-placeholder",
            )}
          >
            {flow?.props.readyState === ReadyState.Ready
              ? "Ready"
              : flow?.props.readyState === ReadyState.Error
                ? "Error"
                : "Draft"}
          </div>
        </div>

        {/* Actions */}
        <TooltipProvider>
          <div className="hidden shrink-0 flex-row gap-2 text-[#9D9D9D] group-hover/item:flex pointer-coarse:group-focus-within/item:flex">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleExportClick();
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
                  disabled={cloneFlowMutation.isPending}
                  className={cn(
                    cloneFlowMutation.isPending &&
                      "cursor-not-allowed opacity-50",
                  )}
                >
                  {cloneFlowMutation.isPending ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Copy size={20} />
                  )}
                  <span className="sr-only">Copy</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={14} variant="button">
                <p>{cloneFlowMutation.isPending ? "Copying..." : "Copy"}</p>
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
                  disabled={deleteFlowMutation.isPending}
                  className={cn(
                    deleteFlowMutation.isPending &&
                      "cursor-not-allowed opacity-50",
                  )}
                >
                  {deleteFlowMutation.isPending ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Trash2 size={20} />
                  )}
                  <span className="sr-only">Delete</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={14} variant="button">
                <p>{deleteFlowMutation.isPending ? "Deleting..." : "Delete"}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {/* Place dialogs outside of flow item to prevent selecting flow */}
      <FlowExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        agents={exportAgents}
        onExport={handleExport}
      />

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

const FlowSection = ({
  onClick,
  onboardingHighlight,
  onboardingCollapsed,
  onHelpClick,
  onboardingHelpGlow,
}: {
  onClick?: () => void;
  onboardingHighlight?: boolean;
  onboardingCollapsed?: boolean;
  onHelpClick?: () => void;
  onboardingHelpGlow?: boolean;
}) => {
  // Handle expand
  const [expanded, setExpanded] = useState(onboardingCollapsed ? false : true);

  const navigate = useNavigate();

  // Fetch flows
  const [keyword, setKeyword] = useState("");
  const { data: flows } = useQuery(
    flowQueries.list({
      keyword,
    }),
  );

  // Selected flow
  const location = useLocation();
  const currentFlowId = getUniqueEntityIDFromPath(location.pathname, "flows");

  // Handle create
  const selectFlowId = useAgentStore.use.selectFlowId();
  const [isOpenCreate, setIsOpenCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleClickCreate = useCallback(() => {
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
          const savedFlowOrError =
            await FlowService.saveFlow.execute(updatedFlow);
          if (savedFlowOrError.isFailure) {
            throw new Error(savedFlowOrError.getError());
          }
          const savedFlow = savedFlowOrError.getValue();

          // Select created flow
          selectFlowId(savedFlow.id.toString());

          // Navigate to created flow
          navigate({
            to: "/assets/flows/$flowId",
            params: { flowId: savedFlow.id.toString() },
          });
        } else {
          // Select created flow
          selectFlowId(flow.id.toString());

          // Navigate to created flow with default name
          navigate({
            to: "/assets/flows/$flowId",
            params: { flowId: flow.id.toString() },
          });
        }

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
    [navigate, selectFlowId],
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
    async (
      file: File,
      overrides?: Map<
        string,
        { apiSource: string; modelId: string; modelName: string }
      >,
    ) => {
      try {
        setIsImporting(true);

        // Check if service is initialized
        if (
          !FlowService.importFlowWithNodes ||
          typeof FlowService.importFlowWithNodes.execute !== "function"
        ) {
          console.error("FlowService.importFlowWithNodes not initialized");
          toast.error("Import service not initialized yet. Please try again.");
          return;
        }

        // Use passed overrides or fall back to state
        const modelOverrides = overrides || agentModelOverrides;

        // Import flow from file using enhanced import
        const importedFlowOrError =
          await FlowService.importFlowWithNodes.execute({
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

        // Wait a bit for queries to settle, then navigate to the flow
        setTimeout(() => {
          selectFlowId(importedFlow.id.toString());

          navigate({
            to: "/assets/flows/$flowId",
            params: { flowId: importedFlow.id.toString() },
          });
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
    [navigate, selectFlowId],
  );

  return (
    <div
      className={cn(
        onboardingHighlight && "border-border-selected-primary border-1",
      )}
    >
      <SectionHeader
        name="Flow & Agents"
        icon={<SvgIcon name="agents" size={20} />}
        expanded={expanded}
        onToggle={() => setExpanded((prev) => !prev)}
        onClick={() => {
          setExpanded(true);
          delay(() => {
            onClick?.();
          }, 50);
        }}
        onHelpClick={onHelpClick}
        onboardingHelpGlow={onboardingHelpGlow}
      />
      <div className={cn(!expanded && "hidden")}>
        <div className="flex flex-row items-center gap-2 py-2 pr-4 pl-8">
          <SearchInput
            className="grow"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
            }}
          />
        </div>
        <div className="flex flex-row items-center gap-2 py-2 pr-4 pl-8">
          <CreateButton onClick={handleClickCreate} />
          {/* <FlowDialog
            open={isOpenCreate}
            mode="create"
            onCreate={handleDialogCreate}
            onClose={handleDialogClose}
          /> */}
          <ImportButton
            onClick={() => {
              // Check if services are initialized before opening import dialog
              if (
                !FlowService.importFlowWithNodes ||
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
          flows.map((flow: Flow) => (
            <FlowItem
              key={flow.id.toString()}
              flowId={flow.id}
              selected={flow.id.toString() === currentFlowId}
            />
          ))
        ) : (
          <div className="grid place-items-center border-b-1 border-b-[#313131] py-4 pr-4 pl-8">
            <div className="text-[12px] leading-[15px] font-[400] text-[#9D9D9D]">
              No Flows
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { FlowSection };
