import { memo, useCallback, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Trash2,
  Pencil,
  Check,
  History,
  RefreshCcw,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

import { fetchTurn, turnQueries } from "@/entities/turn/api/turn-queries";
import { CharacterCard } from "@/entities/card/domain/character-card";
import { UniqueEntityID } from "@/shared/domain";
import { useCard } from "@/shared/hooks/use-card";
import { useAsset } from "@/shared/hooks/use-asset";
import { AvatarSimple, ChatBubble } from "@/shared/ui";
import { cn } from "@/shared/lib";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import Markdown from "react-markdown";
import { TranslationConfig } from "@/entities/session/domain/translation-config";
import { TextareaAutosize } from "@mui/material";
import { DataStoreSavedField } from "@/entities/turn/domain/option";
import { useUpdateTurn } from "@/entities/turn/api/turn-queries";

interface ChatMessageProps {
  messageId: UniqueEntityID;
  userCharacterId?: UniqueEntityID;
  translationConfig?: TranslationConfig;
  isStreaming?: boolean;
  streamingAgentName?: string;
  streamingModelName?: string;
  dataSchemaOrder?: string[];
  isLastMessage?: boolean;
  onEdit?: (messageId: UniqueEntityID, content: string) => void;
  onDelete?: (messageId: UniqueEntityID) => void;
  onRegenerate?: (messageId: UniqueEntityID) => void;
}

const ChatMessage = ({
  messageId,
  userCharacterId,
  translationConfig,
  isStreaming,
  streamingAgentName,
  streamingModelName,
  dataSchemaOrder,
  isLastMessage,
  onEdit,
  onDelete,
  onRegenerate,
}: ChatMessageProps) => {
  const [editedContent, setEditedContent] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isShowDataStore, setIsShowDataStore] = useState<boolean>(false);

  const { data: message } = useQuery(turnQueries.detail(messageId));

  const [character] = useCard<CharacterCard>(message?.characterCardId);
  const [characterImageUrl] = useAsset(character?.props.iconAssetId);

  const updateTurnMutation = useUpdateTurn();

  const handleEdit = () => {
    setEditedContent(content ?? "");

    setIsEditing(true);
  };

  const handleEditDone = useCallback(async () => {
    await onEdit?.(messageId, editedContent);

    setIsEditing(false);
  }, [editedContent, messageId, onEdit]);

  const handleShowDataStore = useCallback(() => {
    setIsShowDataStore((prev) => !prev);
  }, []);

  // Select option
  const handleSelectOption = useCallback(
    async (messageId: UniqueEntityID, prevOrNext: "prev" | "next") => {
      // Get message from DB
      const message = await fetchTurn(messageId);

      // Update selected option
      if (prevOrNext === "prev") {
        message.prevOption();
      } else {
        message.nextOption();
      }

      // Save message to DB
      updateTurnMutation.mutate({
        turn: message,
      });
    },
    [updateTurnMutation],
  );

  const sortedDataStoreFields = useMemo(() => {
    if (!message) return undefined;

    const selectedOptionIndex = message.selectedOptionIndex;

    const selectedOption = message.options[selectedOptionIndex];

    const fields = selectedOption?.dataStore;
    if (!fields) return undefined;

    const order = dataSchemaOrder || [];
    return [
      // Fields in dataSchemaOrder come first, in order
      ...order
        .map((name: string) =>
          fields.find((f: DataStoreSavedField) => f.name === name),
        )
        .filter(
          (f: DataStoreSavedField | undefined): f is NonNullable<typeof f> =>
            f !== undefined,
        ),
      // Fields not in dataSchemaOrder come after, in original order
      ...fields.filter((f: DataStoreSavedField) => !order.includes(f.name)),
    ];
  }, [dataSchemaOrder, message]);

  if (!message) return null;

  const selectedOption = message.options[message.selectedOptionIndex];

  const content = selectedOption.content;
  const language = translationConfig?.displayLanguage ?? "none";
  const translation = selectedOption.translations.get(language);

  const isUser = userCharacterId
    ? userCharacterId.equals(message.characterCardId)
    : typeof message.characterCardId === "undefined";

  return (
    <div
      className={cn(
        "flex items-start gap-2 px-4 pb-4",
        isUser ? "flex-row-reverse" : "flex-row",
        isLastMessage && "animate-fade-in-up",
      )}
    >
      <AvatarSimple
        src={characterImageUrl || "/img/message-avatar-default.svg"}
        alt={character?.props.title ?? ""}
        size="xl"
      />

      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col gap-2",
          isEditing ? "items-stretch" : isUser ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "w-fit rounded-full bg-gray-50/10 px-3 py-1 text-sm font-medium backdrop-blur-sm md:text-base",
            isEditing && isUser && "ml-auto",
          )}
        >
          {character?.props.title || "User"}
        </div>
        <div className="group/bubble relative max-w-full">
          <ChatBubble
            direction={isUser ? "right" : "left"}
            className={cn(
              "max-w-full md:max-w-3xl",
              isUser
                ? "bg-gray-50 text-gray-900"
                : "text-text-secondary bg-gray-800",
              isEditing && "w-full",
              isEditing && isUser && "ml-auto",
            )}
          >
            {!isStreaming ? (
              isEditing ? (
                <TextareaAutosize
                  className={cn(
                    "no-resizer w-full rounded-none border-0 bg-transparent p-0 outline-0",
                    "ring-0 focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0",
                    "break-words",
                  )}
                  autoFocus
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleEditDone();
                    }
                  }}
                />
              ) : (
                <>
                  <Markdown
                    className="markdown"
                    rehypePlugins={[rehypeRaw, rehypeSanitize]}
                    components={{
                      pre: ({ children }) => (
                        <pre
                          tabIndex={0}
                          className="my-2 max-w-full overflow-x-auto rounded-md p-3"
                        >
                          {children}
                        </pre>
                      ),
                      code: ({ children, className }) => {
                        const isInlineCode = !className;
                        return isInlineCode ? (
                          <code className="rounded px-1 py-0.5 text-sm">
                            {children}
                          </code>
                        ) : (
                          <code className="text-sm break-words whitespace-pre-wrap">
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {translation ?? content}
                  </Markdown>
                  {isShowDataStore && (
                    <div className="bg-background-surface-0/5 data-history mt-[10px] rounded-[12px] border-[1px] p-[16px]">
                      <div className="text-text-subtle mb-[16px] flex flex-row items-center gap-[8px]">
                        <History size={20} />
                        <div className="text-[14px] leading-[20px] font-[500]">
                          Data history
                        </div>
                      </div>
                      {sortedDataStoreFields?.map((field) => (
                        <div
                          key={field.id}
                          className="chat-style-text !text-[14px] !leading-[20px]"
                        >
                          <span className="font-[600]">{field.name} : </span>
                          <span>{field.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )
            ) : (
              <div className="flex flex-col gap-1">
                {/* Typing indicator - only show when streaming */}
                <div className="flex items-center gap-1">
                  <span className="animate-bounce-typing h-2 w-2 rounded-full bg-gray-500 [animation-delay:0s]"></span>
                  <span className="animate-bounce-typing h-2 w-2 rounded-full bg-gray-500 [animation-delay:0.2s]"></span>
                  <span className="animate-bounce-typing h-2 w-2 rounded-full bg-gray-500 [animation-delay:0.4s]"></span>
                </div>

                <div>
                  {streamingAgentName && (
                    <>
                      {streamingAgentName}{" "}
                      <span className="font-semibold">
                        {streamingModelName}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </ChatBubble>

          {/* Action buttons - shown on hover */}
          {!isStreaming && (
            <div
              className={cn(
                "absolute z-10 hidden group-hover/bubble:flex",
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
                <button
                  type="button"
                  className={cn(
                    "flex items-center justify-center p-1",
                    isUser
                      ? "hover:text-gray-900/70"
                      : "hover:text-gray-200/70",
                  )}
                  aria-label="Edit"
                  onClick={isEditing ? handleEditDone : handleEdit}
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
                    isUser
                      ? "hover:text-gray-900/70"
                      : "hover:text-gray-200/70",
                  )}
                  aria-label="Delete"
                  onClick={() => onDelete?.(messageId)}
                >
                  <Trash2 className="h-5 w-5" />
                </button>
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
                  onClick={handleShowDataStore}
                >
                  <History
                    className="h-5 w-5"
                    color={isShowDataStore ? "#3e9392" : "currentColor"}
                  />
                </button>
                <div className="flex flex-row items-center gap-[2px]">
                  <button
                    className={cn(
                      "cursor-pointer",
                      // Mobile: larger touch target
                      "max-md:p-[4px]",
                    )}
                    onClick={() => handleSelectOption(messageId, "prev")}
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
                    onClick={() => handleSelectOption(messageId, "next")}
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
                <button
                  type="button"
                  className={cn(
                    "flex items-center justify-center p-1",
                    isUser
                      ? "hover:text-gray-900/70"
                      : "hover:text-gray-200/70",
                  )}
                  aria-label="Regenerate"
                  onClick={() => onRegenerate?.(messageId)}
                >
                  <RefreshCcw className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Memoization: Prevent re-render if messageId is the same
export default memo(ChatMessage, (prev, next) => {
  return (
    prev.messageId.equals(next.messageId) &&
    prev.isStreaming === next.isStreaming &&
    // prev.isLastMessage === next.isLastMessage &&
    prev.streamingAgentName === next.streamingAgentName &&
    prev.streamingModelName === next.streamingModelName &&
    prev.translationConfig === next.translationConfig
  );
});
