"use client";

import { AlertTriangleIcon, Ellipsis, Menu, Plus, Search } from "lucide-react";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

import { UniqueEntityID } from "@/shared/domain";
import { Datetime } from "@/shared/lib/datetime";

import { useAsset } from "@/shared/hooks/use-asset";
import { useCard } from "@/shared/hooks/use-card";
import { useSession } from "@/shared/hooks/use-session";
import { useSessions } from "@/shared/hooks/use-sessions-v2";
import { useTurn } from "@/shared/hooks/use-turn";
import { queryClient } from "@/app/queries/query-client";
import { SessionService } from "@/app/services/session-service";
import { useAppStore } from "@/shared/stores/app-store";
import { useSessionStore } from "@/shared/stores/session-store";
import { useValidationStore } from "@/shared/stores/validation-store";
import { cn } from "@/shared/lib";
import { StepName } from "@/features/session/create-session/step-name";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Button,
  Checkbox,
  ScrollArea,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/shared/ui";
import { TableName } from "@/db/schema/table-name";
import { Card as CardType } from "@/entities/card/domain";
import { Session } from "@/entities/session/domain";

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
    <div className="bg-background-surface-2 flex h-full flex-col">
      {/* Mobile Header */}
      <div className="bg-background-surface-2 relative flex h-[60px] items-center px-4">
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
                className="h-6 w-6 p-2"
                onClick={onMenuClick}
              >
                <Menu className="h-3 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent variant="button">
              <p>Open menu</p>
            </TooltipContent>
          </Tooltip>
        )}
        <div className="pointer-events-none absolute inset-x-0 flex justify-center">
          <span className="text-text-primary max-w-[60%] truncate text-base font-semibold">
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
                  <Button
                    variant="ghost_white"
                    size="icon"
                    className="h-6 w-6 p-2"
                  >
                    <Ellipsis className="h-[2px] w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent variant="button">
                  <p>More options</p>
                </TooltipContent>
              </Tooltip>
            </DialogTrigger>
            <DialogContent
              className="bg-background-input border-border-container w-[248px] rounded-[14px] p-0"
              hideClose
            >
              <div className="flex flex-col py-2">
                <DialogClose asChild>
                  <button
                    className="hover:bg-background-card-hover text-text-primary border-border-container w-full border-b px-6 py-4 text-center text-base transition-colors"
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
                    className="hover:bg-background-card-hover text-text-primary border-border-container w-full border-b px-6 py-4 text-center text-base transition-colors"
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
                    className="hover:bg-background-card-hover text-text-primary border-border-container w-full border-b px-6 py-4 text-center text-base transition-colors"
                    onClick={() => {
                      handleImportClick();
                    }}
                  >
                    Import
                  </button>
                </DialogClose>
                <DialogClose asChild>
                  <button
                    className="hover:bg-background-card-hover text-text-primary w-full px-6 py-4 text-center text-base transition-colors"
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
      <div className="bg-background-surface-2 space-y-4 px-4 py-2">
        <div className="bg-background-surface-4 inline-flex flex-col items-start justify-start gap-2 self-stretch overflow-hidden rounded-lg px-4 py-2">
          <div className="inline-flex items-center justify-start gap-4 self-stretch">
            <div className="relative h-6 w-6 overflow-hidden">
              <Search
                className="outline-text-body absolute top-[3px] left-[3px] h-4 w-4 outline-2 outline-offset-[-1px]"
                strokeWidth={2}
              />
            </div>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search"
              className="text-text-primary placeholder:text-text-placeholder flex-1 justify-start border-none bg-transparent text-base leading-relaxed font-normal outline-none focus:ring-0 focus:outline-none"
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
            <div className="flex w-full flex-col items-center justify-center">
              <Button
                onClick={() => refSessionListCreate.current?.click()}
                disabled={isSelectionMode}
                className="bg-button-background-primary flex h-10 min-w-20 flex-col items-center justify-center gap-2.5 rounded-[20px] px-4 py-2.5"
              >
                <div className="inline-flex items-center justify-start gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="text-button-foreground-primary justify-center text-sm leading-tight font-semibold">
                    Create new session
                  </span>
                </div>
              </Button>
            </div>
          }
        />
      </div>

      {/* Session List */}
      <ScrollArea className="bg-background-surface-2 flex-1">
        <div className="px-4">
          {sessions.length === 0 ? (
            <div className="flex items-center justify-center">
              <div className="text-text-input-subtitle text-center">
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
      <div className="border-background-surface-2 bg-background-card h-8 w-8 rounded-full border-2" />
    );
  }

  return (
    <div className="border-background-surface-2 bg-background-card relative h-8 w-8 overflow-hidden rounded-full border-2">
      {icon ? (
        <img src={icon} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="bg-background-card flex h-full w-full items-center justify-center">
          <span className="text-text-input-subtitle text-xs">
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
        "flex flex-col items-center justify-start self-stretch outline-1",
        hasError &&
          "bg-background-surface-2 border-status-destrctive-light border-l-[3px]",
      )}
    >
      <button
        onClick={handleClick}
        className={cn(
          "bg-background-surface-2 border-border-dark inline-flex w-full items-start justify-start self-stretch border-b",
          "hover:bg-background-card-hover active:bg-background-card-hover",
          isActive && !isSelectionMode && "bg-background-card-hover",
          isSelected && "bg-background-card",
        )}
        // disabled={!!streamingMessageId && !selectedSessionId?.equals(sessionId)}
      >
        {/* Checkbox for selection mode */}
        {isSelectionMode && (
          <div className="pr-2 pl-4">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelection?.()}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        <div className="inline-flex flex-1 flex-col items-start justify-start gap-2 p-4">
          {/* Title and Time */}
          <div className="inline-flex items-center justify-between self-stretch">
            {hasError && (
              <div className="flex items-center justify-start gap-2">
                <AlertTriangleIcon className="text-status-destrctive-light h-6 w-6" />
              </div>
            )}
            <div className="text-text-primary justify-start text-base leading-relaxed font-semibold">
              {session.props.title}
            </div>
            <div className="text-text-body justify-start text-xs font-medium">
              {lastMessage
                ? formatLastMessage(lastMessage.createdAt)
                : "9:34 AM"}
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
                .map((card: CardType, index: number) => (
                  <MobileCharacterAvatar
                    key={card.id.toString()}
                    cardId={card.id}
                  />
                ))}
              {session.characterCards.length > 3 && (
                <div
                  className="bg-background-surface-3 outline-background-surface-2 inline-flex h-8 w-8 flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-2 outline-2 outline-offset-[-2.17px]"
                  style={{ zIndex: 0 }}
                >
                  <div className="text-text-placeholder justify-start text-[10px] leading-none font-medium">
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
