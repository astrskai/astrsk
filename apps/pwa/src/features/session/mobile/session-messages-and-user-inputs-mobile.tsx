import TextareaAutosize from "@mui/material/TextareaAutosize";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCcw,
  Send,
  Shuffle,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { toast } from "sonner";

import { UniqueEntityID } from "@/shared/domain";
import { parseAiSdkErrorMessage } from "@/shared/lib/error-utils";
import { logger } from "@/shared/lib/logger";
import { TemplateRenderer } from "@/shared/lib/template-renderer";

import { useAsset } from "@/app/hooks/use-asset";
import { useCard } from "@/app/hooks/use-card";
import { sessionQueries } from "@/app/queries/session-queries";
import { turnQueries } from "@/app/queries/turn-queries";
import { CardService } from "@/app/services/card-service";
import {
  addMessage,
  executeFlow,
  makeContext,
} from "@/app/services/session-play-service";
import { SessionService } from "@/app/services/session-service";
import { TurnService } from "@/app/services/turn-service";
import { Page, useAppStore } from "@/shared/stores/app-store";
import { AutoReply, useSessionStore } from "@/shared/stores/session-store";

import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib";
import { ScenarioItem } from "@/features/session/components/scenario/scenario-item";
import { InlineChatStyles } from "@/features/session/inline-chat-styles";

