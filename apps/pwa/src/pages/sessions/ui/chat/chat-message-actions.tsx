import { memo } from "react";
import {
  Trash2,
  Pencil,
  Check,
  History,
  RefreshCcw,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/shared/lib";
import { UniqueEntityID } from "@/shared/domain";
import { DataStoreSavedField } from "@/entities/turn/domain/option";

interface ChatMessageActionsProps {
  messageId: UniqueEntityID;
  isUser: boolean;
  isEditing: boolean;
  isShowDataStore: boolean;
  isLastMessage?: boolean;
  sortedDataStoreFields?: DataStoreSavedField[];
  selectedOptionIndex: number;
  totalOptions: number;
  isExpanded?: boolean;
  onEdit: () => void;
  onEditDone: () => void;
  onEditCancel: () => void;
  onDelete: (messageId: UniqueEntityID) => void;
  onShowDataStore: () => void;
  onSelectOption: (
    messageId: UniqueEntityID,
    direction: "prev" | "next",
  ) => void;
  onRegenerate: (messageId: UniqueEntityID) => void;
}

const ChatMessageActions = ({
  messageId,
  isUser,
  isEditing,
  isShowDataStore,
  isLastMessage = true,
  sortedDataStoreFields,
  selectedOptionIndex,
  totalOptions,
  isExpanded = false,
  onEdit,
  onEditDone,
  onEditCancel,
  onDelete,
  onShowDataStore,
  onSelectOption,
  onRegenerate,
}: ChatMessageActionsProps) => {
  // Show edit mode buttons always, or when expanded (mobile tap), other buttons on hover
  const shouldAlwaysShow = isEditing || isExpanded;

  const buttonVariants = isUser
    ? "hover:bg-fg-muted/80"
    : "hover:bg-border-subtle/80";

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-lg p-1",
        isUser
          ? "bg-fg-muted/80 text-surface"
          : "bg-surface-raised/80 text-fg-muted",
        shouldAlwaysShow ? "flex" : "hidden group-hover/message:flex",
      )}
    >
      {isEditing ? (
        // Edit mode: Save and Cancel buttons
        <>
          <button
            type="button"
            className={cn(
              "flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors",
              "bg-status-success text-fg-default hover:bg-status-success/80",
            )}
            aria-label="Save"
            onClick={onEditDone}
          >
            <Check className="h-4 w-4" />
            <span>Save</span>
          </button>
          <button
            type="button"
            className={cn(
              "flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors",
              isUser
                ? "bg-fg-subtle text-surface hover:bg-fg-subtle/80"
                : "bg-border-muted text-fg-muted hover:bg-border-subtle",
            )}
            aria-label="Cancel"
            onClick={onEditCancel}
          >
            <span>Cancel</span>
          </button>
        </>
      ) : (
        // Normal mode: All action buttons for last message, only datastore for others
        <>
          {isLastMessage && (
            <button
              type="button"
              className={cn(
                "flex items-center justify-center rounded p-1.5 transition-colors",
                buttonVariants,
              )}
              aria-label="Edit"
              onClick={onEdit}
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}

          {isLastMessage && (
            <button
              type="button"
              className={cn(
                "flex items-center justify-center rounded p-1.5 transition-colors",
                buttonVariants,
              )}
              aria-label="Delete"
              onClick={() => onDelete(messageId)}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}

          {sortedDataStoreFields && sortedDataStoreFields.length > 0 && (
            <button
              type="button"
              className={cn(
                "flex items-center justify-center rounded p-1.5 transition-colors",
                buttonVariants,
              )}
              aria-label="History"
              onClick={onShowDataStore}
            >
              <History
                className={cn("h-4 w-4", isShowDataStore && "text-accent-cyan")}
              />
            </button>
          )}

          {isLastMessage && (
            <div
              className={cn(
                "flex items-center gap-1 rounded p-1",
                isUser ? "bg-fg-muted/80" : "bg-border-muted/80",
              )}
            >
              <button
                className={cn(
                  "flex items-center justify-center rounded p-0.5 transition-colors",
                  buttonVariants,
                )}
                onClick={() => onSelectOption(messageId, "prev")}
                aria-label="Previous option"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="min-w-[32px] text-center text-xs font-semibold select-none">
                {`${selectedOptionIndex + 1}/${totalOptions}`}
              </div>
              <button
                className={cn(
                  "flex items-center justify-center rounded p-0.5 transition-colors",
                  buttonVariants,
                )}
                onClick={() => onSelectOption(messageId, "next")}
                aria-label="Next option"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {isLastMessage && (
            <button
              type="button"
              className={cn(
                "flex items-center justify-center rounded p-1.5 transition-colors",
                buttonVariants,
              )}
              aria-label="Regenerate"
              onClick={() => onRegenerate(messageId)}
            >
              <RefreshCcw className="h-4 w-4" />
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default memo(ChatMessageActions);
