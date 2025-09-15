// TODO: apply color palette

import { useSessionValidation } from "@/app/hooks/use-session-validation";
import { cardQueries } from "@/app/queries/card-queries";
import { flowQueries } from "@/app/queries/flow-queries";
import { queryClient } from "@/app/queries/query-client";
import { sessionQueries } from "@/app/queries/session-queries";
import { AgentService } from "@/app/services/agent-service";
import { FlowService } from "@/app/services/flow-service";
import { SessionService } from "@/app/services/session-service";
import { Page, useAppStore } from "@/app/stores/app-store";
import { useSessionStore } from "@/app/stores/session-store";
import { SectionHeader } from "@/components-v2/left-navigation/left-navigation";
import { SearchInput, CreateButton, ImportButton } from "@/components-v2/left-navigation/shared-list-components";
import { StepName } from "@/components-v2/session/create-session/step-name";
import { SvgIcon } from "@/components-v2/svg-icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components-v2/ui/tooltip";
import { Button } from "@/components-v2/ui/button";
import { Checkbox } from "@/components-v2/ui/checkbox";
import { DeleteConfirm } from "@/components-v2/confirm";
import { SessionImportDialog, type AgentModel } from "@/components-v2/session/components/session-import-dialog";
import { SessionExportDialog, type AgentModelTierInfo } from "@/components-v2/session/components/session-export-dialog";
import { ModelTier } from "@/modules/agent/domain/agent";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components-v2/ui/dialog";
import { Label } from "@/components-v2/ui/label";
import { ScrollArea } from "@/components-v2/ui/scroll-area";
import { Agent } from "@/modules/agent/domain/agent";
import { Session } from "@/modules/session/domain/session";
import { ApiSource } from "@/modules/api/domain";
import { UniqueEntityID } from "@/shared/domain";
import { cn, downloadFile, logger } from "@/shared/utils";
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
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { fetchBackgrounds } from "@/app/stores/background-store";

