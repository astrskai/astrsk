import { memo } from "react";
import {
  Trash2,
  Pencil,
  Check,
  History,
  RefreshCcw,
  ChevronRight,
  ChevronLeft,
  FlaskConical,
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
  bubbleColor?: string;
  textColor?: string;
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
  onEvaluate?: (messageId: UniqueEntityID) => void;
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
  bubbleColor,
  textColor,
  onEdit,
  onEditDone,
  onEditCancel,
  onDelete,
  onShowDataStore,
  onSelectOption,
  onRegenerate,
  onEvaluate,
}: ChatMessageActionsProps) => {
  const buttonVariants = isUser
    ? "hover:bg-fg-muted/80"
    : "hover:bg-border-subtle/80";

  // Use inline styles if bubbleColor/textColor provided, otherwise use class-based styling
  const containerStyle = bubbleColor
    ? { backgroundColor: bubbleColor, color: textColor }
    : undefined;

  // Visibility logic:
  // - Always show when editing
  // - On mobile (< md): show when expanded (tap to toggle)
  // - On desktop (>= md): show on hover only
  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-lg p-1",
        !bubbleColor &&
          (isUser
            ? "bg-fg-muted/80 text-surface"
            : "bg-surface-raised/80 text-fg-muted"),
        isEditing
          ? "flex"
          : isExpanded
            ? "flex md:hidden md:group-hover/message:flex"
            : "hidden group-hover/message:flex",
      )}
      style={containerStyle}
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
                isShowDataStore && "bg-black/20",
              )}
              aria-label="History"
              onClick={onShowDataStore}
            >
              <History className="h-4 w-4" />
            </button>
          )}

          {isLastMessage && (
            <div
              className={cn(
                "flex items-center gap-1 rounded p-1",
                !bubbleColor &&
                  (isUser ? "bg-fg-muted/80" : "bg-border-muted/80"),
              )}
              style={bubbleColor ? { backgroundColor: `${bubbleColor}cc` } : undefined}
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

          {isLastMessage && onEvaluate && !isUser && (
            <button
              type="button"
              className={cn(
                "flex items-center justify-center rounded p-1.5 transition-colors",
                buttonVariants,
              )}
              aria-label="Evaluate Message"
              title="Evaluate agent behavior, context, and state updates"
              onClick={() => onEvaluate(messageId)}
            >
              <FlaskConical className="h-4 w-4" />
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default memo(ChatMessageActions);
