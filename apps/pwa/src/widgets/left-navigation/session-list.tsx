// TODO: apply color palette
import { useNavigate, useLocation } from "@tanstack/react-router";
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
import { SectionHeader } from "./index";
import {
  SearchInput,
  CreateButton,
  ImportButton,
} from "./shared-list-components";
import { StepName } from "@/features/session/create-session/step-name";
import {
  Button, Checkbox, DeleteConfirm, Label,
  SvgIcon,
} from "@/shared/ui";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui";
import {
  SessionImportDialog,
  type AgentModel,
} from "@/features/session/components/session-import-dialog";
import {
  SessionExportDialog,
  type AgentModelTierInfo,
} from "@/features/session/components/session-export-dialog";
import { ModelTier } from "@/entities/agent/domain/agent";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui";
import { Session } from "@/entities/session/domain/session";
import { UniqueEntityID } from "@/shared/domain";
import { cn } from "@/shared/lib";
import { downloadFile, logger } from "@/shared/lib";
import { useQuery } from "@tanstack/react-query";
import { delay } from "lodash-es";
import { CircleAlert, Copy, Trash2, Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { fetchBackgrounds } from "@/app/stores/background-store";
import { getUniqueEntityIDFromPath } from "@/shared/lib/url-utils";

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
  const navigate = useNavigate();
  const selectSession = useSessionStore.use.selectSession();
  const handleSelect = useCallback(() => {
    selectSession(sessionId, session?.title ?? "");

    // Navigate to session
    navigate({
      to: "/sessions/$sessionId",
      params: { sessionId: sessionId.toString() },
    });
  }, [navigate, sessionId, selectSession, session]);

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
      setIsOpenExport(true);
    } catch (error) {
      console.error("Failed to prepare export:", error);
      toast.error("Failed to prepare export");
    }
  }, [session]);

  // Handle export with tier selections
  const handleExport = useCallback(
    async (
      modelTierSelections: Map<string, ModelTier>,
      includeHistory: boolean,
    ) => {
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
    },
    [sessionId],
  );

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

      selectSession(copiedSession.id, copiedSession.title);

      // Navigate to copied session
      navigate({
        to: "/sessions/$sessionId",
        params: { sessionId: copiedSession.id.toString() },
      });

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
  }, [isCopyHistory, navigate, sessionId, selectSession]);

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

      // Navigate away from deleted session if currently viewing it
      if (selectedSessionId?.equals(sessionId)) {
        selectSession(null, "");
        navigate({ to: "/" });
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
  }, [navigate, sessionId, selectSession, selectedSessionId]);

  return (
    <>
      {/* Session Item */}
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
        {/* Session Info */}
        {isInvalid && (
          <div className="shrink-0 text-[#DC2626]">
            <CircleAlert size={16} />
          </div>
        )}
        <div className="line-clamp-1 grow text-[12px] leading-[15px] font-[500] break-all text-[#F1F1F1]">
          {session?.title}
        </div>
        <div className="shrink-0 text-[10px] leading-[16px] font-[500] text-[#9D9D9D] group-hover/item:hidden pointer-coarse:group-focus-within/item:hidden">
          {session?.turnIds.length} Messages
        </div>

        {/* Actions */}
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
          <Label className="flex flex-row items-center gap-[8px]">
            <Checkbox
              checked={isCopyHistory}
              onCheckedChange={(checked) => {
                setIsCopyHistory(checked === true);
              }}
            />
            <span className="text-[16px] leading-[19px] font-[400]">
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
  onboardingHelpGlow,
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

  const location = useLocation();
  const currentSessionId = getUniqueEntityIDFromPath(
    location.pathname,
    "sessions",
  );
  const navigate = useNavigate();

  // Handle create
  const setCreateSessionName = useSessionStore.use.setCreateSessionName();
  const setActivePage = useAppStore.use.setActivePage();

  // Handle import
  const selectSession = useSessionStore.use.selectSession();
  const [isOpenImportDialog, setIsOpenImportDialog] = useState(false);

  const handleImport = useCallback(
    async (
      file: File,
      includeHistory: boolean,
      agentModelOverrides?: Map<
        string,
        { apiSource: string; modelId: string; modelName: string }
      >,
    ) => {
      try {
        // Import session from file
        const importedSessionOrError =
          await SessionService.importSessionFromFile.execute({
            file: file,
            includeHistory: includeHistory,
            agentModelOverrides:
              agentModelOverrides && agentModelOverrides.size > 0
                ? agentModelOverrides
                : undefined,
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

        // Navigate to imported session
        selectSession(importedSession.id, importedSession.title);

        navigate({
          to: "/sessions/$sessionId",
          params: { sessionId: importedSession.id.toString() },
        });
      } catch (error) {
        if (error instanceof Error) {
          toast.error("Failed to import session", {
            description: error.message,
          });
        }
        logger.error("Failed to import session", error);
      }
    },
    [navigate, selectSession],
  );

  const handleFileSelect = useCallback(
    async (file: File): Promise<AgentModel[] | void> => {
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
    },
    [],
  );

  return (
    <div
      className={cn(
        onboardingHighlight && "border-border-selected-primary border-1",
      )}
    >
      <SectionHeader
        name="Sessions"
        icon={<SvgIcon name="sessions" size={20} />}
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
              selected={session.id.toString() === currentSessionId}
            />
          ))
        ) : (
          <div className="grid place-items-center border-b-1 border-b-[#313131] py-2 pr-4 pl-8">
            <div className="text-[12px] leading-[15px] font-[400] text-[#9D9D9D]">
              No Sessions
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { SessionSection };
