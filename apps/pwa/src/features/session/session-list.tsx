"use client";

import { AlertTriangleIcon, Ellipsis, Menu, Plus, Search } from "lucide-react";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components-v2/ui/tooltip";

import { UniqueEntityID } from "@/shared/domain";
import { Datetime } from "@/shared/lib/datetime";

import { useAsset } from "@/app/hooks/use-asset";
import { useCard } from "@/app/hooks/use-card";
import { useSession } from "@/app/hooks/use-session";
import { useSessions } from "@/app/hooks/use-sessions-v2";
import { useTurn } from "@/app/hooks/use-turn";
import { queryClient } from "@/app/queries/query-client";
import { SessionService } from "@/app/services/session-service";
import { useAppStore } from "@/app/stores/app-store";
import { useSessionStore } from "@/app/stores/session-store";
import { useValidationStore } from "@/app/stores/validation-store";
import { cn } from "@/shared/lib";
import { StepName } from "@/features/session/create-session/step-name";
import { Button } from "@/components-v2/ui/button";
import { Checkbox } from "@/components-v2/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components-v2/ui/dialog";
import { ScrollArea } from "@/components-v2/ui/scroll-area";
import { TableName } from "@/db/schema/table-name";
import { Card as CardType } from "@/modules/card/domain";
import { Session } from "@/modules/session/domain";

export function humanizeBytes(bytes: number): string {
  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) {
    return "0 Bytes";
  }
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
  return Math.round(bytes / Math.pow(1024, i)) + units[i];
}

const formatLastMessage = (lastMessageAt: Date) => {
  const now = Datetime();
  const date = Datetime(lastMessageAt);
  if (date.isToday()) {
    return date.format("HH:mm A");
  } else {
    return date.fromNow();
  }
};

