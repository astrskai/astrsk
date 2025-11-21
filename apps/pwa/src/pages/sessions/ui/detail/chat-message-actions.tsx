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
  sortedDataStoreFields?: DataStoreSavedField[];
  selectedOptionIndex: number;
  totalOptions: number;
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
  sortedDataStoreFields,
  selectedOptionIndex,
  totalOptions,
  onEdit,
  onEditDone,
  onEditCancel,
  onDelete,
  onShowDataStore,
  onSelectOption,
  onRegenerate,
}: ChatMessageActionsProps) => {
  // Show edit mode buttons always, other buttons on hover
  const shouldAlwaysShow = isEditing;

  const buttonVariants = isUser ? "hover:bg-gray-200" : "hover:bg-gray-500";

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-lg p-1",
        isUser
          ? "bg-gray-200/80 text-gray-900"
          : "bg-gray-800/80 text-gray-200",
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
              isUser
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-green-600 text-white hover:bg-green-700",
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
                ? "bg-gray-300 text-gray-900 hover:bg-gray-400"
                : "bg-gray-700 text-gray-200 hover:bg-gray-600",
            )}
            aria-label="Cancel"
            onClick={onEditCancel}
          >
            <span>Cancel</span>
          </button>
        </>
      ) : (
        // Normal mode: All action buttons
        <>
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
                className="h-4 w-4"
                color={isShowDataStore ? "#3e9392" : "currentColor"}
              />
            </button>
          )}

          <div
            className={cn(
              "flex items-center gap-1 rounded px-2 py-1",
              isUser ? "bg-gray-100/80" : "bg-gray-700/80",
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
        </>
      )}
    </div>
  );
};

export default memo(ChatMessageActions);