import {
  Avatar,
  Button,
  SvgIcon,
  TypoSmall,
  TypoTiny,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui";
import { CharacterCard, PlotCard } from "@/entities/card/domain";
import { TranslationConfig } from "@/entities/session/domain/translation-config";
import { Option } from "@/entities/turn/domain/option";
import { Turn } from "@/entities/turn/domain/turn";
import { TurnDrizzleMapper } from "@/entities/turn/mappers/turn-drizzle-mapper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";
import { isPathWithBasePath } from "@/shared/lib/url-utils";

interface ScrollToBottomOptions {
  wait?: number;
  behavior?: ScrollBehavior;
}

const MessageItemInternalMobile = ({
  characterCardId,
  isUser,
  content,
  translation,
  selectedOptionIndex = 0,
  optionsLength = 1,
  disabled,
  streaming,
  isLastMessage = false,
  onEdit,
  onDelete,
  onPrevOption,
  onNextOption,
  onRegenerate,
}: {
  characterCardId?: UniqueEntityID;
  isUser?: boolean;
  content?: string;
  translation?: string;
  selectedOptionIndex?: number;
  optionsLength?: number;
  disabled?: boolean;
  streaming?: boolean;
  streamingAgentName?: string;
  streamingModelName?: string;
  isLastMessage?: boolean;
  onEdit?: (content: string) => Promise<void>;
  onDelete?: () => Promise<void>;
  onPrevOption?: () => Promise<void>;
  onNextOption?: () => Promise<void>;
  onRegenerate?: () => Promise<void>;
}) => {
  const isMobile = useIsMobile();

  // Character card
  const [characterCard] = useCard<CharacterCard>(characterCardId);
  const [icon] = useAsset(characterCard?.props.iconAssetId);

  // Edit message
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<string>(content ?? "");
  const [showEditButtons, setShowEditButtons] = useState(false);
  const editButtonsRef = useRef<HTMLDivElement>(null);
  const isEditingRef = useRef(isEditing);
  const showEditButtonsRef = useRef(showEditButtons);

  // Keep refs in sync with state
  useEffect(() => {
    isEditingRef.current = isEditing;
    showEditButtonsRef.current = showEditButtons;
  }, [isEditing, showEditButtons]);

  const onEditDone = useCallback(async () => {
    await onEdit?.(editedContent);
    setIsEditing(false);
    setShowEditButtons(false); // Hide edit buttons after editing is done
  }, [editedContent, onEdit]);

  // Reset edited content when content prop changes
  useEffect(() => {
    setEditedContent(content ?? "");
  }, [content]);

  // Handle click outside to close edit buttons
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        editButtonsRef.current &&
        !editButtonsRef.current.contains(event.target as Node) &&
        !isEditingRef.current &&
        showEditButtonsRef.current
      ) {
        setShowEditButtons(false);
      }
    };

    // Add listeners once
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []); // Empty dependency array - listeners are added once and use refs for current values

  return (
    <div
      className={cn(
        "group/message relative px-[16px] transition-all duration-200 ease-in-out",
        // Add extra bottom padding when edit buttons are visible to prevent overlap
        showEditButtons && !isLastMessage && "pb-[8px]",
        // Add significant bottom margin for last message when edit buttons are shown
        showEditButtons && isLastMessage && "pb-[8px]",
      )}
    >
      <div
        className={cn(
          "flex items-start gap-[8px]",
          isUser ? "flex-row-reverse" : "flex-row",
          isUser ? "user-chat-style" : "ai-chat-style",
        )}
      >
        <div className="flex-shrink-0">
          {characterCardId ? (
            <Avatar
              src={icon}
              alt={characterCard?.props.name?.at(0)?.toUpperCase() ?? ""}
              size={40}
            />
          ) : (
            <Avatar src="/img/message-avatar-default.svg" size={40} />
          )}
        </div>
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col gap-[4px]", // Add min-w-0 to prevent flex shrinking issues
            isUser ? "items-end" : "items-start",
          )}
        >
          {/* Character name on top */}
          <div
            className={cn(
              "text-text-primary px-[8px] text-[12px] leading-[15px]",
              isUser && "text-right",
            )}
          >
            {characterCard?.props.name || "User"}
          </div>

          <div
            className={cn(
              "chat-style-chat-bubble relative rounded-[8px] p-[12px]",
              isEditing && !disabled && "w-full",
              !isMobile && "max-w-[600px] min-w-[300px]",
            )}
            onClick={() =>
              !isEditing &&
              !disabled &&
              !streaming &&
              setShowEditButtons(!showEditButtons)
            }
          >
            {isEditing && !disabled ? (
              <TextareaAutosize
                className={cn(
                  "no-resizer w-full rounded-none border-0 bg-transparent p-0 outline-0",
                  "ring-0 focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0",
                )}
                autoFocus
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onEditDone();
                  }
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                {streaming && content === "" && (
                  <SvgIcon
                    name="astrsk_symbol"
                    size={24}
                    className={cn("chat-style-text animate-spin")}
                  />
                )}
                <Markdown
                  rehypePlugins={[rehypeRaw, rehypeSanitize]}
                  className="markdown chat-style-text"
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
              </>
            )}
          </div>

          {/* Edit buttons - show on click or when editing */}
          {(showEditButtons || isEditing) && !disabled && !streaming && (
            <div
              ref={editButtonsRef}
              className={cn(
                "flex flex-row items-center gap-[8px] rounded-[8px] px-[12px] py-[6px]",
                "chat-style-chat-bubble message-buttons",
                "mt-[4px]",
              )}
            >
              {isEditing ? (
                <Check
                  className="size-[24px] cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditDone();
                  }}
                />
              ) : (
                <SvgIcon
                  name="edit"
                  size={24}
                  className="min-h-[24px] min-w-[24px] cursor-pointer"
                  onClick={() => {
                    setEditedContent(content ?? "");
                    setIsEditing(true);
                  }}
                />
              )}
              <Trash2
                className="size-[24px] cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.();
                }}
              />
              <div className="flex flex-row items-center gap-[2px]">
                <ChevronLeft
                  className="size-[16px] cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPrevOption?.();
                  }}
                />
                <div className="min-w-[20px] text-center text-xs leading-[11px] font-[600] select-none">{`${selectedOptionIndex + 1} / ${optionsLength}`}</div>
                <ChevronRight
                  className="size-[16px] cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNextOption?.();
                  }}
                />
              </div>
              <RefreshCcw
                className="size-[24px] cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onRegenerate?.();
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ScenarioMessageItemMobile = ({
  content,
  onEdit,
  onDelete,
}: {
  content?: string;
  onEdit?: (content: string) => Promise<void>;
  onDelete?: () => Promise<void>;
}) => {
  // Edit message
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<string>(content ?? "");
  const [showEditButtons, setShowEditButtons] = useState(false);
  const editButtonsRef = useRef<HTMLDivElement>(null);

  const onEditDone = useCallback(async () => {
    await onEdit?.(editedContent);
    setIsEditing(false);
  }, [editedContent, onEdit]);

  // Handle click outside to close edit buttons
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        editButtonsRef.current &&
        !editButtonsRef.current.contains(event.target as Node)
      ) {
        setShowEditButtons(false);
      }
    };

    if (showEditButtons) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showEditButtons]);

  return (
    <div
      className={cn(
        "group/scenario px-[16px] transition-all duration-200 ease-in-out",
        // Add extra bottom padding when edit buttons are visible to prevent overlap
        (showEditButtons || isEditing) && "pb-[56px]",
      )}
    >
      <div
        className={cn(
          "relative mx-auto w-full rounded-[8px] p-[16px]",
          "bg-background-container text-text-placeholder text-[14px] leading-[17px] font-[400]",
          "transition-all duration-200 ease-in-out",
          isEditing && "inset-ring-text-primary inset-ring-1",
        )}
        onClick={() => !isEditing && setShowEditButtons(!showEditButtons)}
      >
        {isEditing ? (
          <TextareaAutosize
            className={cn(
              "no-resizer -mb-[4px] w-full rounded-none border-0 bg-transparent p-0 outline-0",
              "ring-0 focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0",
            )}
            autoFocus
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onEditDone();
              }
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <Markdown
            className="markdown"
            rehypePlugins={[rehypeRaw, rehypeSanitize]}
          >
            {content}
          </Markdown>
        )}

        {/* Button container at bottom */}
        {(showEditButtons || isEditing) && (
          <div
            ref={editButtonsRef}
            className="absolute right-2 bottom-[-42px] flex gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {!isEditing ? (
              <>
                {/* Edit button */}
                <div
                  className={cn(
                    "cursor-pointer rounded-[8px] p-[8px]",
                    "bg-background-container text-text-input-subtitle",
                    "hover:text-text-primary hover:inset-ring-text-primary hover:inset-ring-1",
                    "transition-all duration-200 ease-in-out",
                  )}
                  onClick={() => setIsEditing(true)}
                >
                  <SvgIcon name="edit" size={18} />
                </div>
                {/* Delete button */}
                <div
                  className={cn(
                    "cursor-pointer rounded-[8px] p-[8px]",
                    "bg-background-container text-text-input-subtitle",
                    "hover:text-text-primary hover:inset-ring-text-primary hover:inset-ring-1",
                    "transition-all duration-200 ease-in-out",
                  )}
                  onClick={() => onDelete?.()}
                >
                  <Trash2 size={18} />
                </div>
              </>
            ) : (
              <>
                {/* Save button */}
                <div
                  className={cn(
                    "cursor-pointer rounded-[8px] p-[8px]",
                    "bg-background-container text-text-input-subtitle",
                    "hover:text-text-primary hover:inset-ring-text-primary hover:inset-ring-1",
                    "transition-all duration-200 ease-in-out",
                  )}
                  onClick={onEditDone}
                >
                  <Check size={18} />
                </div>
                {/* Cancel button */}
                <div
                  className={cn(
                    "cursor-pointer rounded-[8px] p-[8px]",
                    "bg-background-container text-text-input-subtitle",
                    "hover:text-text-primary hover:inset-ring-text-primary hover:inset-ring-1",
                    "transition-all duration-200 ease-in-out",
                  )}
                  onClick={() => {
                    setEditedContent(content ?? "");
                    setIsEditing(false);
                  }}
                >
                  <X size={18} />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ScenarioMessageItem = ({
  content,
  onEdit,
}: {
  content?: string;
  onEdit?: (content: string) => Promise<void>;
}) => {
  // Edit message
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<string>(content ?? "");
  const onEditDone = useCallback(async () => {
    await onEdit?.(editedContent);
    setIsEditing(false);
  }, [editedContent, onEdit]);

  return (
    <div className="group/scenario px-[56px]">
      <div
        className={cn(
          "relative mx-auto w-full max-w-[890px] min-w-[400px] rounded-[4px] p-[24px]",
          "bg-background-container text-text-placeholder text-[16px] leading-[19px] font-[400]",
          "transition-all duration-200 ease-in-out",
          "group-hover/scenario:inset-ring-text-primary group-hover/scenario:inset-ring-1",
          isEditing && "inset-ring-text-primary inset-ring-1",
        )}
      >
        {isEditing ? (
          <TextareaAutosize
            className={cn(
              "no-resizer -mb-[4px] w-full rounded-none border-0 bg-transparent p-0 outline-0",
              "ring-0 focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0",
            )}
            autoFocus
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onEditDone();
              }
            }}
          />
        ) : (
          <Markdown
            className="markdown"
            rehypePlugins={[rehypeRaw, rehypeSanitize]}
          >
            {content}
          </Markdown>
        )}
        <div className="absolute top-0 right-[-16px]">
          <div
            className={cn(
              "absolute top-0 left-0 cursor-pointer rounded-[8px] p-[8px]",
              "bg-background-container text-text-input-subtitle",
              "hover:text-text-primary hover:inset-ring-text-primary hover:inset-ring-1",
              "transition-all duration-200 ease-in-out",
              "opacity-0 group-hover/scenario:block group-hover/scenario:opacity-100",
              isEditing && "opacity-100",
            )}
            onClick={() => {
              if (isEditing) {
                onEditDone();
              } else {
                setIsEditing(true);
              }
            }}
          >
            {isEditing ? (
              <Check size={20} />
            ) : (
              <SvgIcon name="edit" size={20} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MessageItem = ({
  messageId,
  userCharacterCardId,
  translationConfig,
  disabled,
  streaming,
  isLastMessage = false,
  editMessage,
  deleteMessage,
  selectOption,
  generateOption,
}: {
  messageId: UniqueEntityID;
  userCharacterCardId?: UniqueEntityID;
  translationConfig?: TranslationConfig;
  disabled?: boolean;
  streaming?: {
    agentName?: string;
    modelName?: string;
  };
  isLastMessage?: boolean;
  editMessage: (messageId: UniqueEntityID, content: string) => Promise<void>;
  deleteMessage: (messageId: UniqueEntityID) => Promise<void>;
  selectOption: (
    messageId: UniqueEntityID,
    prevOrNext: "prev" | "next",
  ) => Promise<void>;
  generateOption: (messageId: UniqueEntityID) => Promise<void>;
}) => {
  const isMobile = useIsMobile();
  const { data: message } = useQuery(turnQueries.detail(messageId));
  const selectedOption = message?.options[message.selectedOptionIndex];

  // Display language
  const content = selectedOption?.content;
  const language = translationConfig?.displayLanguage ?? "none";
  const translation = selectedOption?.translations.get(language);

  if (!message) {
    return null;
  }

  // Scenario message
  if (
    typeof message.characterCardId === "undefined" &&
    typeof message.characterName === "undefined"
  ) {
    return (
      <ScenarioMessageItemMobile
        content={content}
        onEdit={(content) => editMessage(messageId, content)}
        onDelete={() => deleteMessage(messageId)}
      />
    );
  }

  const isUser = userCharacterCardId
    ? userCharacterCardId.equals(message.characterCardId)
    : typeof message.characterCardId === "undefined";

  return (
    <MessageItemInternalMobile
      characterCardId={message.characterCardId}
      isUser={isUser}
      content={content}
      translation={translation}
      selectedOptionIndex={message.selectedOptionIndex}
      optionsLength={message.options.length}
      disabled={disabled}
      streaming={typeof streaming !== "undefined"}
      streamingAgentName={streaming?.agentName}
      streamingModelName={streaming?.modelName}
      isLastMessage={isLastMessage}
      onEdit={(content) => editMessage(messageId, content)}
      onDelete={() => deleteMessage(messageId)}
      onPrevOption={() => selectOption(messageId, "prev")}
      onNextOption={() => selectOption(messageId, "next")}
      onRegenerate={() => generateOption(messageId)}
    />
  );
};

const UserInputCharacterButton = ({
  characterCardId,
  icon,
  label,
  isUser = false,
  onClick = () => {},
  isHighLighted = false,
  isMobile = false,
}: {
  characterCardId?: UniqueEntityID;
  icon?: React.ReactNode;
  label?: string;
  isUser?: boolean;
  onClick?: () => void;
  isHighLighted?: boolean;
  isMobile?: boolean;
}) => {
  const [characterCard] = useCard<CharacterCard>(characterCardId);
  const [characterIcon] = useAsset(characterCard?.props.iconAssetId);

  if (characterCardId && !characterCard) {
    return null;
  }

  return (
    <div
      className="group relative flex cursor-pointer flex-col items-center gap-[4px]"
      onClick={onClick}
    >
      {characterCard ? (
        <>
          <Avatar
            src={characterIcon}
            alt={characterCard.props.name?.at(0)?.toUpperCase() ?? ""}
            size={48}
            className={cn(
              isHighLighted
                ? "border-primary-normal border-2 shadow-[0px_0px_10px_0px_rgba(152,215,249,1.00)]"
                : "",
            )}
          />
          <div
            className={cn(
              "truncate text-[12px] leading-[15px]",
              isUser
                ? "text-text-primary font-[500]"
                : "text-text-secondary font-[400]",
              "max-w-[48px]",
            )}
          >
            {characterCard.props.name}
          </div>
          <div
            className={cn(
              "pointer-events-none absolute top-0 left-0 size-[48px]",
              "border-border-selected-inverse rounded-full border-[3px]",
              "opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100",
            )}
          />
          {isUser && (
            <div className="bg-status-optional absolute top-0 right-0 size-[12px] rounded-full border-[2px]" />
          )}
        </>
      ) : (
        <>
          <div
            className={cn(
              "text-text-primary grid size-[48px] place-items-center rounded-full",
              "bg-background-surface-4 group-hover:bg-background-surface-5 transition-colors duration-300 ease-out",
            )}
          >
            {icon}
          </div>
          <div
            className={cn(
              "text-text-primary truncate text-[12px] leading-[15px] font-[500]",
              "max-w-[48px]",
            )}
          >
            {label}
          </div>
        </>
      )}
    </div>
  );
};

const UserInputAutoReplyButton = ({
  autoReply,
  setAutoReply,
  characterCount,
}: {
  autoReply: AutoReply;
  setAutoReply: (autoReply: AutoReply) => void;
  characterCount: number;
}) => {
  const hasMultipleCharacters = characterCount > 1;

  return (
    <div
      className="group relative flex cursor-pointer flex-col items-center gap-[4px]"
      onClick={() => {
        switch (autoReply) {
          case AutoReply.Off:
            setAutoReply(AutoReply.Random);
            break;
          case AutoReply.Random:
            // Skip Rotate option if only one character
            setAutoReply(
              hasMultipleCharacters ? AutoReply.Rotate : AutoReply.Off,
            );
            break;
          case AutoReply.Rotate:
            setAutoReply(AutoReply.Off);
            break;
          default:
            throw new Error("Unknown auto reply");
        }
      }}
    >
      <div
        className={cn(
          "m-[2px] grid size-[44px] place-items-center rounded-[5.25px]",
          "border-border-normal border-1 transition-colors duration-300 ease-out",
          autoReply === AutoReply.Off
            ? "bg-background-surface-4 group-hover:bg-background-surface-3"
            : "bg-background-surface-5 group-hover:bg-background-surface-4",
        )}
      >
        {autoReply === AutoReply.Off && (
          <div
            className={cn(
              "text-text-subtle text-[15.75px] leading-[19px] font-[600]",
              "group-hover:text-text-primary transition-colors",
            )}
          >
            Off
          </div>
        )}
        {autoReply === AutoReply.Random && <Shuffle size={21} />}
        {autoReply === AutoReply.Rotate && <SvgIcon name="rotate" size={21} />}
      </div>
      <div
        className={cn(
          "text-text-body w-[82px] text-center text-[12px] leading-[15px] font-[500] select-none",
        )}
      >
        {autoReply === AutoReply.Off && "Auto-reply off"}
        {autoReply === AutoReply.Random && "Random-reply"}
        {autoReply === AutoReply.Rotate && "Rotating-reply"}
      </div>
    </div>
  );
};

const UserInputsMobile = ({
  userCharacterCardId,
  aiCharacterCardIds = [],
  generateCharacterMessage,
  addUserMessage,
  disabled = false,
  isOpenSettings = false,
  streamingMessageId,
  onStopGenerate,
  autoReply,
  setAutoReply,
}: {
  userCharacterCardId?: UniqueEntityID;
  aiCharacterCardIds?: UniqueEntityID[];
  generateCharacterMessage?: (characterCardId: UniqueEntityID) => void;
  addUserMessage?: (messageContent: string) => void;
  disabled?: boolean;
  isOpenSettings?: boolean;
  streamingMessageId?: UniqueEntityID;
  onStopGenerate?: () => void;
  autoReply: AutoReply;
  setAutoReply: (autoReply: AutoReply) => void;
}) => {
  const {
    isGroupButtonDonNotShowAgain,
    setIsGroupButtonDonNotShowAgain,
    activePage,
  } = useAppStore();

  // Shuffle
  const handleShuffle = useCallback(() => {
    const characterCardIds = [userCharacterCardId, ...aiCharacterCardIds];
    const randomIndex = Math.floor(Math.random() * characterCardIds.length);
    const randomCharacterCardId = characterCardIds[randomIndex];
    randomCharacterCardId && generateCharacterMessage?.(randomCharacterCardId);
  }, [aiCharacterCardIds, generateCharacterMessage, userCharacterCardId]);

  // User message
  const sendButtonRef = useRef<HTMLButtonElement>(null);
  const [messageContent, setMessageContent] = useState<string>("");

  // Tooltip
  const [isOpenTooltip, setIsOpenTooltip] = useState(false);
  const [isOkayButtonClicked, setIsOkayButtonClicked] = useState(false);

  const location = useLocation();
  const isSessionsPage = location.pathname.startsWith("/sessions");

  useEffect(() => {
    setIsOpenTooltip(
      !isGroupButtonDonNotShowAgain &&
        messageContent.length > 0 &&
        isPathWithBasePath(location.pathname, "sessions") &&
        !isOpenSettings &&
        !isOkayButtonClicked,
    );
  }, [
    location.pathname,
    isGroupButtonDonNotShowAgain,
    isOkayButtonClicked,
    isOpenSettings,
    messageContent.length,
  ]);

  return (
    <div
      className={cn(
        "absolute inset-x-0 bottom-0 z-10 rounded-t-xl",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      {/* Transparent background with blur */}
      <div
        className={cn(
          "flex w-full flex-col gap-[16px] rounded-t-xl",
          "bg-background-screen/50 backdrop-blur-md",
          "border-t border-white/10",
        )}
      >
        {/* Character buttons */}
        <div className="px-4 pt-4">
          <TooltipProvider delayDuration={0}>
            <Tooltip
              open={
                !isGroupButtonDonNotShowAgain &&
                messageContent.length > 0 &&
                isPathWithBasePath(location.pathname, "sessions") &&
                !isOpenSettings
              }
            >
              <TooltipTrigger asChild>
                <div className="flex flex-row justify-between p-0">
                  <div
                    className={cn(
                      "flex flex-row justify-start gap-[16px] overflow-auto",
                      streamingMessageId && "pointer-events-none opacity-50",
                    )}
                  >
                    {userCharacterCardId && (
                      <UserInputCharacterButton
                        characterCardId={userCharacterCardId}
                        onClick={() => {
                          generateCharacterMessage?.(userCharacterCardId);
                        }}
                        isUser
                        isHighLighted={
                          !isGroupButtonDonNotShowAgain &&
                          messageContent.length > 0 &&
                          isPathWithBasePath(location.pathname, "sessions") &&
                          !isOpenSettings
                        }
                      />
                    )}
                    {aiCharacterCardIds.map((characterCardId) => (
                      <UserInputCharacterButton
                        key={characterCardId.toString()}
                        characterCardId={characterCardId}
                        onClick={() => {
                          generateCharacterMessage?.(characterCardId);
                        }}
                        isHighLighted={
                          !isGroupButtonDonNotShowAgain &&
                          messageContent.length > 0 &&
                          isPathWithBasePath(location.pathname, "sessions") &&
                          !isOpenSettings
                        }
                      />
                    ))}
                    <UserInputCharacterButton
                      icon={<Shuffle className="min-h-[24px] min-w-[24px]" />}
                      label=""
                      onClick={() => {
                        handleShuffle();
                      }}
                      isHighLighted={
                        !isGroupButtonDonNotShowAgain &&
                        messageContent.length > 0 &&
                        isPathWithBasePath(location.pathname, "sessions") &&
                        !isOpenSettings
                      }
                    />
                  </div>
                  <div className="shrink-0">
                    <UserInputAutoReplyButton
                      autoReply={autoReply}
                      setAutoReply={setAutoReply}
                      characterCount={aiCharacterCardIds?.length || 0}
                    />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                align="center"
                className="max-w-[280px]"
              >
                <div className="flex flex-col">
                  <TypoSmall className="text-text-primary pb-2 font-semibold">
                    Tap to prompt a response
                  </TypoSmall>
                  <TypoTiny className="text-text-primary pb-2">
                    You select which character responds next.
                  </TypoTiny>
                  <div className="flex flex-row justify-end gap-[8px]">
                    <Button
                      variant="outline"
                      className="py-[2px]"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsGroupButtonDonNotShowAgain(true);
                      }}
                    >
                      <div className="px-[8px] text-xs">Don't show again</div>
                    </Button>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Message input */}
        <div className="px-[16px] pb-[32px]">
          <div
            className={cn(
              "flex w-full flex-row items-center gap-3 rounded-full py-[8px]",
              "bg-background-container border-border-divider border backdrop-blur-sm",
            )}
          >
            <div className="flex w-full flex-row items-center justify-between pr-[10px] pl-[10px]">
              <div className="w-full pt-[8px]">
                <TextareaAutosize
                  maxRows={3}
                  placeholder="Type a message"
                  className={cn(
                    "no-resizer w-full rounded-none border-0 bg-transparent p-0 pl-[10px] outline-0",
                    "ring-0 focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0",
                    "h-[21px] min-h-[21px]",
                    "text-[14px] leading-[1.5] font-normal",
                    "text-white placeholder:text-white/60",
                  )}
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendButtonRef.current?.click();
                    }
                  }}
                />
              </div>
              {streamingMessageId ? (
                <button
                  onClick={() => {
                    onStopGenerate?.();
                  }}
                  className={cn(
                    "bg-background-card text-text-primary flex h-[40px] w-[50px] items-center justify-center rounded-full",
                    "hover:bg-background-card hover:text-text-primary",
                  )}
                >
                  <div className="bg-text-primary size-[10px] rounded-[1px]" />
                </button>
              ) : (
                <button
                  ref={sendButtonRef}
                  disabled={messageContent.trim() === ""}
                  onClick={() => {
                    addUserMessage?.(messageContent);
                    setMessageContent("");
                  }}
                  className={cn(
                    "bg-background-card text-text-primary flex h-[40px] w-[50px] items-center justify-center rounded-full",
                    "hover:bg-background-card hover:text-text-primary",
                  )}
                >
                  <Send className="max-h-[18px] max-w-[18px]" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AddPlotCardModal = ({
  onSkip,
  onAdd,
}: {
  onSkip: () => void;
  onAdd: () => void;
}) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return null; // Mobile uses Dialog component instead
  }

  return (
    <div
      className={cn(
        "mx-auto w-[600px] rounded-[8px] p-[24px]",
        "bg-background-container",
        "flex flex-col gap-[24px]",
      )}
    >
      <div className="text-text-primary text-[16px] leading-[24px] font-[400]">
        Would you like to start from a list of scenarios from the plot card?
        <br />
        Your choice will appear as the first message.
      </div>
      <div className="flex flex-row justify-end gap-[8px]">
        <Button variant="outline" size="lg" onClick={onAdd}>
          Add a Plot card
        </Button>
        <Button size="lg" onClick={onSkip}>
          Skip and start
        </Button>
      </div>
    </div>
  );
};

const SelectScenarioModal = ({
  onSkip,
  onAdd,
}: {
  onSkip: () => void;
  onAdd: () => void;
}) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return null; // Mobile uses Dialog component instead
  }

  return (
    <div
      className={cn(
        "mx-auto w-fit rounded-[8px] p-[24px]",
        "bg-background-container",
        "flex flex-col gap-[24px]",
      )}
    >
      <div className="text-text-primary text-[16px] leading-[24px] font-[400]">
        Do you want to choose a scenario to use as your session&apos;s first
        message?
      </div>
      <div className="flex flex-row justify-end gap-[8px]">
        <Button variant="ghost" size="lg" onClick={onSkip}>
          Skip
        </Button>
        <Button size="lg" onClick={onAdd}>
          Add
        </Button>
      </div>
    </div>
  );
};