// Mobile version of SessionList
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
  const { setActivePage, isMobile } = useAppStore();
  const navigate = useNavigate();
  const { data: sessions } = useSessions({
    keyword,
  });

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

  // Import session state
  const [isOpenImportDialog, setIsOpenImportDialog] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importingFile, setImportingFile] = useState<File | null>(null);
  const refImportSessionFileInput = useRef<HTMLInputElement>(null);

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
  }, [allSessions]);

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

  // Handle action on selected sessions
  const handleSelectionAction = useCallback(async () => {
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
          includeHistory: false, // Default to false for bulk operations
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
          includeHistory: false, // Default to false for bulk operations
        });
        if (exportOrError.isSuccess) {
          const file = exportOrError.getValue();
          // Create download link
          const url = URL.createObjectURL(file);
          const a = document.createElement("a");
          a.href = url;
          a.download = file.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } else {
          toast.error("Failed to export session", {
            description: exportOrError.getError(),
          });
        }
      }

      toast.success(`Exported ${selectedSessions.size} session(s)`);
    }

    exitSelectionMode();
  }, [selectedSessions, selectionAction, exitSelectionMode]);

  // Handle import file
  const handleImportClick = () => {
    refImportSessionFileInput.current?.click();
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportingFile(file);
      setIsOpenImportDialog(true);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background-surface-2">
      {/* Mobile Header */}
      <div className="relative flex items-center h-[60px] px-4 bg-background-surface-2">
        {isSelectionMode ? (
          <Button variant="ghost" size="sm" onClick={exitSelectionMode}>
            Done
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost_white"
                size="icon"
                className="w-6 h-6 p-2"
                onClick={onMenuClick}
              >
                <Menu className="w-4 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent variant="button">
              <p>Open menu</p>
            </TooltipContent>
          </Tooltip>
        )}
        <div className="absolute inset-x-0 flex justify-center pointer-events-none">
          <span className="font-semibold text-base text-text-primary truncate max-w-[60%]">
            {isSelectionMode
              ? `${selectedSessions.size} Sessions selected`
              : "Sessions"}
          </span>
        </div>
        <div className="flex-1" />
        {isSelectionMode ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectionAction}
            disabled={selectedSessions.size === 0}
          >
            {selectionAction === "copy"
              ? "Copy"
              : selectionAction === "export"
                ? "Export"
                : "Delete"}
          </Button>
        ) : (
          <Dialog>
            <DialogTrigger asChild>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost_white" size="icon" className="w-6 h-6 p-2">
                    <Ellipsis className="w-4 h-[2px]" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent variant="button">
                  <p>More options</p>
                </TooltipContent>
              </Tooltip>
            </DialogTrigger>
            <DialogContent
              className="w-[248px] p-0 bg-background-input border-border-container rounded-[14px]"
              hideClose
            >
              <div className="flex flex-col py-2">
                <DialogClose asChild>
                  <button
                    className="w-full text-center px-6 py-4 hover:bg-background-card-hover transition-colors text-text-primary text-base border-b border-border-container"
                    onClick={() => {
                      setSelectionAction("copy");
                      setIsSelectionMode(true);
                    }}
                  >
                    Copy
                  </button>
                </DialogClose>
                <DialogClose asChild>
                  <button
                    className="w-full text-center px-6 py-4 hover:bg-background-card-hover transition-colors text-text-primary text-base border-b border-border-container"
                    onClick={() => {
                      setSelectionAction("export");
                      setIsSelectionMode(true);
                    }}
                  >
                    Export
                  </button>
                </DialogClose>
                <DialogClose asChild>
                  <button
                    className="w-full text-center px-6 py-4 hover:bg-background-card-hover transition-colors text-text-primary text-base border-b border-border-container"
                    onClick={() => {
                      handleImportClick();
                    }}
                  >
                    Import
                  </button>
                </DialogClose>
                <DialogClose asChild>
                  <button
                    className="w-full text-center px-6 py-4 hover:bg-background-card-hover transition-colors text-text-primary text-base"
                    onClick={() => {
                      setSelectionAction("delete");
                      setIsSelectionMode(true);
                    }}
                  >
                    Delete
                  </button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Hidden file input for import */}
      <input
        ref={refImportSessionFileInput}
        type="file"
        accept=".session"
        onChange={handleImportFileChange}
        style={{ display: "none" }}
      />

      {/* Search and Create */}
      <div className="px-4 py-2 space-y-4 bg-background-surface-2">
        <div className="self-stretch px-4 py-2 bg-background-surface-4 rounded-lg inline-flex flex-col justify-start items-start gap-2 overflow-hidden">
          <div className="self-stretch inline-flex justify-start items-center gap-4">
            <div className="w-6 h-6 relative overflow-hidden">
              <Search
                className="w-4 h-4 left-[3px] top-[3px] absolute outline-2 outline-offset-[-1px] outline-text-body"
                strokeWidth={2}
              />
            </div>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search"
              className="flex-1 justify-start text-text-primary text-base font-normal leading-relaxed bg-transparent outline-none border-none focus:outline-none focus:ring-0 placeholder:text-text-placeholder"
            />
          </div>
        </div>

        <StepName
          defaultValue="New session"
          onNext={async (name) => {
            setCreateSessionName(name);
            navigate({ to: "/sessions/create" });
          }}
          trigger={
            <div className="w-full flex flex-col items-center justify-center">
              <Button
                onClick={() => refSessionListCreate.current?.click()}
                disabled={isSelectionMode}
                className="h-10 min-w-20 px-4 py-2.5 bg-button-background-primary rounded-[20px] flex flex-col justify-center items-center gap-2.5"
              >
                <div className="inline-flex justify-start items-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span className="justify-center text-button-foreground-primary text-sm font-semibold leading-tight">
                    Create new session
                  </span>
                </div>
              </Button>
            </div>
          }
        />
      </div>

      {/* Session List */}
      <ScrollArea className="flex-1 bg-background-surface-2">
        <div className="px-4">
          {sessions.length === 0 ? (
            <div className="flex items-center justify-center">
              <div className="text-center text-text-input-subtitle">
                {keyword.length > 0
                  ? `No results for '${keyword}'`
                  : "No sessions"}
              </div>
            </div>
          ) : (
            <div className="space-y-0">
              {sessions.map((session: Session) => (
                <div key={session.id.toString()}>
                  <SessionListItemMobile
                    sessionId={session.id}
                    isActive={session.id.equals(selectedSessionId)}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedSessions.has(session.id.toString())}
                    onToggleSelection={() =>
                      toggleSessionSelection(session.id.toString())
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

    </div>
  );
};

// Mobile Character Avatar Component
const MobileCharacterAvatar = ({ cardId }: { cardId: UniqueEntityID }) => {
  const [card] = useCard<CardType>(cardId);
  const [icon] = useAsset(card?.props.iconAssetId);

  if (!card) {
    return (
      <div className="w-8 h-8 rounded-full border-2 border-background-surface-2 bg-background-card" />
    );
  }

  return (
    <div className="relative w-8 h-8 rounded-full border-2 border-background-surface-2 bg-background-card overflow-hidden">
      {icon ? (
        <img src={icon} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-background-card flex items-center justify-center">
          <span className="text-xs text-text-input-subtitle">
            {(card as any).props.name?.charAt(0) || card.props.title.charAt(0)}
          </span>
        </div>
      )}
    </div>
  );
};

// Mobile version of SessionListItem
const SessionListItemMobile = ({
  sessionId,
  isActive,
  isSelectionMode,
  isSelected,
  onToggleSelection,
}: {
  sessionId: UniqueEntityID;
  isActive?: boolean;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
}) => {
  const [session] = useSession(sessionId);
  const [lastMessage] = useTurn(
    session && session.turnIds.length > 0
      ? session.turnIds[session.turnIds.length - 1]
      : undefined,
  );

  const selectSession = useSessionStore.use.selectSession();

  if (!session) {
    return null;
  }

  const messageCount = session.props.turnIds.length;
  const hasError = false; // You can add error state logic here

  const handleClick = () => {
    if (isSelectionMode) {
      onToggleSelection?.();
    } else {
      selectSession(sessionId, session.title);
    }
  };

  return (
    <div
      className={cn(
        "self-stretch outline-1 flex flex-col justify-start items-center",
        hasError &&
          "bg-background-surface-2 border-l-[3px] border-status-destrctive-light",
      )}
    >
      <button
        onClick={handleClick}
        className={cn(
          "self-stretch bg-background-surface-2 border-b border-border-dark inline-flex justify-start items-start w-full",
          "hover:bg-background-card-hover active:bg-background-card-hover",
          isActive && !isSelectionMode && "bg-background-card-hover",
          isSelected && "bg-background-card",
        )}
        // disabled={!!streamingMessageId && !selectedSessionId?.equals(sessionId)}
      >
        {/* Checkbox for selection mode */}
        {isSelectionMode && (
          <div className="pl-4 pr-2">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelection?.()}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        <div className="flex-1 p-4 inline-flex flex-col justify-start items-start gap-2">
          {/* Title and Time */}
          <div className="self-stretch inline-flex justify-between items-center">
            {hasError && (
              <div className="flex justify-start items-center gap-2">
                <AlertTriangleIcon className="w-6 h-6 text-status-destrctive-light" />
              </div>
            )}
            <div className="justify-start text-text-primary text-base font-semibold leading-relaxed">
              {session.props.title}
            </div>
            <div className="justify-start text-text-body text-xs font-medium">
              {lastMessage
                ? formatLastMessage(lastMessage.createdAt)
                : "9:34 AM"}
            </div>
          </div>

          {/* Message Count and Avatars */}
          <div className="self-stretch inline-flex justify-between items-start">
            <div className="flex justify-start items-center gap-3">
              <div className="inline-flex flex-col justify-start items-start gap-1">
                <div className="inline-flex justify-start items-center gap-1">
                  <div className="justify-start text-text-primary text-base font-normal leading-relaxed">
                    {messageCount.toLocaleString()}
                  </div>
                  <div className="justify-start text-text-body text-xs font-normal">
                    Messages
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end items-center">
              {session.characterCards.slice(0, 3).map((card: CardType, index: number) => (
                <MobileCharacterAvatar
                  key={card.id.toString()}
                  cardId={card.id}
                />
              ))}
              {session.characterCards.length > 3 && (
                <div
                  className="w-8 h-8 px-2 py-2 bg-background-surface-3 rounded-xl outline-2 outline-offset-[-2.17px] outline-background-surface-2 inline-flex flex-col justify-center items-center gap-1.5"
                  style={{ zIndex: 0 }}
                >
                  <div className="justify-start text-text-placeholder text-[10px] font-medium leading-none">
                    +{session.characterCards.length - 3}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </button>
    </div>
  );
};

export { SessionListMobile };
