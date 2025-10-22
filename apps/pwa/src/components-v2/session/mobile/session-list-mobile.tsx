"use client";

import { ChevronLeft, Import, Menu, Plus } from "lucide-react";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import { UniqueEntityID } from "@/shared/domain";
import { downloadFile } from "@/shared/utils";
import { Datetime } from "@/shared/utils/datetime";
import { logger } from "@/shared/utils/logger";

import { useAsset } from "@/app/hooks/use-asset";
import { useCard } from "@/app/hooks/use-card";
import { useSession } from "@/app/hooks/use-session";
import { useSessionValidation } from "@/app/hooks/use-session-validation";
import { useSessions } from "@/app/hooks/use-sessions-v2";
import { useTurn } from "@/app/hooks/use-turn";
import { FlowService } from "@/app/services/flow-service";
import { SessionService } from "@/app/services/session-service";
import { Page, useAppStore } from "@/app/stores/app-store";
import { fetchBackgrounds } from "@/app/stores/background-store";
import { useSessionStore } from "@/app/stores/session-store";
import { useValidationStore } from "@/app/stores/validation-store";
import { queryClient } from "@/app/queries/query-client";
import { cn } from "@/components-v2/lib/utils";
import { SearchInput } from "@/components/ui/search-input";
import { SessionMainMobile } from "@/components-v2/session/mobile/session-main-mobile";
import CreateSessionPageMobile from "@/components-v2/session/mobile/create-session-page-mobile";
import { SvgIcon } from "@/components/ui/svg-icon";
import { ModelItem } from "@/components-v2/title/create-title/step-prompts";
import { TypoBase } from "@/components/ui/typo";
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
  DialogTrigger,
} from "@/components-v2/ui/dialog";
import { Label } from "@/components-v2/ui/label";
import { ScrollArea } from "@/components-v2/ui/scroll-area";
import { TableName } from "@/db/schema/table-name";
import { Agent } from "@/modules/agent/domain/agent";
import { Card } from "@/modules/card/domain";
import { Session } from "@/modules/session/domain/session";
import { AgentService } from "@/app/services/agent-service";
import { ApiSource } from "@/modules/api/domain";
import { toast } from "sonner";
import { ListEditDialogMobile } from "@/components/dialogs/list-edit-dialog-mobile";
import { TopNavigation } from "@/components/layout/top-navigation";
import { StepName } from "@/components-v2/session/create-session/step-name";
import { flowQueries } from "@/app/queries/flow-queries";
import { sessionQueries } from "@/app/queries/session-queries";
import { cardQueries } from "@/app/queries/card-queries";

export function humanizeBytes(bytes: number): string {
  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) {
    return "0 Bytes";
  }
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
  return Math.round(bytes / Math.pow(1024, i)) + units[i];
}

// Character Avatar Component
const MobileCharacterAvatar = ({ cardId }: { cardId: UniqueEntityID }) => {
  const [card] = useCard(cardId);
  const [asset] = useAsset((card as any)?.props?.iconAssetId);

  if (!card) return null;

  return (
    <div className="border-background-surface-2 bg-background-input relative h-8 w-8 overflow-hidden rounded-full border-2">
      {asset ? (
        <img
          src={asset}
          alt={
            ((card as any)?.props?.name || (card as any)?.props?.title) ??
            "Character"
          }
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="bg-background-input flex h-full w-full items-center justify-center">
          <SvgIcon name="character_icon" size={32} />
        </div>
      )}
    </div>
  );
};

