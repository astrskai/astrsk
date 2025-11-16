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
  onDelete,
  onShowDataStore,
  onSelectOption,
  onRegenerate,
}: ChatMessageActionsProps) => {
  return (
    <div className="sticky top-4 hidden flex-col gap-1 self-start group-hover/message:flex">
      <div
        className={cn(
          "flex flex-col gap-1 rounded-lg p-1",
          isUser
            ? "bg-gray-200/80 text-gray-900"
            : "bg-gray-800/80 text-gray-200",
        )}
      >
        <button
          type="button"
          className={cn(
            "flex items-center justify-center p-1",
            isUser ? "hover:text-gray-900/70" : "hover:text-gray-200/70",
          )}
          aria-label="Edit"
          onClick={isEditing ? onEditDone : onEdit}
        >
          {isEditing ? (
            <Check className="h-5 w-5" />
          ) : (
            <Pencil className="h-5 w-5" />
          )}
        </button>

        <button
          type="button"
          className={cn(
            "flex items-center justify-center p-1",
            isUser ? "hover:text-gray-900/70" : "hover:text-gray-200/70",
          )}
          aria-label="Delete"
          onClick={() => onDelete(messageId)}
        >
          <Trash2 className="h-5 w-5" />
        </button>

        <button
          type="button"
          className={cn(
            "flex items-center justify-center p-1",
            isUser ? "hover:text-gray-900/70" : "hover:text-gray-200/70",
            sortedDataStoreFields?.length === 0 && "hidden",
          )}
          aria-label="History"
          onClick={onShowDataStore}
        >
          <History
            className="h-5 w-5"
            color={isShowDataStore ? "#3e9392" : "currentColor"}
          />
        </button>

        <div
          className={cn(
            "flex flex-col items-center gap-0.5 rounded-lg px-1 py-0.5",
            isUser ? "bg-gray-200/80" : "bg-gray-800/80",
          )}
        >
          <button
            className={cn(
              "cursor-pointer p-0.5",
              isUser ? "hover:text-gray-900/70" : "hover:text-gray-200/70",
            )}
            onClick={() => onSelectOption(messageId, "prev")}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="min-w-[24px] text-center text-[9px] leading-[11px] font-[600] select-none">
            {`${selectedOptionIndex + 1}/${totalOptions}`}
          </div>
          <button
            className={cn(
              "cursor-pointer p-0.5",
              isUser ? "hover:text-gray-900/70" : "hover:text-gray-200/70",
            )}
            onClick={() => onSelectOption(messageId, "next")}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          className={cn(
            "flex items-center justify-center p-1",
            isUser ? "hover:text-gray-900/70" : "hover:text-gray-200/70",
          )}
          aria-label="Regenerate"
          onClick={() => onRegenerate(messageId)}
        >
          <RefreshCcw className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default memo(ChatMessageActions);
