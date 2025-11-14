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

import { UniqueEntityID } from "@/shared/domain";
import { cn } from "@/shared/lib";
import type { DataStoreSavedField } from "@/entities/turn/domain/option";
import type { Turn } from "@/entities/turn/domain/turn";

interface ChatMessageActionButtonsProps {
  messageId: UniqueEntityID;
  message: Turn;
  isUser: boolean;
  isLastMessage: boolean;
  isEditing: boolean;
  isShowDataStore: boolean;
  sortedDataStoreFields?: DataStoreSavedField[];
  onEdit: () => void;
  onEditDone: () => void;
  onDelete: (messageId: UniqueEntityID) => void;
  onShowDataStore: () => void;
  onSelectOption: (messageId: UniqueEntityID, prevOrNext: "prev" | "next") => void;
  onRegenerate: (messageId: UniqueEntityID) => void;
}

const ChatMessageActionButtons = memo(({
  messageId,
  message,
  isUser,
  isLastMessage,
  isEditing,
  isShowDataStore,
  sortedDataStoreFields,
  onEdit,
  onEditDone,
  onDelete,
  onShowDataStore,
  onSelectOption,
  onRegenerate,
}: ChatMessageActionButtonsProps) => {
  return (
    <div
      className={cn(
        "absolute z-10 hidden group-hover/message:flex",
        isUser ? "right-0" : "left-0",
        isLastMessage ? "bottom-full pb-1" : "top-full pt-1",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center gap-1 rounded-lg px-2 py-1",
          isUser
            ? "bg-gray-50/80 text-gray-900"
            : "bg-gray-800/80 text-gray-200",
        )}
      >
        {/* Edit button */}
        <button
          type="button"
          className={cn(
            "flex items-center justify-center p-1",
            isUser
              ? "hover:text-gray-900/70"
              : "hover:text-gray-200/70",
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

        {/* Delete button */}
        <button
          type="button"
          className={cn(
            "flex items-center justify-center p-1",
            isUser
              ? "hover:text-gray-900/70"
              : "hover:text-gray-200/70",
          )}
          aria-label="Delete"
          onClick={() => onDelete(messageId)}
        >
          <Trash2 className="h-5 w-5" />
        </button>

        {/* DataStore toggle button */}
        <button
          type="button"
          className={cn(
            "flex items-center justify-center p-1",
            isUser
              ? "hover:text-gray-900/70"
              : "hover:text-gray-200/70",
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

        {/* Option navigation */}
        <div className="flex flex-row items-center gap-[2px]">
          <button
            className={cn(
              "cursor-pointer",
              // Mobile: larger touch target
              "max-md:p-[4px]",
            )}
            onClick={() => onSelectOption(messageId, "prev")}
          >
            <ChevronLeft
              className={cn(
                // Desktop
                "h-[16px] w-[16px]",
                // Mobile
                "max-md:h-[14px] max-md:w-[14px]",
              )}
            />
          </button>
          <div
            className={cn(
              "min-w-[24px] text-center font-[600] select-none",
              // Desktop
              "text-[10px] leading-[12px]",
              // Mobile
              "max-md:text-[9px] max-md:leading-[11px]",
            )}
          >{`${message.selectedOptionIndex + 1} / ${message.options.length}`}</div>
          <button
            className={cn(
              "cursor-pointer",
              // Mobile: larger touch target
              "max-md:p-[4px]",
            )}
            onClick={() => onSelectOption(messageId, "next")}
          >
            <ChevronRight
              className={cn(
                // Desktop
                "h-[16px] w-[16px]",
                // Mobile
                "max-md:h-[14px] max-md:w-[14px]",
              )}
            />
          </button>
        </div>

        {/* Regenerate button */}
        <button
          type="button"
          className={cn(
            "flex items-center justify-center p-1",
            isUser
              ? "hover:text-gray-900/70"
              : "hover:text-gray-200/70",
          )}
          aria-label="Regenerate"
          onClick={() => onRegenerate(messageId)}
        >
          <RefreshCcw className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
});

ChatMessageActionButtons.displayName = "ChatMessageActionButtons";

export default ChatMessageActionButtons;