// Session Item Component
const SessionItemMobile = ({
  sessionId,
  isActive,
  isSelectionMode,
  isSelected,
  onSelect,
  onToggleSelection,
}: {
  sessionId: UniqueEntityID;
  isActive?: boolean;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (sessionId: string) => void;
  onToggleSelection?: () => void;
}) => {
  const [session] = useSession(sessionId);
  const [lastMessage] = useTurn(
    session && session.turnIds.length > 0
      ? session.turnIds[session.turnIds.length - 1]
      : undefined,
  );

  // Session validation
  const { isValid: isSessionValid, isFetched: isSessionValidationFetched } =
    useSessionValidation(sessionId);
  const isInvalid = isSessionValidationFetched && !isSessionValid;

  if (!session) {
    return null;
  }

  const messageCount = session.props.turnIds.length;

  const handleClick = () => {
    if (isSelectionMode) {
      onToggleSelection?.();
    } else {
      onSelect?.(sessionId.toString());
    }
  };

  const formatLastMessage = (lastMessageAt: Date) => {
    const date = Datetime(lastMessageAt);
    if (date.isToday()) {
      return date.format("HH:mm A");
    } else {
      return date.format("MMM D");
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "bg-background-surface-2 flex w-full items-center",
        "hover:bg-background-card-hover active:bg-background-card-hover",
        isActive && !isSelectionMode && "bg-background-card-hover",
        isSelected && "bg-background-card",
        isInvalid && "border-status-destrctive-light border-l-[3px]",
      )}
      // disabled={!!streamingMessageId && !selectedSessionId?.equals(sessionId)}
    >
      {/* Checkbox for selection mode */}
      <div className="flex h-full flex-col items-start py-[16px] pl-[16px]">
        {isSelectionMode && (
          <div className="p-[8px]">
            <CheckboxMobile
              checked={isSelected}
              onCheckedChange={() => onToggleSelection?.()}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-start justify-start gap-2 p-4 pr-[24px]">
        {/* Title and Time */}
        <div className="flex w-full items-center justify-between gap-2">
          <div className="text-text-primary min-w-0 truncate text-base leading-relaxed font-semibold">
            {session.props.title}
          </div>
          <div className="text-text-body flex-shrink-0 text-xs font-medium whitespace-nowrap">
            {lastMessage ? formatLastMessage(lastMessage.createdAt) : "0:00 AM"}
          </div>
        </div>

        {/* Message Count and Avatars */}
        <div className="inline-flex items-start justify-between self-stretch">
          <div className="flex items-center justify-start gap-3">
            <div className="inline-flex flex-col items-start justify-start gap-1">
              <div className="inline-flex items-center justify-start gap-1">
                <div className="text-text-primary justify-start text-base leading-relaxed font-normal">
                  {messageCount.toLocaleString()}
                </div>
                <div className="text-text-body justify-start text-xs font-normal">
                  Messages
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end">
            {session.characterCards
              .slice(0, 3)
              .map((card: Card, index: number) => (
                <div
                  key={card.id.toString()}
                  style={{ zIndex: session.characterCards.length - index }}
                >
                  <MobileCharacterAvatar cardId={card.id} />
                </div>
              ))}
            {session.characterCards.length > 3 && (
              <div
                className="bg-background-surface-3 outline-background-surface-2 inline-flex h-8 w-8 flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-2 outline-2 outline-offset-[-2.17px]"
                style={{ zIndex: 0 }}
              >
                <div className="text-text-placeholder justify-start text-[10px] leading-none font-medium">
                  +{session.characterCards.length - 4}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

// Main Component
const SessionListMobile = ({
  refSessionListCreate,
  onMenuClick,
}: {
  refSessionListCreate: RefObject<HTMLDivElement>;
  onMenuClick?: () => void;
}) => {
  const {
    keyword,
    setKeyword,
    selectedSessionId,
    selectSession,
    setCreateSessionName,
  } = useSessionStore();
  const { data: sessions } = useSessions({
    keyword,
  });

  // Search focus state
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Session detail state
  const [isSessionOpen, setIsSessionOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Mobile stepper state
  const [isOpenCreateSessionMobile, setIsOpenCreateSessionMobile] =
    useState(false);

  // Selection mode state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectionAction, setSelectionAction] = useState<
    "copy" | "export" | "delete"
  >("delete");
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(
    new Set(),
  );

  // Include history dialog state
  const [showIncludeHistoryDialog, setShowIncludeHistoryDialog] =
    useState(false);
  const [includeHistoryForBulk, setIncludeHistoryForBulk] = useState(false);

  // Drag to dismiss state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Import session state
  const [isOpenImportDialog, setIsOpenImportDialog] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importingFile, setImportingFile] = useState<File | null>(null);
  const [isIncludeHistory, setIsIncludeHistory] = useState(false);
  const refImportSessionFileInput = useRef<HTMLInputElement>(null);
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

  // Check invalid sessions
  const setSessionIds = useValidationStore((state) => state.setSessionIds);
  const { data: allSessions } = useSessions({});
  useEffect(() => {
    if (!allSessions) {
      return;
    }
    const ids: { [id: string]: boolean } = {};
    for (const session of allSessions) {
      ids[session.id.toString()] = true;
    }
    setSessionIds(ids);
  }, [allSessions, setSessionIds]);

  // Toggle selection for a session
  const toggleSessionSelection = useCallback((sessionId: string) => {
    setSelectedSessions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  }, []);

  // Exit selection mode
  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedSessions(new Set());
    setSelectionAction("delete");
  }, []);

  // Handle search focus/blur
  const handleSearchFocus = () => {
    setIsSearchFocused(true);
  };

  const handleSearchBlur = () => {
    // Don't blur on search - let the user stay in search mode
    // Only the back button should exit search mode
  };

  const handleClearSearch = () => {
    setKeyword("");
    setIsSearchFocused(false);
  };

  // Auto-focus search input when entering search mode
  useEffect(() => {
    if (isSearchFocused && searchInputRef.current) {
      // Small delay to ensure the component is mounted
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isSearchFocused]);

  // Import session handlers
  const handleImportSession = useCallback(async () => {
    if (!importingFile) {
      return;
    }

    try {
      setIsImporting(true);

      // Import session from file
      const importedSessionOrError =
        await SessionService.importSessionFromFile.execute({
          file: importingFile,
          includeHistory: isIncludeHistory,
          agentModelOverrides:
            agentModelOverrides.size > 0 ? agentModelOverrides : undefined,
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

      // Select imported session
      selectSession(importedSession.id, importedSession.title);

      // Close dialog and reset state
      setIsOpenImportDialog(false);
      // State will be reset by the useEffect that watches isOpenImportDialog
    } catch (error) {
      if (error instanceof Error) {
        toast.error("Failed to import session", {
          description: error.message,
        });
      }
      logger.error("Failed to import session", error);
    } finally {
      setIsImporting(false);
    }
  }, [agentModelOverrides, importingFile, isIncludeHistory, selectSession]);

  const handleModelNameSessionClick = useCallback(async (file: File) => {
    if (!file) {
      return;
    }
    const modelNameOrError =
      await SessionService.getModelsFromSessionFile.execute(file);
    if (modelNameOrError.isFailure) {
      toast.error("Failed to import session", {
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
    if (isOpenImportDialog) {
      return;
    }
    // Reset all import-related state when dialog closes
    setImportingFile(null);
    setIsIncludeHistory(false);
    setAgentModels([]);
    setAgentModelOverrides(new Map());
  }, [isOpenImportDialog]);

  // Execute bulk action with or without history
  const executeBulkAction = useCallback(async () => {
    if (selectionAction === "delete") {
      // Delete selected sessions
      for (const sessionId of selectedSessions) {
        const deleteSessionOrError = await SessionService.deleteSession.execute(
          new UniqueEntityID(sessionId),
        );
        if (deleteSessionOrError.isFailure) {
          toast.error("Failed to delete session", {
            description: deleteSessionOrError.getError(),
          });
        }
      }

      // Invalidate sessions
      await queryClient.invalidateQueries({
        queryKey: [TableName.Sessions],
      });

      toast.success(`Deleted ${selectedSessions.size} session(s)`);
    } else if (selectionAction === "copy") {
      // Copy selected sessions
      let copiedCount = 0;
      for (const sessionId of selectedSessions) {
        const copiedSessionOrError = await SessionService.cloneSession.execute({
          sessionId: new UniqueEntityID(sessionId),
          includeHistory: includeHistoryForBulk,
        });
        if (copiedSessionOrError.isSuccess) {
          copiedCount++;
        } else {
          toast.error("Failed to copy session", {
            description: copiedSessionOrError.getError(),
          });
        }
      }

      // Invalidate sessions
      await queryClient.invalidateQueries({
        queryKey: [TableName.Sessions],
      });

      toast.success(`Copied ${copiedCount} session(s)`);
    } else if (selectionAction === "export") {
      // Export selected sessions
      for (const sessionId of selectedSessions) {
        const exportOrError = await SessionService.exportSessionToFile.execute({
          sessionId: new UniqueEntityID(sessionId),
          includeHistory: includeHistoryForBulk,
        });
        if (exportOrError.isSuccess) {
          const file = exportOrError.getValue();
          downloadFile(file);
        } else {
          toast.error("Failed to export session", {
            description: exportOrError.getError(),
          });
        }
      }

      toast.success(`Exported ${selectedSessions.size} session(s)`);
    }

    exitSelectionMode();
    setShowIncludeHistoryDialog(false);
    setIncludeHistoryForBulk(false);
  }, [
    selectedSessions,
    selectionAction,
    exitSelectionMode,
    includeHistoryForBulk,
  ]);

  // Handle action on selected sessions
  const handleSelectionAction = useCallback(async () => {
    if (selectionAction === "copy" || selectionAction === "export") {
      // Show include history dialog for copy and export
      setShowIncludeHistoryDialog(true);
    } else if (selectionAction === "delete") {
      // Execute delete directly
      await executeBulkAction();
    }
  }, [selectionAction, executeBulkAction]);

  // Handle import file
  const handleImportClick = () => {
    refImportSessionFileInput.current?.click();
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportingFile(file);
      setIsOpenImportDialog(true);
      handleModelNameSessionClick(file);
      // Reset the input value to allow importing the same file again
      e.target.value = "";
    }
  };

  // Handle session selection
  const handleSessionSelect = useCallback(
    (sessionId: string) => {
      setCurrentSessionId(sessionId);
      setIsSessionOpen(true);
      // Also update the global session store if needed
      const session = sessions?.find(
        (s: Session) => s.id.toString() === sessionId,
      );
      if (session) {
        selectSession(session.id, session.props.title);
      }
    },
    [sessions, selectSession],
  );

  // Handle back to list
  const handleBackToList = useCallback(() => {
    setIsSessionOpen(false);
    setCurrentSessionId(null);
    selectSession(null, "");
  }, [selectSession]);

  // Handle create session name and navigate to create page
  const navigate = useNavigate();
  const handleCreateSessionWithName = useCallback(
    async (name: string) => {
      setCreateSessionName(name);
      navigate({ to: "/sessions/create" });
    },
    [setCreateSessionName, navigate],
  );

  // Handle session created - open the newly created session
  const handleSessionCreated = useCallback(
    async (sessionId: string) => {
      setIsOpenCreateSessionMobile(false);

      // Wait for the query to be invalidated and refetched
      await queryClient.invalidateQueries({
        queryKey: [TableName.Sessions],
      });

      // Add a small delay to ensure the session list is updated
      setTimeout(() => {
        handleSessionSelect(sessionId);
      }, 100);
    },
    [handleSessionSelect],
  );

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
      setIsOpenImportDialog(false);
    }
  }, [isDragging, currentY, dragStartY]);

  return (
    <>
      {/* Session List */}
      <div className="bg-background-surface-2 flex h-dvh flex-col overflow-hidden">
        {/* Mobile Header - Hide when searching */}
        <TopNavigation
          title={
            isSelectionMode
              ? `${selectedSessions.size} Sessions selected`
              : "Sessions"
          }
          onMenuClick={isSelectionMode ? undefined : onMenuClick}
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
                disabled={selectedSessions.size === 0}
                className="h-[40px]"
              >
                {selectionAction === "copy"
                  ? "Copy"
                  : selectionAction === "export"
                    ? "Export"
                    : "Delete"}
              </Button>
            ) : (
              <ListEditDialogMobile
                onAction={(action) => {
                  if (action === "import") {
                    handleImportClick();
                  } else {
                    setSelectionAction(action);
                    setIsSelectionMode(true);
                  }
                }}
                disabled={{
                  copy: sessions?.length === 0,
                  export: sessions?.length === 0,
                  delete: sessions?.length === 0,
                }}
              />
            )
          }
        />

        {/* Hidden file input for import */}
        <input
          ref={refImportSessionFileInput}
          type="file"
          accept=".session"
          onChange={handleImportFileChange}
          style={{ display: "none" }}
        />

        {/* Search and Create - Hide when in search mode */}
        <div className="bg-background-surface-2 space-y-4 px-4 py-2">
          <SearchInput
            variant="mobile"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            onClear={() => setKeyword("")}
            placeholder="Search"
            className="w-full"
          />
        </div>

        {/* Session List */}
        {sessions?.length === 0 ? (
          <div className="bg-background-surface-2 relative flex-1">
            <div className="absolute inset-x-0 top-[40%] flex -translate-y-1/2 flex-col items-center justify-center px-4">
              <div className="text-center">
                {keyword && keyword.trim() !== "" ? (
                  <>
                    <h3 className="text-text-body mb-4 text-xl font-semibold">
                      No results for '{keyword}'
                    </h3>
                    <p className="text-background-surface-5 mb-8 text-base leading-relaxed font-medium">
                      Try a different search term or
                      <br />
                      create a new session.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-text-body mb-4 text-xl font-semibold">
                      No sessions yet
                    </h3>
                    <p className="text-background-surface-5 mb-8 text-base leading-relaxed font-medium">
                      Create your first session with your <br />
                      favorite characters and plot.
                    </p>
                  </>
                )}
                {!keyword && (
                  <StepName
                    defaultValue=""
                    onNext={handleCreateSessionWithName}
                    trigger={
                      <Button size="lg" disabled={isSelectionMode}>
                        <Plus className="h-4 w-4" />
                        <span className="text-sm font-semibold">
                          Create new session
                        </span>
                      </Button>
                    }
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-background-surface-2 flex-1 overflow-y-auto">
            {!(
              (keyword && keyword.trim() !== "") ||
              sessions?.length === 0
            ) && (
              <div className="bg-background-surface-2 flex w-full flex-col items-center justify-center py-4">
                <StepName
                  defaultValue=""
                  onNext={handleCreateSessionWithName}
                  trigger={
                    <Button size="lg" disabled={isSelectionMode}>
                      <Plus className="h-4 w-4" />
                      <span className="text-sm font-semibold">
                        Create new session
                      </span>
                    </Button>
                  }
                />
              </div>
            )}
            <div className="bg-background-surface-2 pb-4">
              {sessions?.map((session: Session) => (
                <>
                  <SessionItemMobile
                    key={session.id.toString()}
                    sessionId={session.id}
                    isActive={selectedSessionId?.equals(session.id)}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedSessions.has(session.id.toString())}
                    onSelect={handleSessionSelect}
                    onToggleSelection={() =>
                      toggleSessionSelection(session.id.toString())
                    }
                  />
                  <div className="border-border-dark mx-[16px] border-b" />
                </>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Session Main Mobile Sheet */}
      <SessionMainMobile
        sessionId={currentSessionId || undefined}
        open={isSessionOpen}
        onOpenChange={setIsSessionOpen}
        onBack={handleBackToList}
      />

      {/* Create Session Mobile */}
      <CreateSessionPageMobile
        isOpen={isOpenCreateSessionMobile}
        onClose={() => setIsOpenCreateSessionMobile(false)}
        onSessionCreated={handleSessionCreated}
      />

      {/* Import Session Sheet */}
      <>
        {/* Backdrop */}
        {isOpenImportDialog && (
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setIsOpenImportDialog(false)}
          />
        )}

        {/* Bottom Drawer */}
        <div
          ref={drawerRef}
          className={cn(
            "fixed right-0 bottom-0 left-0 z-50",
            "bg-background-surface-2 rounded-t-xl",
            "flex h-[90vh] flex-col",
            "transform transition-transform duration-300 ease-in-out",
            isOpenImportDialog ? "translate-y-0" : "translate-y-full",
          )}
        >
          {/* Handle for dragging - only this area responds to touch */}
          <div
            className="flex cursor-grab justify-center pt-3 pb-2 active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="h-1.5 w-12 rounded-full bg-gray-300" />
          </div>

          <div className="px-6 pb-4">
            <h1 className="text-left text-xl font-semibold">Import session</h1>
          </div>
          {/* Content */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6">
              {importingFile === null ? (
                <div className="flex min-h-[400px] flex-1 items-center justify-center">
                  <div
                    className="border-border-container bg-background-card hover:bg-background-input flex w-full max-w-md cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8"
                    onClick={() => refImportSessionFileInput.current?.click()}
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
                    <TypoBase className="text-text-input-subtitle mt-2 text-center text-xs">
                      Importing a session automatically imports all its related
                      cards and flows.
                    </TypoBase>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-6 pb-4">
                  <div className="bg-background-card text-text-primary border-border-container flex items-center gap-2 rounded border p-3">
                    <SvgIcon
                      name="sessions_solid"
                      size={20}
                      className="flex-shrink-0"
                    />
                    <div className="w-full min-w-0">
                      <div className="text-text-primary truncate text-base">
                        {importingFile.name} (
                        {humanizeBytes(importingFile.size)})
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Agent Models Section */}
                    {agentModels.length > 0 && (
                      <div className="flex flex-col gap-4">
                        <ScrollArea className="h-full w-full">
                          <div className="flex flex-col gap-4">
                            {agentModels.map((agent) => (
                              <div
                                key={agent.agentId}
                                className="bg-background-surface-3 inline-flex flex-col items-start justify-start gap-2 rounded p-4"
                              >
                                <div className="flex flex-col items-start justify-start gap-4 self-stretch">
                                  <div className="flex flex-col items-start justify-start gap-2 self-stretch">
                                    <div className="text-text-subtle justify-start self-stretch text-base leading-relaxed font-normal">
                                      Agent : {agent.agentName}
                                    </div>
                                  </div>
                                  <div className="flex h-11 flex-col items-start justify-start gap-2 self-stretch">
                                    <div className="text-text-subtle flex-1 justify-start self-stretch text-base leading-relaxed font-normal">
                                      Session original model
                                    </div>
                                    <div className="text-text-primary flex-1 justify-start self-stretch text-base leading-relaxed font-normal">
                                      {agent.modelName || "No model"}
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-start justify-start gap-2 self-stretch">
                                    <div className="text-text-subtle justify-start self-stretch text-base leading-relaxed font-medium">
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
                </div>
              )}
            </div>

            {/* Chat History - Fixed above footer */}
            {importingFile && (
              <div className="px-6 py-3">
                <Label className="flex items-center gap-3">
                  <CheckboxMobile
                    checked={isIncludeHistory}
                    onCheckedChange={(checked) => {
                      setIsIncludeHistory(checked === true);
                    }}
                    disabled={isImporting}
                  />
                  <span className="text-text-primary text-base">
                    Include chat messages
                  </span>
                </Label>
              </div>
            )}

            {/* Footer */}
            <div className="bg-background-surface-2 px-6 pt-6 pb-6">
              <div className="flex flex-col items-center gap-5">
                {importingFile && (
                  <Button
                    size="lg"
                    onClick={handleImportSession}
                    disabled={isImporting}
                    className="w-full"
                  >
                    {isImporting ? "Importing..." : "Import"}
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={() => setIsOpenImportDialog(false)}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </>

      <div ref={refSessionListCreate} style={{ display: "none" }} />

      {/* Include History Dialog */}
      <Dialog
        open={showIncludeHistoryDialog}
        onOpenChange={(open) => {
          setShowIncludeHistoryDialog(open);
          if (!open) {
            setIncludeHistoryForBulk(false);
          }
        }}
      >
        <DialogContent hideClose>
          <DialogHeader>
            <DialogTitle>
              {selectionAction === "copy" ? "Copy" : "Export"}{" "}
              {selectedSessions.size} session
              {selectedSessions.size !== 1 ? "s" : ""}
            </DialogTitle>
            <DialogDescription>
              Do you want to include chat history?
            </DialogDescription>
          </DialogHeader>
          <Label className="flex flex-row items-center gap-[8px]">
            <CheckboxMobile
              checked={includeHistoryForBulk}
              onCheckedChange={(checked) => {
                setIncludeHistoryForBulk(checked === true);
              }}
            />
            <span className="text-[16px] leading-[19px] font-[400]">
              Include chat messages in the{" "}
              {selectionAction === "copy" ? "duplicated" : "exported"} session
              {selectedSessions.size !== 1 ? "s" : ""}
            </span>
          </Label>
          <DialogFooter className="gap-2">
            <Button
              size="lg"
              variant="ghost"
              onClick={() => {
                setShowIncludeHistoryDialog(false);
                setIncludeHistoryForBulk(false);
              }}
            >
              Cancel
            </Button>
            <Button size="lg" onClick={executeBulkAction}>
              {selectionAction === "copy" ? "Copy" : "Export"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { SessionListMobile };