const SessionItem = ({
  sessionId,
  selected,
}: {
  sessionId: UniqueEntityID;
  selected?: boolean;
}) => {
  // Fetch session data
  const { data: session } = useQuery(sessionQueries.detail(sessionId));

  // Validate session
  const { isValid, isFetched } = useSessionValidation(sessionId);
  const isInvalid = isFetched && !isValid;

  // Handle select
  const setActivePage = useAppStore.use.setActivePage();
  const selectSession = useSessionStore.use.selectSession();
  const handleSelect = useCallback(() => {
    selectSession(sessionId, session?.title ?? "");
    setActivePage(Page.Sessions);
  }, [selectSession, session?.title, sessionId, setActivePage]);

  // Handle export
  const [isOpenExport, setIsOpenExport] = useState(false);
  const [exportAgents, setExportAgents] = useState<AgentModelTierInfo[]>([]);

  // Prepare export dialog
  const handleExportClick = useCallback(async () => {
    try {
      if (!session || !session.flowId) {
        toast.error("No flow associated with this session");
        return;
      }

      // Get flow to find agents
      const flowQuery = await queryClient.fetchQuery({
        queryKey: ["flow", session.flowId.toString()],
        queryFn: async () => {
          const result = await FlowService.getFlow.execute(session.flowId!);
          if (result.isFailure) throw new Error(result.getError());
          return result.getValue();
        },
      });

      if (!flowQuery) {
        toast.error("Failed to load flow");
        return;
      }

      // Get agents for this flow
      const agents: AgentModelTierInfo[] = [];
      for (const node of flowQuery.props.nodes) {
        if (node.type === "agent") {
          const agentId = node.id;
          const agentQuery = await queryClient.fetchQuery({
            queryKey: ["agent", agentId],
            queryFn: async () => {
              const result = await AgentService.getAgent.execute(new UniqueEntityID(agentId));
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
      setIsOpenExport(true);
    } catch (error) {
      console.error("Failed to prepare export:", error);
      toast.error("Failed to prepare export");
    }
  }, [session]);

  // Handle export with tier selections
  const handleExport = useCallback(async (modelTierSelections: Map<string, ModelTier>, includeHistory: boolean) => {
    try {
      // Export session to file with model tier selections
      const fileOrError = await SessionService.exportSessionToFile.execute({
        sessionId: sessionId,
        includeHistory: includeHistory,
        modelTierSelections: modelTierSelections,
      });
      if (fileOrError.isFailure) {
        throw new Error(fileOrError.getError());
      }
      const file = fileOrError.getValue();

      // Download session file
      downloadFile(file);
      toast.success("Session exported successfully");
      setIsOpenExport(false);
    } catch (error) {
      logger.error(error);
      if (error instanceof Error) {
        toast.error("Failed to export session", {
          description: error.message,
        });
      }
    }
  }, [sessionId]);

  // Handle copy
  const [isOpenCopy, setIsOpenCopy] = useState(false);
  const [isCopyHistory, setIsCopyHistory] = useState(false);
  const handleCopy = useCallback(async () => {
    try {
      // Copy session
      const copiedSessionOrError = await SessionService.cloneSession.execute({
        sessionId: sessionId,
        includeHistory: isCopyHistory,
      });
      if (copiedSessionOrError.isFailure) {
        throw new Error(copiedSessionOrError.getError());
      }
      const copiedSession = copiedSessionOrError.getValue();

      // Select copied session
      selectSession(copiedSession.id, copiedSession.title);

      // Invalidate sessions
      queryClient.invalidateQueries({
        queryKey: sessionQueries.lists(),
      });
    } catch (error) {
      logger.error(error);
      if (error instanceof Error) {
        toast.error("Failed to copy session", {
          description: error.message,
        });
      }
    } finally {
      // Close copy dialog
      setIsOpenCopy(false);
      setIsCopyHistory(false);
    }
  }, [isCopyHistory, selectSession, sessionId]);

  // Handle delete
  const [isOpenDelete, setIsOpenDelete] = useState(false);
  const selectedSessionId = useSessionStore.use.selectedSessionId();
  const handleDelete = useCallback(async () => {
    try {
      // Delete session
      const deleteSessionOrError =
        await SessionService.deleteSession.execute(sessionId);
      if (deleteSessionOrError.isFailure) {
        throw new Error(deleteSessionOrError.getError());
      }

      // Unselect deleted session
      if (selectedSessionId?.equals(sessionId)) {
        selectSession(null, "");
        setActivePage(Page.Init);
      }

      // Invalidate sessions
      queryClient.invalidateQueries({
        queryKey: sessionQueries.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: sessionQueries.detail(sessionId).queryKey,
      });
    } catch (error) {
      logger.error(error);
      if (error instanceof Error) {
        toast.error("Failed to delete session", {
          description: error.message,
        });
      }
    } finally {
      // Close delete dialog
      setIsOpenDelete(false);
    }
  }, [selectSession, selectedSessionId, sessionId, setActivePage]);

  return (
    <>
      {/* Session Item */}
      <div
        className={cn(
          "pl-8 pr-4 py-2 group/item h-12 border-b-1 border-b-[#313131]",
          "bg-[#272727] hover:bg-[#313131] pointer-coarse:focus-within:bg-[#313131]",
          "flex flex-row gap-1 items-center",
          selected && "bg-background-surface-4 rounded-[8px]",
        )}
        tabIndex={0}
        onClick={handleSelect}
      >
        {/* Session Info */}
        {isInvalid && (
          <div className="shrink-0 text-[#DC2626]">
            <CircleAlert size={16} />
          </div>
        )}
        <div className="grow line-clamp-1 break-all font-[500] text-[12px] leading-[15px] text-[#F1F1F1]">
          {session?.title}
        </div>
        <div className="group-hover/item:hidden pointer-coarse:group-focus-within/item:hidden shrink-0 font-[500] text-[10px] leading-[16px] text-[#9D9D9D]">
          {session?.turnIds.length} Messages
        </div>

        {/* Actions */}
        <div className="hidden group-hover/item:flex pointer-coarse:group-focus-within/item:flex shrink-0 text-[#9D9D9D] flex-row gap-2">
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
                  setIsOpenCopy(true);
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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
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
      </div>

      {/* Place dialog outside of session item to prevent selecting session */}
      <SessionExportDialog
        open={isOpenExport}
        onOpenChange={setIsOpenExport}
        agents={exportAgents}
        onExport={handleExport}
      />
      <Dialog open={isOpenCopy} onOpenChange={setIsOpenCopy}>
        <DialogContent hideClose>
          <DialogHeader>
            <DialogTitle>Copy session</DialogTitle>
            <DialogDescription>
              Do you want to include chat history?
            </DialogDescription>
          </DialogHeader>
          <Label className="flex flex-row gap-[8px] items-center">
            <Checkbox
              defaultChecked={false}
              checked={isCopyHistory}
              onCheckedChange={(checked) => {
                setIsCopyHistory(checked === true);
              }}
            />
            <span className="font-[400] text-[16px] leading-[19px]">
              Include chat messages in the duplicated session
            </span>
          </Label>
          <DialogFooter>
            <DialogClose asChild>
              <Button size="lg" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button size="lg" onClick={handleCopy}>
              Copy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DeleteConfirm
        open={isOpenDelete}
        onOpenChange={setIsOpenDelete}
        description="This action cannot be undone. This will permanently delete the session and all its messages."
        onDelete={handleDelete}
      />
    </>
  );
};

const SessionSection = ({ 
  onClick, 
  onboardingHighlight,
  onHelpClick,
  onboardingHelpGlow
}: { 
  onClick?: () => void; 
  onboardingHighlight?: boolean; 
  onHelpClick?: () => void;
  onboardingHelpGlow?: boolean;
}) => {
  // Handle expand
  const [expanded, setExpanded] = useState(true);

  // Fetch sessions
  const [keyword, setKeyword] = useState("");
  const { data: sessions } = useQuery(
    sessionQueries.list({
      keyword,
    }),
  );

  // Selected session
  const activePage = useAppStore.use.activePage();
  const selectedSessionId = useSessionStore.use.selectedSessionId();
  
  // Handle create
  const setCreateSessionName = useSessionStore.use.setCreateSessionName();
  const setActivePage = useAppStore.use.setActivePage();

  // Handle import
  const selectSession = useSessionStore.use.selectSession();
  const [isOpenImportDialog, setIsOpenImportDialog] = useState(false);
  const handleImport = useCallback(async (file: File, includeHistory: boolean, agentModelOverrides?: Map<string, { apiSource: string; modelId: string; modelName: string }>) => {
    try {
      // Import session from file
      const importedSessionOrError =
        await SessionService.importSessionFromFile.execute({
          file: file,
          includeHistory: includeHistory,
          agentModelOverrides:
            agentModelOverrides && agentModelOverrides.size > 0 ? agentModelOverrides : undefined,
        });
      if (importedSessionOrError.isFailure) {
        throw new Error(importedSessionOrError.getError());
      }
      const importedSession = importedSessionOrError.getValue();

      // Invalidate quries
      queryClient.invalidateQueries({
        queryKey: sessionQueries.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: flowQueries.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: cardQueries.lists(),
      });

      // Refetch backgrounds
      fetchBackgrounds();

      // Select imported session
      selectSession(importedSession.id, importedSession.title);
    } catch (error) {
      if (error instanceof Error) {
        toast.error("Failed to import session", {
          description: error.message,
        });
      }
      logger.error("Failed to import session", error);
    }
  }, [selectSession]);

  const handleFileSelect = useCallback(async (file: File): Promise<AgentModel[] | void> => {
    if (!file) {
      return;
    }
    try {
      const modelNameOrError =
        await SessionService.getModelsFromSessionFile.execute(file);
      if (modelNameOrError.isFailure) {
        toast.error("Failed to import session", {
          description: modelNameOrError.getError(),
        });
        return;
      }
      const agentIdToModelNames = modelNameOrError.getValue();

      // TODO: Get agent names from the session file flows
      // For now, use agent ID as fallback name
      const enhancedModels = agentIdToModelNames.map((item) => ({
        agentId: item.agentId,
        agentName: item.agentName || `Agent ${item.agentId.slice(0, 8)}`,
        modelName: item.modelName,
        modelTier: item.modelTier,
      }));

      return enhancedModels;
    } catch (error) {
      console.error("Error reading session file:", error);
      toast.error("Failed to read session file");
    }
  }, []);


  return (
    <div className={cn(
      onboardingHighlight && "border-1 border-border-selected-primary"
    )}>
      <SectionHeader
        name="Sessions"
        icon={<SvgIcon name="sessions" size={20} />}
        top={0}
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
          <StepName
            defaultValue="New Session"
            onNext={async (name) => {
              setCreateSessionName(name);
              setActivePage(Page.CreateSession);
            }}
            trigger={<CreateButton onClick={() => null} />}
          />
          <ImportButton onClick={() => setIsOpenImportDialog(true)} />
          <SessionImportDialog
            open={isOpenImportDialog}
            onOpenChange={setIsOpenImportDialog}
            onImport={handleImport}
            onFileSelect={handleFileSelect}
          />
        </div>
        {sessions && sessions.length > 0 ? (
          sessions.map((session: Session) => (
            <SessionItem
              key={session.id.toString()}
              sessionId={session.id}
              selected={
                activePage === Page.Sessions &&
                session.id.equals(selectedSessionId)
              }
            />
          ))
        ) : (
          <div className="pl-8 pr-4 py-2 border-b-1 border-b-[#313131] grid place-items-center">
            <div className="font-[400] text-[12px] leading-[15px] text-[#9D9D9D]">
              No Sessions
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { SessionSection };
