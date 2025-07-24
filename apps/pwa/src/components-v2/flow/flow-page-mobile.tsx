"use client";

import { ChevronLeft, BrainCircuit, Import, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { UniqueEntityID } from "@/shared/domain";
import { logger } from "@/shared/utils";

import { useFlowValidation } from "@/app/hooks/use-flow-validation";
import { useFlows } from "@/app/hooks/use-flows";
import { AgentService } from "@/app/services/agent-service";
import { FlowService } from "@/app/services/flow-service";
import { SessionService } from "@/app/services/session-service";
import { useAgentStore } from "@/app/stores/agent-store";
import { useValidationStore } from "@/app/stores/validation-store";
import { queryClient } from "@/app/queries/query-client";
import { flowQueries } from "@/app/queries/flow-queries";
import { useQuery } from "@tanstack/react-query";
import { useMobileNavigation } from "@/App";
import { DeleteConfirm } from "@/components-v2/confirm";
import { FlowDialog } from "@/components-v2/flow/flow-dialog";
import { cn } from "@/components-v2/lib/utils";
import { SearchInput } from "@/components-v2/search-input";
import { humanizeBytes } from "@/components-v2/session/session-list";
import { SvgIcon } from "@/components-v2/svg-icon";
import { ModelItem } from "@/components-v2/title/create-title/step-prompts";
import { TypoBase } from "@/components-v2/typo";
import { Button } from "@/components-v2/ui/button";
import { CheckboxMobile } from "@/components-v2/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components-v2/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components-v2/ui/scroll-area";
import { TableName } from "@/db/schema/table-name";
import { Agent } from "@/modules/agent/domain";
import { ApiSource } from "@/modules/api/domain";
import { Flow } from "@/modules/flow/domain";
import { Session } from "@/modules/session/domain/session";
import * as amplitude from "@amplitude/analytics-browser";
import { ListEditDialog } from "@/components-v2/list-edit-dialog";
import { TopNavigation } from "@/components-v2/top-navigation";

type SelectionAction = "copy" | "export" | "delete";

// Mobile Flow List Item Component
const FlowListItemMobile = ({
  flow,
  isActive,
  isSelectionMode,
  isSelected,
  onToggleSelection,
  onSelect,
}: {
  flow: Flow;
  isActive?: boolean;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
  onSelect: (flow: Flow) => void;
}) => {
  const { isValid: isFlowValid, isFetched: isFlowFetched } = useFlowValidation(
    flow.id,
  );
  const isInvalid = isFlowFetched && !isFlowValid;

  const handleClick = () => {
    if (isSelectionMode) {
      onToggleSelection?.();
    } else {
      // Show dialog about mobile editing not being supported
      onSelect(flow);
    }
  };

  const name = flow?.props?.name || "Unnamed Flow";
  const agentCount = flow.props.nodes?.filter(node => node.type === 'agent').length || 0;

  return (
    <div
      onClick={handleClick}
      className={cn(
        "w-full py-[16px] bg-background-surface-2 text-left transition-colors flex items-center cursor-pointer",
        "hover:bg-background-card-hover active:bg-background-card-hover",
        isActive && !isSelectionMode && "bg-background-card-hover",
        isSelected && "bg-background-card",
        isInvalid && "border-l-4 border-status-destructive-light",
      )}
    >
      {/* Checkbox for selection mode */}
      <div className="flex flex-col items-start h-full pl-[16px]">
        {isSelectionMode && (
            <CheckboxMobile
              checked={isSelected}
              onCheckedChange={() => onToggleSelection?.()}
              onClick={(e) => e.stopPropagation()}
            />
        )}
      </div>

      <div className="flex-1 px-[8px] min-w-0 pr-[24px]">
        <div className="w-full flex items-center justify-between gap-2">
          <div className="text-text-primary text-base font-semibold leading-relaxed truncate min-w-0">
            {name}
          </div>
          <div className="text-text-body text-xs font-medium whitespace-nowrap flex-shrink-0">
            {agentCount} Agent{agentCount !== 1 ? "s" : ""}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function FlowPageMobile({
  className,
}: {
  className?: string;
}) {
  const { setIsOpen } = useMobileNavigation();
  const [keyword, setKeyword] = useState<string>("");
  const selectedFlowId = useAgentStore.use.selectedFlowId();
  const selectFlowId = useAgentStore.use.selectFlowId();

  // Selection mode state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedFlows, setSelectedFlows] = useState<Set<string>>(new Set());
  const [selectionAction, setSelectionAction] =
    useState<SelectionAction>("copy");

  // Import flow state
  const [isOpenImportFlowPopup, setIsOpenImportFlowPopup] = useState(false);
  const refImportFileInput = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importingFile, setImportingFile] = useState<File | null>(null);
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
    agentName?: string;
    modelName: string;
  };

  // Drag to dismiss state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Create flow dialog state
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isDialogLoading, setDialogLoading] = useState(false);

  // Delete confirmation state
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [usedSessions, setUsedSessions] = useState<Session[]>([]);

  // Mobile flow edit not supported dialog
  const [isMobileEditDialogOpen, setIsMobileEditDialogOpen] = useState(false);

  const { data: flows, invalidate } = useFlows({ keyword });
  const { setInvalid } = useValidationStore();
  
  // Get selected flow data
  const { data: selectedFlow } = useQuery({
    ...flowQueries.detail(selectedFlowId ? new UniqueEntityID(selectedFlowId) : undefined),
    enabled: !!selectedFlowId,
  });

  const filteredFlows = flows?.filter((flow: any) =>
    flow?.props?.name?.toLowerCase().includes(keyword.toLowerCase()),
  );


  // Selection mode functions
  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedFlows(new Set());
  }, []);

  const toggleFlowSelection = useCallback((flowId: string) => {
    setSelectedFlows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(flowId)) {
        newSet.delete(flowId);
      } else {
        newSet.add(flowId);
      }
      return newSet;
    });
  }, []);

  // Check for sessions using selected flows
  const checkUsedSessions = async () => {
    const allUsedSessions: Session[] = [];

    for (const flowId of selectedFlows) {
      const sessionsOrError = await SessionService.listSessionByFlow.execute({
        flowId: new UniqueEntityID(flowId),
      });
      if (sessionsOrError.isSuccess) {
        allUsedSessions.push(...sessionsOrError.getValue());
      }
    }

    // Remove duplicates
    const uniqueSessions = allUsedSessions.filter(
      (session, index, self) =>
        index === self.findIndex((s) => s.id.equals(session.id)),
    );

    setUsedSessions(uniqueSessions);
  };

  const handleSelectionAction = async () => {
    if (selectedFlows.size === 0) return;

    // For delete action, check used sessions and show confirmation dialog first
    if (selectionAction === "delete") {
      await checkUsedSessions();
      setIsDeleteConfirmOpen(true);
      return;
    }

    await executeSelectionAction();
  };

  const executeSelectionAction = async () => {
    if (selectedFlows.size === 0) return;

    let successCount = 0;
    const totalCount = selectedFlows.size;

    if (selectionAction === "copy") {
      for (const flowId of selectedFlows) {
        const flow = flows?.find((f) => f.id.toString() === flowId);
        if (!flow) continue;

        const resultOrError = await FlowService.cloneFlow.execute(flow.id);
        if (resultOrError.isFailure) {
          toast.error(`Failed to copy flow: ${resultOrError.getError()}`);
          continue;
        }

        const newFlow = resultOrError.getValue();
        const newAgents = new Map();

        try {
          const agentNodes = flow.props.nodes.filter(node => node.type === 'agent');
          for (const node of agentNodes) {
            const resultOrError = await AgentService.cloneAgent.execute(
              new UniqueEntityID(node.id),
            );
            const newAgent = resultOrError.getValue();
            const resultOrErrorAgent =
              await AgentService.saveAgent.execute(newAgent);
            if (resultOrErrorAgent.isFailure) continue;
            newAgents.set(newAgent.id.toString(), newAgent);
          }
        } catch (error) {
          toast.error(
            "Failed to clone agents" +
              (error instanceof Error ? `: ${error.message}` : ""),
          );
          continue;
        }

        // Update flow nodes with new agent IDs
        const updatedNodes = newFlow.props.nodes.map(node => {
          if (node.type === 'agent') {
            const agentId = Array.from(newAgents.keys()).find(id => newAgents.get(id));
            if (agentId) {
              return { ...node, id: agentId };
            }
          }
          return node;
        });

        newFlow.update({ nodes: updatedNodes });
        await FlowService.saveFlow.execute(newFlow);
        successCount++;
      }

      if (successCount > 0) {
        invalidate();
        toast.success(`Copied ${successCount} of ${totalCount} flow(s)`);
      }
    } else if (selectionAction === "delete") {
      for (const flowId of selectedFlows) {
        const flow = flows?.find((f) => f.id.toString() === flowId);
        if (!flow) continue;

        // Delete agents first
        const agentNodes = flow.props.nodes.filter(node => node.type === 'agent');
        for (const node of agentNodes) {
          const resultOrError = await AgentService.deleteAgent.execute(
            new UniqueEntityID(node.id),
          );
          if (resultOrError.isFailure) continue;
        }

        const resultOrError = await FlowService.deleteFlow.execute(flow.id);
        if (resultOrError.isSuccess) {
          successCount++;
          setInvalid("flows", flow.id, false);
        }
      }

      if (successCount > 0) {
        invalidate();
        toast.success(`Deleted ${successCount} of ${totalCount} flow(s)`);

        // Clear selection if current flow was deleted
        if (selectedFlowId && selectedFlows.has(selectedFlowId.toString())) {
          selectFlowId(null);
        }
      }
    } else if (selectionAction === "export") {
      for (const flowId of selectedFlows) {
        const flow = flows?.find((f) => f.id.toString() === flowId);
        if (!flow) continue;

        const exportResult = await FlowService.exportFlowToFile.execute(
          new UniqueEntityID(flowId),
        );
        if (exportResult.isSuccess) {
          const file = exportResult.getValue();
          // Create download link
          const url = URL.createObjectURL(file);
          const a = document.createElement("a");
          a.href = url;
          a.download = file.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          successCount++;
        } else {
          toast.error(`Failed to export flow: ${exportResult.getError()}`);
        }
      }

      if (successCount > 0) {
        toast.success(`Exported ${successCount} of ${totalCount} flow(s)`);
      }
    }

    exitSelectionMode();
  };

  // Import flow handlers
  const handleImportClick = () => {
    refImportFileInput.current?.click();
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportingFile(file);
      setIsOpenImportFlowPopup(true);
      handleModelNameSessionClick(file);
      // Reset the input value to allow importing the same file again
      e.target.value = "";
    }
  };

  const handleModelNameSessionClick = useCallback(async (file: File) => {
    if (!file) {
      return;
    }
    const modelNameOrError =
      await FlowService.getModelsFromFlowFile.execute(file);
    if (modelNameOrError.isFailure) {
      toast.error("Failed to read flow file", {
        description: modelNameOrError.getError(),
      });
      return;
    }

    // The service now returns agent names directly
    const agentModels = modelNameOrError.getValue();
    setAgentModels(agentModels);
  }, []);

  // Reset import dialog states on close
  useEffect(() => {
    if (isOpenImportFlowPopup) {
      return;
    }
    // Reset all import-related state when dialog closes
    setImportingFile(null);
    setAgentModels([]);
    setAgentModelOverrides(new Map());
  }, [isOpenImportFlowPopup]);

  const onImportFlowFromFile = useCallback(
    async (file: File) => {
      setIsImporting(true);
      try {
        const importResult = await FlowService.importFlowFromFile.execute({
          file,
          agentModelOverrides:
            agentModelOverrides.size > 0 ? agentModelOverrides : undefined,
        });
        if (importResult.isFailure) {
          toast.error(`Failed to import flow: ${importResult.getError()}`);
          return;
        }

        const newFlow = importResult.getValue();
        const newAgents = new Map();
        const oldToNewAgentIdMap = new Map<string, string>();

        try {
          const agentNodes = newFlow.props.nodes.filter(node => node.type === 'agent');
          for (const node of agentNodes) {
            const oldAgentId = node.id;
            
            // Create new agent from imported data
            const agentOrError = await AgentService.getAgent.execute(new UniqueEntityID(oldAgentId));
            if (agentOrError.isFailure) {
              toast.error(`Failed to import agent: ${agentOrError.getError()}`);
              continue;
            }
            let agent = agentOrError.getValue();

            // Apply model override if provided
            const modelOverride = agentModelOverrides.get(oldAgentId);
            if (modelOverride) {
              const updatedAgent = agent.update({
                modelId: modelOverride.modelId,
                modelName: modelOverride.modelName,
                apiSource: modelOverride.apiSource as any,
              });

              if (updatedAgent.isSuccess) {
                agent = updatedAgent.getValue();
              }
            }

            const agentSaved = await AgentService.saveAgent.execute(agent);
            if (agentSaved.isFailure) {
              toast.error(
                `Failed to save agent ${agent.props.name}: ${agentSaved.getError()}`,
              );
              continue;
            }

            const savedAgent = agentSaved.getValue();

            // Map old agent ID to new agent ID
            oldToNewAgentIdMap.set(oldAgentId, savedAgent.id.toString());

            // Use the NEW agent ID as the key
            newAgents.set(savedAgent.id.toString(), savedAgent);
          }
        } catch (error) {
          toast.error(
            "Failed to import agents" +
              (error instanceof Error ? `: ${error.message}` : ""),
          );
          return;
        }

        // Update flow nodes with new agent IDs
        const updatedNodes = newFlow.props.nodes.map(node => {
          if (node.type === 'agent') {
            const newAgentId = oldToNewAgentIdMap.get(node.id);
            if (newAgentId) {
              return { ...node, id: newAgentId };
            }
          }
          return node;
        });

        newFlow.update({ nodes: updatedNodes });
        await FlowService.saveFlow.execute(newFlow);

        toast.success("Flow imported successfully!");

        // Refresh flows
        invalidate();

        // Close popup
        setIsOpenImportFlowPopup(false);
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
    [invalidate, agentModelOverrides],
  );

  // Create flow handlers
  const handleClickCreate = () => {
    amplitude.track("create_flow_initiate");
    setDialogOpen(true);
  };

  const handleDialogCreate = async (props: Partial<Flow["props"]>) => {
    setDialogLoading(true);
    try {
      const flowOrError = await FlowService.createFlow.execute();
      if (flowOrError.isFailure) {
        throw new Error(flowOrError.getError());
      }
      const flow = flowOrError.getValue();
      
      // Update flow name if provided
      if (props.name && props.name !== "New Flow") {
        const updatedFlowOrError = flow.update({ name: props.name });
        if (updatedFlowOrError.isSuccess) {
          await FlowService.saveFlow.execute(updatedFlowOrError.getValue());
        }
      }
      
      selectFlowId(flow.id.toString());
      queryClient.invalidateQueries({
        queryKey: [TableName.Flows],
      });
      setDialogOpen(false);
      toast.success("Flow created successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create flow");
    } finally {
      setDialogLoading(false);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  // Touch handlers for swipe to dismiss
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;

      const y = e.touches[0].clientY;
      setCurrentY(y);

      // Only allow dragging down
      const deltaY = Math.max(0, y - dragStartY);

      if (drawerRef.current) {
        drawerRef.current.style.transform = `translateY(${deltaY}px)`;
      }
    },
    [isDragging, dragStartY],
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);
    const deltaY = currentY - dragStartY;

    if (drawerRef.current) {
      drawerRef.current.style.transform = "";
    }

    // If dragged down more than 100px, close the modal
    if (deltaY > 100) {
      setIsOpenImportFlowPopup(false);
    }
  }, [isDragging, currentY, dragStartY]);

  return (
    <div className={cn("flex flex-col h-dvh bg-background-screen", className)}>
      <div className="flex flex-col h-full bg-background-surface-2">
        {/* Mobile Header */}
        <TopNavigation
          title={
            isSelectionMode
              ? `${selectedFlows.size} Flows selected`
              : "Flow & Agents"
          }
          onMenuClick={isSelectionMode ? undefined : () => setIsOpen(true)}
          leftAction={
            isSelectionMode ? (
              <Button
                variant="ghost"
                onClick={exitSelectionMode}
                className="h-[40px]"
              >
                Done
              </Button>
            ) : undefined
          }
          rightAction={
            isSelectionMode ? (
              <Button
                variant="ghost"
                onClick={handleSelectionAction}
                disabled={selectedFlows.size === 0}
                className="h-[40px]"
              >
                {selectionAction === "copy"
                  ? "Copy"
                  : selectionAction === "export"
                    ? "Export"
                    : "Delete"}
              </Button>
            ) : (
              <ListEditDialog
                actions={["copy", "export", "import", "delete"]}
                onAction={(action) => {
                  if (action === "import") {
                    handleImportClick();
                  } else {
                    setSelectionAction(action as SelectionAction);
                    setIsSelectionMode(true);
                  }
                }}
                disabled={{
                  copy: flows?.length === 0,
                  export: flows?.length === 0,
                  delete: flows?.length === 0,
                }}
              />
            )
          }
        />

        {/* Hidden file input for import */}
        <input
          ref={refImportFileInput}
          type="file"
          accept=".json"
          onChange={handleImportFileChange}
          style={{ display: "none" }}
        />

        {/* Search and Create */}
        <div className="px-4 pt-2 pb-4 space-y-4 bg-background-surface-2">
          <SearchInput
            variant="mobile"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onClear={() => setKeyword("")}
            placeholder="Search flows"
            className="w-full"
          />
        </div>

        {/* Flow List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-background-surface-2">
          <div className="pb-4">
            {!filteredFlows || filteredFlows.length === 0 ? (
              <div className="absolute inset-x-0 top-[35%] -translate-y-1/2 flex items-center justify-center h-[400px]">
                <div className="w-80 inline-flex flex-col justify-start items-center gap-8">
                  <div className="flex flex-col justify-start items-center gap-4">
                    <div className="text-center justify-start text-text-body text-xl font-semibold">
                      {keyword
                        ? `No results for '${keyword}'`
                        : "No flows available"}
                    </div>
                    <div className="self-stretch text-center justify-start text-background-surface-5 text-base font-medium leading-relaxed">
                      {keyword ? (
                        <>
                          Try a different name or keyword to
                          <br />
                          find the flow you're looking for.
                        </>
                      ) : (
                        <>
                          Flows help orchestrate your AI agents.
                          <br />
                          Create flows on desktop to get started
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-0">
                {filteredFlows.map((flow, index) => (
                  <div key={flow.id.toString()}>
                    <FlowListItemMobile
                      flow={flow}
                      isActive={false}
                      isSelectionMode={isSelectionMode}
                      isSelected={selectedFlows.has(flow.id.toString())}
                      onToggleSelection={() =>
                        toggleFlowSelection(flow.id.toString())
                      }
                      onSelect={() => setIsMobileEditDialogOpen(true)}
                    />
                    {index < filteredFlows.length - 1 && (
                      <div className="border-b border-border-dark mx-[16px]" />
                    )}
                  </div>
                ))}
                {/* Bottom divider */}
                <div className="border-b border-border-dark mx-[16px]" />
              </div>
            )}
          </div>
          {/* <ScrollBar orientation="vertical" className="w-1.5" /> */}
        </div>
      </div>

      {/* Import Flow Sheet */}
      <>
        {/* Backdrop */}
        {isOpenImportFlowPopup && (
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setIsOpenImportFlowPopup(false)}
          />
        )}

        {/* Bottom Drawer */}
        <div
          ref={drawerRef}
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50",
            "bg-background-surface-2 rounded-t-xl",
            "h-[90vh] flex flex-col",
            "transform transition-transform duration-300 ease-in-out",
            isOpenImportFlowPopup ? "translate-y-0" : "translate-y-full",
          )}
        >
          {/* Handle for dragging */}
          <div
            className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>

          <div className="px-6 pb-4">
            <h1 className="text-xl font-semibold text-left">Import flow</h1>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6">
              {importingFile === null ? (
                <div className="flex-1 flex items-center justify-center min-h-[400px]">
                  <div
                    className="border-dashed border-2 border-border-container bg-background-card hover:bg-background-input rounded-2xl flex flex-col justify-center items-center p-8 cursor-pointer w-full max-w-md"
                    onClick={() => refImportFileInput.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files[0];
                      setImportingFile(file);
                      handleModelNameSessionClick(file);
                    }}
                  >
                    <Import
                      size={48}
                      className="text-text-input-subtitle mb-4"
                    />
                    <TypoBase className="text-text-input-subtitle text-center">
                      Choose a file or drag it here
                    </TypoBase>
                    <TypoBase className="text-xs text-text-input-subtitle text-center mt-2">
                      Importing a flow will create a new flow with all its
                      agents.
                    </TypoBase>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-6 pb-4">
                  <div className="flex items-center gap-2 p-3 bg-background-card rounded text-text-primary border border-border-container">
                    <SvgIcon
                      name="agents"
                      size={20}
                      className="flex-shrink-0"
                    />
                    <div className="w-full min-w-0">
                      <div className="text-base text-text-primary truncate">
                        {importingFile.name} (
                        {humanizeBytes(importingFile.size)})
                      </div>
                    </div>
                  </div>

                  {agentModels.length > 0 && (
                    <div className="flex flex-col gap-4">
                      <ScrollArea className="w-full h-full">
                        <div className="flex flex-col gap-4">
                          {agentModels.map((agent) => (
                            <div
                              key={agent.agentId}
                              className="p-4 bg-background-surface-3 rounded inline-flex flex-col justify-start items-start gap-2"
                            >
                              <div className="self-stretch flex flex-col justify-start items-start gap-4">
                                <div className="self-stretch flex flex-col justify-start items-start gap-2">
                                  <div className="self-stretch justify-start text-text-subtle text-base font-normal leading-relaxed">
                                    Agent : {agent.agentName}
                                  </div>
                                </div>
                                <div className="self-stretch h-11 flex flex-col justify-start items-start gap-2">
                                  <div className="self-stretch flex-1 justify-start text-text-subtle text-base font-normal leading-relaxed">
                                    Flow original model
                                  </div>
                                  <div className="self-stretch flex-1 justify-start text-text-primary text-base font-normal leading-relaxed">
                                    {agent.modelName || "No model"}
                                  </div>
                                </div>
                                <div className="self-stretch flex flex-col justify-start items-start gap-2">
                                  <div className="self-stretch justify-start text-text-subtle text-base font-medium leading-relaxed">
                                    Select model to connect
                                  </div>
                                  <div className="self-stretch">
                                    <ModelItem
                                      connectionChanged={(
                                        apiSource,
                                        modelId,
                                        modelName,
                                      ) => {
                                        const newOverrides = new Map(
                                          agentModelOverrides,
                                        );
                                        if (modelName) {
                                          newOverrides.set(agent.agentId, {
                                            apiSource,
                                            modelId,
                                            modelName,
                                          });
                                        } else {
                                          newOverrides.delete(agent.agentId);
                                        }
                                        setAgentModelOverrides(newOverrides);
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pt-6 pb-6 bg-background-surface-2">
              <div className="flex flex-col items-center gap-6">
                {importingFile && (
                  <Button
                    size="lg"
                    onClick={() => onImportFlowFromFile(importingFile)}
                    disabled={
                      isImporting ||
                      (agentModels.length > 0 &&
                        Array.from(agentModelOverrides.values()).some(
                          (override) => !override.modelName,
                        ))
                    }
                    className="w-full"
                  >
                    {isImporting ? "Importing..." : "Import"}
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={() => setIsOpenImportFlowPopup(false)}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirm
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="Are you sure?"
        description={
          <>
            {usedSessions.length > 0 && (
              <>
                {selectedFlows.size === 1 ? "This flow is" : "These flows are"}{" "}
                used in{" "}
                <span className="text-destructive font-medium">
                  {usedSessions.length} session
                  {usedSessions.length !== 1 ? "s" : ""}
                </span>
                .
                <br />
                Deleting {selectedFlows.size === 1 ? "it" : "them"} might
                corrupt or disable these sessions.
                <br />
                <br />
              </>
            )}
            This action cannot be undone.{" "}
            {selectedFlows.size === 1
              ? "The selected flow"
              : `${selectedFlows.size} selected flows`}{" "}
            will be permanently deleted.
          </>
        }
        deleteLabel="Yes, delete"
        onDelete={async () => {
          await executeSelectionAction();
          setIsDeleteConfirmOpen(false);
        }}
      />

      {/* Create Flow Dialog */}
      <FlowDialog
        open={isDialogOpen}
        mode="create"
        onCreate={handleDialogCreate}
        onClose={handleDialogClose}
      />

      {/* Mobile Edit Not Supported Dialog */}
      <Dialog
        open={isMobileEditDialogOpen}
        onOpenChange={setIsMobileEditDialogOpen}
      >
        <DialogContent hideClose className="max-w-[90vw]">
          <DialogHeader>
            <DialogTitle className="text-left">Desktop Required</DialogTitle>
            <DialogDescription className="text-left">
              Flow and agent editing is currently only available on desktop.
              Please use a desktop or laptop computer to create and edit flows.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              size="lg"
              className="w-full"
              onClick={() => setIsMobileEditDialogOpen(false)}
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