const SessionMessagesAndUserInputsMobile = ({
  scrollToBottom,
  onAddPlotCard,
  isOpenSettings,
}: {
  scrollToBottom: (options?: ScrollToBottomOptions) => void;
  onAddPlotCard: () => void;
  isOpenSettings: boolean;
}) => {
  const isMobile = useIsMobile();

  // Fetch session
  const queryClient = useQueryClient();
  const selectedSessionId = useSessionStore.use.selectedSessionId();
  const { data: session } = useQuery(
    sessionQueries.detail(selectedSessionId ?? undefined),
  );
  const invalidateSession = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: sessionQueries.detail(selectedSessionId ?? undefined).queryKey,
    });
  }, [queryClient, selectedSessionId]);

  // Generate character message
  const [streamingMessageId, setStreamingMessageId] =
    useState<UniqueEntityID | null>(null);
  const [streamingAgentName, setStreamingAgentName] = useState<string>("");
  const [streamingModelName, setStreamingModelName] = useState<string>("");
  const refStopGenerate = useRef<AbortController | null>(null);
  const generateCharacterMessage = useCallback(
    async (
      characterCardId: UniqueEntityID,
      regenerateMessageId?: UniqueEntityID,
    ) => {
      // Check session
      if (!session) {
        throw new Error("Session not found");
      }

      let streamingMessage: Turn | null = null;
      let streamingContent = "";
      let streamingVariables = {};
      try {
        // Get streaming message
        if (regenerateMessageId) {
          // Get message from database
          const messageOrError =
            await TurnService.getTurn.execute(regenerateMessageId);
          if (messageOrError.isFailure) {
            throw new Error("Message not found");
          }
          streamingMessage = messageOrError.getValue();
        } else {
          // Get character name
          const character = (await CardService.getCard.execute(characterCardId))
            .throwOnFailure()
            .getValue() as CharacterCard;

          // Create new empty message
          const messageOrError = Turn.create({
            sessionId: session.id,
            characterCardId: characterCardId,
            characterName: character.props.name,
            options: [],
          });
          if (messageOrError.isFailure) {
            throw new Error(messageOrError.getError());
          }
          streamingMessage = messageOrError.getValue();
        }

        // Add new empty option
        const emptyOptionOrError = Option.create({
          content: "",
          tokenSize: 0,
        });
        if (emptyOptionOrError.isFailure) {
          throw new Error(emptyOptionOrError.getError());
        }
        streamingMessage.addOption(emptyOptionOrError.getValue());

        // Set query cache
        queryClient.setQueryData(
          turnQueries.detail(streamingMessage.id).queryKey,
          TurnDrizzleMapper.toPersistence(streamingMessage),
        );

        // Add new empty message to session
        if (!regenerateMessageId) {
          await SessionService.addMessage.execute({
            sessionId: session.id,
            message: streamingMessage,
          });
          invalidateSession();
        }

        // Set streaming message id
        setStreamingMessageId(streamingMessage.id);
        scrollToBottom();

        // Execute flow
        refStopGenerate.current = new AbortController();
        const flowResult = executeFlow({
          flowId: session.props.flowId,
          sessionId: session.id,
          characterCardId: characterCardId,
          regenerateMessageId: regenerateMessageId,
          stopSignalByUser: refStopGenerate.current.signal,
        });

        // Stream response
        for await (const response of flowResult) {
          streamingContent = response.content;
          streamingMessage.setContent(streamingContent);
          streamingVariables = response.variables;
          streamingMessage.setVariables(streamingVariables);
          queryClient.setQueryData(
            turnQueries.detail(streamingMessage.id).queryKey,
            TurnDrizzleMapper.toPersistence(streamingMessage),
          );
          setStreamingAgentName(response.agentName ?? "");
          setStreamingModelName(response.modelName ?? "");
          if (!regenerateMessageId) {
            scrollToBottom({
              behavior: "smooth",
            });
          }
          if (response.translations) {
            for (const [lang, translation] of response.translations) {
              streamingMessage.setTranslation(lang, translation);
            }
          }
        }

        // Check empty message
        if (streamingContent.trim() === "") {
          throw new Error("AI returned an empty message.");
        }

        // Update message to database
        await TurnService.updateTurn.execute(streamingMessage);

        // Invalidate turn query
        queryClient.invalidateQueries({
          queryKey: turnQueries.detail(streamingMessage.id).queryKey,
        });
      } catch (error) {
        // Notify error to user
        const parsedError = parseAiSdkErrorMessage(error);
        if (parsedError) {
          toast.error("Failed to generate message", {
            description: parsedError.message,
          });
        } else if (error instanceof Error) {
          if (error.message.includes("Stop generate by user")) {
            toast.info("Generation stopped.");
          } else {
            toast.error("Failed to generate message", {
              description: error.message,
            });
          }
        }
        logger.error("Failed to generate message", error);

        // Check streaming message exists
        if (streamingMessage) {
          // Delete empty streaming message or option
          if (streamingContent.trim() === "") {
            if (regenerateMessageId) {
              // Refetch message
              queryClient.invalidateQueries({
                queryKey: turnQueries.detail(regenerateMessageId).queryKey,
              });
            } else {
              // Delete empty message
              await SessionService.deleteMessage.execute({
                sessionId: session.id,
                messageId: streamingMessage.id,
              });

              // Invalidate session query
              invalidateSession();
            }
          } else {
            // Update message to database
            await TurnService.updateTurn.execute(streamingMessage);

            // Invalidate turn query
            queryClient.invalidateQueries({
              queryKey: turnQueries.detail(streamingMessage.id).queryKey,
            });
          }
        }
      } finally {
        // Reset streaming states
        setStreamingMessageId(null);
        setStreamingAgentName("");
        setStreamingModelName("");
        refStopGenerate.current = null;
      }

      // Invalidate session
      invalidateSession();
    },
    [invalidateSession, queryClient, scrollToBottom, session],
  );

  // Add user message
  const autoReply = session?.autoReply;
  const addUserMessage = useCallback(
    async (messageContent: string) => {
      try {
        // Check session
        if (!session) {
          throw new Error("Session not found");
        }

        // Add user message
        const userMessageOrError = await addMessage({
          sessionId: session.id,
          characterCardId: session.userCharacterCardId,
          defaultCharacterName: "User",
          messageContent: messageContent,
          isUser: true,
        });
        if (userMessageOrError.isFailure) {
          throw new Error(userMessageOrError.getError());
        }

        // Scroll to bottom
        scrollToBottom();

        // Auto reply
        switch (autoReply) {
          // No auto reply
          case AutoReply.Off:
            break;

          // Random character reply
          case AutoReply.Random: {
            const randomIndex = Math.floor(
              Math.random() * session.aiCharacterCardIds.length,
            );
            const randomCharacterCardId =
              session.aiCharacterCardIds[randomIndex];
            generateCharacterMessage(randomCharacterCardId);
            break;
          }

          // All characters reply by order
          case AutoReply.Rotate: {
            for (const charId of session.aiCharacterCardIds) {
              await generateCharacterMessage(charId);
            }
            break;
          }

          default:
            throw new Error("Unknown auto reply");
        }
      } catch (error) {
        if (error instanceof Error) {
          toast.error("Failed to add user message", {
            description: error.message,
          });
        }
        logger.error("Failed to add user message", error);
      }
    },
    [autoReply, generateCharacterMessage, scrollToBottom, session],
  );

  // Set auto reply
  const setAutoReply = useCallback(
    async (autoReply: AutoReply) => {
      if (!session) {
        return;
      }
      session.update({
        autoReply,
      });
      await SessionService.saveSession.execute({ session });

      // Invalidate session query
      queryClient.invalidateQueries({
        queryKey: sessionQueries.detail(selectedSessionId ?? undefined)
          .queryKey,
      });
    },
    [session, queryClient, selectedSessionId],
  );

  // Add plot card modal
  const [plotCard] = useCard<PlotCard>(session?.plotCard?.id);
  const [isOpenAddPlotCardModal, setIsOpenAddPlotCardModal] = useState(false);
  const messageCount = session?.turnIds.length ?? 0;
  const plotCardId = session?.plotCard?.id.toString() ?? "";
  useEffect(() => {
    // Check session has plot card
    if (plotCardId !== "") {
      setIsOpenAddPlotCardModal(false);
      return;
    }

    // Check message ids
    if (messageCount > 0) {
      setIsOpenAddPlotCardModal(false);
      return;
    }

    // Show add plot card modal
    setIsOpenAddPlotCardModal(true);
  }, [messageCount, plotCardId]);

  // Select scenario modal
  const [isOpenSelectScenarioModal, setIsOpenSelectScenarioModal] =
    useState(false);
  const plotCardScenarioCount = plotCard?.props.scenarios?.length ?? 0;
  useEffect(() => {
    logger.debug("[Hook] useEffect: Select scenario modal");

    // Check scenario count
    if (plotCardScenarioCount === 0) {
      setIsOpenSelectScenarioModal(false);
      return;
    }

    // Check message ids
    if (messageCount > 0) {
      setIsOpenSelectScenarioModal(false);
      return;
    }

    // Show select scenario modal
    setIsOpenSelectScenarioModal(true);
  }, [messageCount, plotCardScenarioCount]);

  // Render scenario
  const [renderedScenarios, setRenderedScenarios] = useState<
    {
      name: string;
      description: string;
    }[]
  >([]);
  const sessionUserCardId = session?.userCharacterCardId?.toString() ?? "";
  const sessionAllCards = JSON.stringify(session?.allCards);
  const plotCardScenario = JSON.stringify(plotCard?.props.scenarios);
  const renderScenarios = useCallback(async () => {
    logger.debug("[Hook] useEffect: Render scenario");

    // Check session and plot card
    if (!session || !plotCard || !plotCard.props.scenarios) {
      return;
    }

    // Create context
    const contextOrError = await makeContext({
      session: session,
      characterCardId: session.aiCharacterCardIds[0],
      includeHistory: false,
    });
    if (contextOrError.isFailure) {
      logger.error("Failed to create context", contextOrError.getError());
      return;
    }
    const context = contextOrError.getValue();

    // Replace undefined to variables
    if (!context.char) {
      context.char = {
        id: "{{char.id}}",
        name: "{{char.name}}",
        description: "{{char.description}}",
        example_dialog: "{{char.example_dialog}}",
        entries: [],
      };
    }
    if (!context.user) {
      context.user = {
        id: "{{user.id}}",
        name: "{{user.name}}",
        description: "{{user.description}}",
        example_dialog: "{{user.example_dialog}}",
        entries: [],
      };
    }

    // Render scenarios
    const renderedScenarios = await Promise.all(
      plotCard.props.scenarios.map(
        async (scenario: { name: string; description: string }) => {
          const renderedScenario = await TemplateRenderer.render(
            scenario.description,
            context,
          );
          return {
            name: scenario.name,
            description: renderedScenario,
          };
        },
      ),
    );
    setRenderedScenarios(renderedScenarios);
  }, [sessionUserCardId, sessionAllCards, plotCardScenario]);

  // Select scenario dialog
  const [isOpenSelectScenarioDialog, setIsOpenSelectScenarioDialog] =
    useState(false);
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState<
    number | null
  >(null);
  const [isAddingScenario, setIsAddingScenario] = useState(false);
  const addScenario = useCallback(async () => {
    // Check session
    if (!session) {
      return;
    }
    // Check selected scenario index
    if (typeof selectedScenarioIndex !== "number") {
      return;
    }
    // Get selected scenario
    const scenario = renderedScenarios[selectedScenarioIndex];
    if (!scenario) {
      return;
    }
    try {
      setIsAddingScenario(true);
      // Add scenario
      const scenarioMessageOrError = await addMessage({
        sessionId: session.id,
        messageContent: scenario.description,
        isUser: true,
      });
      if (scenarioMessageOrError.isFailure) {
        toast.error("Failed to add scenario", {
          description: scenarioMessageOrError.getError(),
        });
        return;
      }

      // Invalidate session
      invalidateSession();

      // Close dialog
      setIsOpenSelectScenarioDialog(false);
    } finally {
      setIsAddingScenario(false);
    }
  }, [invalidateSession, renderedScenarios, selectedScenarioIndex, session]);

  // Edit message
  const editMessage = useCallback(
    async (messageId: UniqueEntityID, content: string) => {
      // Get message from DB
      const messageOrError = await TurnService.getTurn.execute(messageId);
      if (messageOrError.isFailure) {
        logger.error("Failed to fetch message", messageOrError.getError());
        return;
      }
      const message = messageOrError.getValue();

      // Set content
      message.setContent(content);

      // Save message to DB
      const savedMessageOrError = await TurnService.updateTurn.execute(message);
      if (savedMessageOrError.isFailure) {
        logger.error("Failed to save message", savedMessageOrError.getError());
        return;
      }

      // Invalidate message
      queryClient.invalidateQueries({
        queryKey: turnQueries.detail(messageId).queryKey,
      });
    },
    [queryClient],
  );

  // Delete message
  const deleteMessage = useCallback(
    async (messageId: UniqueEntityID) => {
      // Check session
      if (!session) {
        return;
      }

      // Delete message from DB
      const deletedMessageOrError = await SessionService.deleteMessage.execute({
        sessionId: session.id,
        messageId: messageId,
      });
      if (deletedMessageOrError.isFailure) {
        logger.error(
          "Failed to delete message",
          deletedMessageOrError.getError(),
        );
        return;
      }

      // Invalidate session query
      invalidateSession();
    },
    [invalidateSession, session],
  );

  // Select option
  const selectOption = useCallback(
    async (messageId: UniqueEntityID, prevOrNext: "prev" | "next") => {
      // Get message from DB
      const messageOrError = await TurnService.getTurn.execute(messageId);
      if (messageOrError.isFailure) {
        logger.error("Failed to fetch message", messageOrError.getError());
        return;
      }
      const message = messageOrError.getValue();

      // Update selected option
      if (prevOrNext === "prev") {
        message.prevOption();
      } else {
        message.nextOption();
      }

      // Save message to DB
      const savedMessageOrError = await TurnService.updateTurn.execute(message);
      if (savedMessageOrError.isFailure) {
        logger.error("Failed to save message", savedMessageOrError.getError());
        return;
      }

      // Invalidate message
      queryClient.invalidateQueries({
        queryKey: turnQueries.detail(messageId).queryKey,
      });
    },
    [queryClient],
  );

  // Generate option
  const generateOption = useCallback(
    async (messageId: UniqueEntityID) => {
      // Get message from database
      const messageOrError = await TurnService.getTurn.execute(messageId);
      if (messageOrError.isFailure) {
        throw new Error(messageOrError.getError());
      }

      // Generate option
      const message = messageOrError.getValue();
      await generateCharacterMessage(message.characterCardId!, messageId);
    },
    [generateCharacterMessage],
  );

  if (!session) {
    return null;
  }

  return (
    <div
      id={`session-${session.id}`}
      className={cn(
        "mx-auto flex max-w-[1196px] flex-col justify-end gap-[10px]",
        isMobile ? "min-h-dvh pt-[20px]" : "min-h-dvh pt-[54px]",
      )}
    >
      <InlineChatStyles
        container={`#session-${session.id}`}
        chatStyles={session.props.chatStyles}
      />

      {/* Spacer to prevent overlapping with session top gradient  */}
      <div className="h-[20px]" />

      {session.turnIds.map((messageId: UniqueEntityID, index: number) => (
        <div
          key={messageId.toString()}
          className={cn(
            isMobile && index === messageCount - 1 && "mb-[210px]", // Add margin for last element on mobile
          )}
        >
          <MessageItem
            messageId={messageId}
            userCharacterCardId={session.userCharacterCardId}
            translationConfig={session.translation}
            disabled={!!streamingMessageId}
            streaming={
              messageId.equals(streamingMessageId)
                ? {
                    agentName: streamingAgentName,
                    modelName: streamingModelName,
                  }
                : undefined
            }
            isLastMessage={index === messageCount - 1}
            editMessage={editMessage}
            deleteMessage={deleteMessage}
            selectOption={selectOption}
            generateOption={generateOption}
          />
        </div>
      ))}
      {isOpenAddPlotCardModal && (
        <AddPlotCardModal
          onSkip={() => {
            setIsOpenAddPlotCardModal(false);
          }}
          onAdd={() => {
            onAddPlotCard();
          }}
        />
      )}
      {isOpenSelectScenarioModal && (
        <SelectScenarioModal
          onSkip={() => {
            setIsOpenSelectScenarioModal(false);
          }}
          onAdd={() => {
            renderScenarios();
            setIsOpenSelectScenarioDialog(true);
          }}
        />
      )}

      {/* Mobile Add Plot Card Dialog */}
      <Dialog
        open={isOpenAddPlotCardModal && isMobile}
        onOpenChange={(open) => {
          if (!open) {
            setIsOpenAddPlotCardModal(false);
          }
        }}
      >
        <DialogContent
          hideClose
          className="bg-background-surface-2 outline-border-light inline-flex w-80 flex-col items-start justify-start gap-2.5 overflow-hidden rounded-lg p-6 outline-1"
        >
          <div className="flex flex-col items-end justify-start gap-6 self-stretch">
            <div className="flex flex-col items-start justify-start gap-2 self-stretch">
              <DialogTitle className="text-text-primary justify-start self-stretch text-xl font-semibold">
                Want to add a plot card?
              </DialogTitle>
              <DialogDescription className="text-text-body justify-start self-stretch text-sm leading-tight font-medium">
                You will not be able to add a scenario, because you have not
                selected a plot card for this session.
              </DialogDescription>
            </div>
            <div className="inline-flex items-center justify-start gap-2">
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => {
                    setIsOpenAddPlotCardModal(false);
                  }}
                >
                  <div className="text-button-background-primary justify-center text-sm leading-tight font-medium">
                    Skip
                  </div>
                </Button>
              </DialogClose>
              <Button
                size="lg"
                onClick={() => {
                  setIsOpenAddPlotCardModal(false);
                  onAddPlotCard();
                }}
              >
                <div className="inline-flex items-center justify-start gap-2">
                  <div className="text-button-foreground-primary justify-center text-sm leading-tight font-semibold">
                    Add plot card
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Select Scenario Prompt Dialog */}
      <Dialog
        open={isOpenSelectScenarioModal && isMobile}
        onOpenChange={(open) => {
          if (!open) {
            setIsOpenSelectScenarioModal(false);
          }
        }}
      >
        <DialogContent hideClose className="max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>Want to add a plot card?</DialogTitle>
            <p className="text-text-body">
              You will not be able to add a scenario, because you have not
              selected a plot card for this session.
            </p>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => {
                  setIsOpenSelectScenarioModal(false);
                }}
              >
                Skip
              </Button>
            </DialogClose>
            <Button
              size="lg"
              onClick={() => {
                renderScenarios();
                setIsOpenSelectScenarioModal(false);
                setIsOpenSelectScenarioDialog(true);
              }}
            >
              Add plot card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isOpenSelectScenarioDialog}
        onOpenChange={(open) => {
          setIsOpenSelectScenarioDialog(open);
          if (!open) {
            setSelectedScenarioIndex(null);
          }
        }}
      >
        <DialogContent
          hideClose
          className="bg-background-surface-2 outline-border-light inline-flex w-80 flex-col items-start justify-start gap-2.5 overflow-hidden rounded-lg p-6 outline-1"
        >
          <div className="flex flex-col items-end justify-start gap-6 self-stretch">
            <div className="flex flex-col items-start justify-start gap-2 self-stretch">
              <DialogTitle className="text-text-primary justify-start self-stretch text-xl font-semibold">
                Scenario
              </DialogTitle>
              <DialogDescription className="text-text-body justify-start self-stretch text-sm leading-tight font-medium">
                Select a scenario for your new session.
              </DialogDescription>
            </div>
            <div className="flex flex-col items-start justify-start gap-4 self-stretch">
              {renderedScenarios &&
                renderedScenarios.map((scenario, index) => (
                  <ScenarioItem
                    key={index}
                    name={scenario.name}
                    contents={scenario.description}
                    active={selectedScenarioIndex === index}
                    onClick={() => {
                      setSelectedScenarioIndex(index);
                    }}
                  />
                ))}
            </div>
            <div className="inline-flex items-center justify-start gap-2">
              <DialogClose asChild>
                <Button
                  size="lg"
                  variant="ghost"
                  className="flex h-auto min-w-20 items-center justify-center gap-2 rounded-[20px] px-3 py-2.5"
                >
                  <div className="text-button-background-primary justify-center text-sm leading-tight font-medium">
                    Cancel
                  </div>
                </Button>
              </DialogClose>
              <Button
                size="lg"
                disabled={
                  typeof selectedScenarioIndex !== "number" || isAddingScenario
                }
                onClick={addScenario}
              >
                <div className="inline-flex items-center justify-start gap-2">
                  {isAddingScenario && (
                    <Loader2 className="min-h-4 min-w-4 animate-spin" />
                  )}
                  Add
                </div>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <UserInputsMobile
        userCharacterCardId={session.userCharacterCardId}
        aiCharacterCardIds={session.aiCharacterCardIds}
        generateCharacterMessage={generateCharacterMessage}
        addUserMessage={addUserMessage}
        isOpenSettings={isOpenSettings}
        disabled={
          isOpenAddPlotCardModal ||
          isOpenSelectScenarioModal ||
          isOpenSelectScenarioDialog
        }
        streamingMessageId={streamingMessageId ?? undefined}
        onStopGenerate={() => {
          refStopGenerate.current?.abort("Stop generate by user");
        }}
        autoReply={session.autoReply}
        setAutoReply={setAutoReply}
      />
    </div>
  );
};

export {
  MessageItemInternalMobile,
  SessionMessagesAndUserInputsMobile,
  UserInputsMobile,
};
