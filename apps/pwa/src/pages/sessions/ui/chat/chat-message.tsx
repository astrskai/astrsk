import { memo, useCallback, useState, useMemo } from "react";
import { History } from "lucide-react";

import { fetchTurn } from "@/entities/turn/api/turn-queries";
import { CharacterCard } from "@/entities/card/domain/character-card";
import { Card } from "@/entities/card/domain/card";
import { ScenarioCard } from "@/entities/card/domain/scenario-card";
import { PlotCard } from "@/entities/card/domain/plot-card";
import { UniqueEntityID } from "@/shared/domain";
import { useCard } from "@/shared/hooks/use-card";
import { useAsset } from "@/shared/hooks/use-asset";
import { AvatarSimple, ChatBubble } from "@/shared/ui";
import { cn } from "@/shared/lib";
import { TranslationConfig } from "@/entities/session/domain/translation-config";
import { TextareaAutosize } from "@mui/material";
import { DataStoreSavedField } from "@/entities/turn/domain/option";
import { useUpdateTurn } from "@/entities/turn/api/turn-queries";
import { ChatStyles } from "@/entities/session/domain/chat-styles";
import { Turn } from "@/entities/turn/domain/turn";
import ChatMessageActions from "./chat-message-actions";
import { ChatMarkdown } from "./chat-markdown";
import { ScenarioMessageBox } from "./scenario-message-box";

interface ChatMessageProps {
  message: Turn;
  userCharacterId?: UniqueEntityID;
  translationConfig?: TranslationConfig;
  isStreaming?: boolean;
  streamingAgentName?: string;
  streamingModelName?: string;
  dataSchemaOrder?: string[];
  isLastMessage?: boolean;
  chatStyles?: ChatStyles;
  onEdit?: (messageId: UniqueEntityID, content: string) => Promise<void> | void;
  onDelete?: (messageId: UniqueEntityID) => void;
  onRegenerate?: (messageId: UniqueEntityID) => void;
}

const ChatMessage = ({
  message,
  userCharacterId,
  translationConfig,
  isStreaming,
  streamingAgentName,
  streamingModelName,
  dataSchemaOrder,
  isLastMessage,
  chatStyles,
  onEdit,
  onDelete,
  onRegenerate,
}: ChatMessageProps) => {
  const [editedContent, setEditedContent] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isShowDataStore, setIsShowDataStore] = useState<boolean>(false);
  const [isActionsExpanded, setIsActionsExpanded] = useState<boolean>(false);

  const [card] = useCard<Card>(message?.characterCardId);
  const [cardImageUrl] = useAsset(card?.props.iconAssetId);

  // Check if this is a scenario/plot card (not a character)
  const isScenarioCard =
    card instanceof ScenarioCard || card instanceof PlotCard;

  // For character cards, use the card as CharacterCard
  const character = card instanceof CharacterCard ? card : null;

  const updateTurnMutation = useUpdateTurn();

  const handleEdit = () => {
    const selectedOption = message.options[message.selectedOptionIndex];
    setEditedContent(selectedOption.content ?? "");

    setIsEditing(true);
  };

  const handleEditCancel = useCallback(() => {
    const selectedOption = message.options[message.selectedOptionIndex];
    setEditedContent(selectedOption.content ?? "");
    setIsEditing(false);
  }, [message.options, message.selectedOptionIndex]);

  const handleEditDone = useCallback(async () => {
    await onEdit?.(message.id, editedContent);

    setIsEditing(false);
  }, [editedContent, message.id, onEdit]);

  const handleShowDataStore = useCallback(() => {
    setIsShowDataStore((prev) => !prev);
  }, []);

  // Toggle actions visibility on mobile tap
  const handleMessageClick = useCallback(() => {
    setIsActionsExpanded((prev) => !prev);
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

  const selectedOption = message.options[message.selectedOptionIndex];

  const content = selectedOption.content;
  const language = translationConfig?.displayLanguage ?? "none";
  const translation = selectedOption.translations.get(language);

  const isUser = userCharacterId
    ? userCharacterId.equals(message.characterCardId)
    : typeof message.characterCardId === "undefined";

  const contentColor = isUser
    ? (chatStyles?.user?.text?.base?.color ?? "#000000")
    : (chatStyles?.ai?.text?.base?.color ?? "#ffffff");

  // Get display name - use card title for scenario, character name otherwise
  const displayName = isScenarioCard
    ? (card?.props.title ?? "Scenario")
    : (character?.props.name ?? character?.props.title ?? "User");

  return (
    <div
      className={cn(
        "flex items-start gap-2 pb-1 md:pb-4",
        isScenarioCard ? "px-4 md:px-15" : "px-4",
        isUser ? "flex-row-reverse" : "flex-row",
        isLastMessage && "animate-fade-in-up",
      )}
    >
      {/* Hide avatar for scenario messages */}
      {!isScenarioCard && (
        <AvatarSimple
          src={cardImageUrl || "/img/message-avatar-default.svg"}
          alt={displayName}
          className="h-9 w-9 md:h-16 md:w-16"
          size="xl"
        />
      )}

      <div
        className={cn(
          "group/message flex min-w-0 flex-1 flex-col gap-2",
          isEditing ? "items-stretch" : isUser ? "items-end" : "items-start",
        )}
      >
        {/* Hide name for scenario messages */}
        {!isScenarioCard && (
          <div
            className={cn(
              "w-fit rounded-full bg-fg-default/10 px-3 py-1 text-xs font-medium backdrop-blur-sm md:text-base",
              isEditing && isUser && "ml-auto",
            )}
          >
            {displayName}
          </div>
        )}
        <div
          className={cn(
            "flex max-w-full flex-col gap-2",
            isUser && "items-end",
          )}
        >
          {/* Scenario messages use first-message style, spanning full width */}
          {isScenarioCard ? (
            <ScenarioMessageBox
              content={
                isStreaming
                  ? (content ?? "")
                  : (translation ?? content ?? "")
              }
              className="w-full"
              onClick={handleMessageClick}
            >
              {isEditing && !isStreaming && (
                <TextareaAutosize
                  className={cn(
                    "no-resizer w-full rounded-none border-0 bg-transparent p-0 outline-0",
                    "ring-0 focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0",
                    "text-fg-muted break-words text-sm font-normal opacity-70",
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
              )}
              {isStreaming && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="bg-fg-muted/70 animate-bounce-typing h-1.5 w-1.5 rounded-full [animation-delay:0s] md:h-2 md:w-2"></span>
                    <span className="bg-fg-muted/70 animate-bounce-typing h-1.5 w-1.5 rounded-full [animation-delay:0.2s] md:h-2 md:w-2"></span>
                    <span className="bg-fg-muted/70 animate-bounce-typing h-1.5 w-1.5 rounded-full [animation-delay:0.4s] md:h-2 md:w-2"></span>
                  </div>
                  {streamingAgentName && (
                    <div className="text-fg-muted text-xs opacity-70 md:text-sm">
                      {streamingAgentName}{" "}
                      <span className="font-semibold">{streamingModelName}</span>
                    </div>
                  )}
                </div>
              )}
            </ScenarioMessageBox>
          ) : (
            <ChatBubble
              direction={isUser ? "right" : "left"}
              className={cn(
                "max-w-full md:max-w-3xl",
                isEditing && "w-full",
                isEditing && isUser && "ml-auto",
              )}
              style={{
                backgroundColor: isUser
                  ? chatStyles?.user?.chatBubble?.backgroundColor || "#f9fafb"
                  : chatStyles?.ai?.chatBubble?.backgroundColor || "#1f2937",
              }}
              onClick={handleMessageClick}
            >
              {!isStreaming ? (
                isEditing ? (
                  <TextareaAutosize
                    className={cn(
                      "no-resizer w-full rounded-none border-0 bg-transparent p-0 outline-0",
                      "ring-0 focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0",
                      "break-words",
                    )}
                    style={{
                      color: contentColor,
                    }}
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
                    <ChatMarkdown
                      content={translation ?? content ?? ""}
                      contentColor={contentColor}
                    />
                    {isShowDataStore && (
                      <div className="bg-canvas/5 data-history mt-[10px] rounded-[12px] border-[1px] p-[16px]">
                        <div className="text-fg-subtle mb-[16px] flex flex-row items-center gap-[8px]">
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
                <div className="flex flex-col gap-2">
                  {content && (
                    <div>
                      <ChatMarkdown content={content} contentColor={contentColor} />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span
                        className="animate-bounce-typing h-1.5 w-1.5 rounded-full [animation-delay:0s] md:h-2 md:w-2"
                        style={{ backgroundColor: contentColor }}
                      ></span>
                      <span
                        className="animate-bounce-typing h-1.5 w-1.5 rounded-full [animation-delay:0.2s] md:h-2 md:w-2"
                        style={{ backgroundColor: contentColor }}
                      ></span>
                      <span
                        className="animate-bounce-typing h-1.5 w-1.5 rounded-full [animation-delay:0.4s] md:h-2 md:w-2"
                        style={{ backgroundColor: contentColor }}
                      ></span>
                    </div>
                    {streamingAgentName && (
                      <div
                        className="text-xs md:text-sm"
                        style={{ color: contentColor }}
                      >
                        {streamingAgentName}{" "}
                        <span className="font-semibold">{streamingModelName}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </ChatBubble>
          )}

          {/* Action buttons - below bubble for both user and AI */}
          {!isStreaming && (
            <div
              className={cn("flex", isUser ? "justify-end" : "justify-start")}
            >
              <ChatMessageActions
                messageId={message.id}
                isUser={isUser}
                isEditing={isEditing}
                isShowDataStore={isShowDataStore}
                isLastMessage={isLastMessage}
                sortedDataStoreFields={sortedDataStoreFields}
                selectedOptionIndex={message.selectedOptionIndex}
                totalOptions={message.options.length}
                isExpanded={isActionsExpanded}
                onEdit={handleEdit}
                onEditDone={handleEditDone}
                onEditCancel={handleEditCancel}
                onDelete={(id) => onDelete?.(id)}
                onShowDataStore={handleShowDataStore}
                onSelectOption={handleSelectOption}
                onRegenerate={(id) => onRegenerate?.(id)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Memoization: Prevent re-render if messageId is the same
export default memo(ChatMessage);
