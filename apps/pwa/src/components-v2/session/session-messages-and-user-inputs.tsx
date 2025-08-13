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
import { parseAiSdkErrorMessage } from "@/shared/utils/error-utils";
import { logger } from "@/shared/utils/logger";
import { TemplateRenderer } from "@/shared/utils/template-renderer";

import { useAsset } from "@/app/hooks/use-asset";
import { useCard } from "@/app/hooks/use-card";
import { sessionQueries } from "@/app/queries/session-queries";
import { turnQueries } from "@/app/queries/turn-queries";
import { CardService } from "@/app/services";
import {
  addMessage,
  executeFlow,
  makeContext,
} from "@/app/services/session-play-service";
import { SessionService } from "@/app/services/session-service";
import { TurnService } from "@/app/services/turn-service";
import { Page, useAppStore } from "@/app/stores/app-store";
import { AutoReply, useSessionStore } from "@/app/stores/session-store";
import { Avatar } from "@/components-v2/avatar";
import { useIsMobile } from "@/components-v2/hooks/use-mobile";
import { cn } from "@/components-v2/lib/utils";
import { ScenarioItem } from "@/components-v2/scenario/scenario-item";
import { InlineChatStyles } from "@/components-v2/session/inline-chat-styles";
import { ScrollToBottomOptions } from "@/components-v2/session/session-main";
import { SvgIcon } from "@/components-v2/svg-icon";
import { Button } from "@/components-v2/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components-v2/ui/dialog";
import { toastError } from "@/components-v2/ui/toast-error";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components-v2/ui/tooltip";
import { CharacterCard, PlotCard } from "@/modules/card/domain";
import { TranslationConfig } from "@/modules/session/domain/translation-config";
import { Option } from "@/modules/turn/domain/option";
import { Turn } from "@/modules/turn/domain/turn";
import { TurnDrizzleMapper } from "@/modules/turn/mappers/turn-drizzle-mapper";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const MessageItemInternal = ({
  characterCardId,
  isUser,
  content,
  translation,
  selectedOptionIndex = 0,
  optionsLength = 1,
  disabled,
  streaming,
  streamingAgentName,
  streamingModelName,
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
  onEdit?: (content: string) => Promise<void>;
  onDelete?: () => Promise<void>;
  onPrevOption?: () => Promise<void>;
  onNextOption?: () => Promise<void>;
  onRegenerate?: () => Promise<void>;
}) => {
  // Character card
  const [characterCard] = useCard<CharacterCard>(characterCardId);
  const [icon] = useAsset(characterCard?.props.iconAssetId);

  // Edit message
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<string>(content ?? "");
  const onEditDone = useCallback(async () => {
    await onEdit?.(editedContent);
    setIsEditing(false);
  }, [editedContent, onEdit]);

  return (
    <div className="group/message relative px-[56px]">
      <div
        className={cn(
          "flex gap-[16px] items-start",
          isUser ? "flex-row-reverse" : "flex-row",
          isUser ? "user-chat-style" : "ai-chat-style",
        )}
      >
        <div className="flex flex-col gap-[8px] items-center">
          {characterCardId ? (
            <>
              <Avatar
                src={icon}
                alt={characterCard?.props.name?.at(0)?.toUpperCase() ?? ""}
                size={80}
              />
              <div className="max-w-[80px] truncate font-medium text-[16px] leading-[19px] text-text-primary">
                {characterCard?.props.name}
              </div>
            </>
          ) : (
            <>
              <Avatar src="/img/message-avatar-default.svg" size={80} />
              <div className="max-w-[80px] truncate font-medium text-[16px] leading-[19px] text-text-primary">
                User
              </div>
            </>
          )}
        </div>
        <div
          className={cn(
            "flex flex-col gap-[8px]",
            isUser ? "items-end" : "items-start",
          )}
        >
          <div
            className={cn(
              "max-w-[600px] p-[16px] rounded-[8px] chat-style-chat-bubble",
              // !streaming && "min-w-[300px]",
            )}
          >
            {isEditing && !disabled ? (
              <TextareaAutosize
                className={cn(
                  "w-[568px] p-0 border-0 outline-0 bg-transparent rounded-none no-resizer",
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
              <>
                <Markdown
                  rehypePlugins={[rehypeRaw, rehypeSanitize]}
                  className="chat-style-text"
                  components={{
                    pre: ({ children }) => (
                      <pre
                        tabIndex={0}
                        className="overflow-x-auto max-w-full my-2 p-3 rounded-md"
                      >
                        {children}
                      </pre>
                    ),
                    code: ({ children, className }) => {
                      const isInlineCode = !className;
                      return isInlineCode ? (
                        <code className="px-1 py-0.5 rounded text-sm">
                          {children}
                        </code>
                      ) : (
                        <code className="text-sm whitespace-pre-wrap break-words">
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
          <div
            className={cn(
              "px-[16px] py-[8px] rounded-[8px] flex flex-row items-center",
              "transition-opacity duration-200 ease-in-out opacity-0 group-hover/message:opacity-100",
              "chat-style-chat-bubble message-buttons",
              !streaming && disabled && "!opacity-0",
              streaming && streamingAgentName && "opacity-100",
            )}
          >
            {streaming && streamingAgentName ? (
              <div className="flex flex-row items-center">
                <SvgIcon
                  name="astrsk_symbol"
                  size={28}
                  className="mr-[2px] animate-spin chat-style-text"
                />
                <div className="mr-[8px] font-[400] text-[16px] leading-[25.6px]">
                  {streamingAgentName}
                </div>
                <div className="font-[600] text-[16px] leading-[25.6px]">
                  {streamingModelName}
                </div>
              </div>
            ) : (
              <div className="flex flex-row items-center gap-[12px]">
                {isEditing ? (
                  <Check
                    className="size-[20px] cursor-pointer"
                    onClick={onEditDone}
                  />
                ) : (
                  <SvgIcon
                    name="edit"
                    size={20}
                    className="cursor-pointer"
                    onClick={async () => {
                      setEditedContent(content ?? "");
                      setIsEditing(true);
                    }}
                  />
                )}
                <Trash2
                  className="size-[20px] cursor-pointer"
                  onClick={onDelete}
                />
                <div className="flex flex-row gap-[2px] items-center">
                  <ChevronLeft
                    className="size-[16px] cursor-pointer"
                    onClick={onPrevOption}
                  />
                  <div className="min-w-[24px] text-center font-[600] text-[10px] leading-[12px] select-none">{`${selectedOptionIndex + 1} / ${optionsLength}`}</div>
                  <ChevronRight
                    className="size-[16px] cursor-pointer"
                    onClick={onNextOption}
                  />
                </div>
                <RefreshCcw
                  className="size-[20px] cursor-pointer"
                  onClick={onRegenerate}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ScenarioMessageItem = ({
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
  const onEditDone = useCallback(async () => {
    await onEdit?.(editedContent);
    setIsEditing(false);
  }, [editedContent, onEdit]);

  return (
    <div className="group/scenario px-[56px]">
      <div
        className={cn(
          "relative mx-auto w-full min-w-[400px] max-w-[890px] p-[24px] rounded-[4px]",
          "bg-background-container font-[400] text-[16px] leading-[19px] text-text-placeholder",
          "transition-all duration-200 ease-in-out",
          "group-hover/scenario:inset-ring-1 group-hover/scenario:inset-ring-text-primary",
          isEditing && "inset-ring-1 inset-ring-text-primary",
        )}
      >
        {isEditing ? (
          <TextareaAutosize
            className={cn(
              "w-full p-0 -mb-[4px] border-0 outline-0 bg-transparent rounded-none no-resizer",
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
          <Markdown rehypePlugins={[rehypeRaw, rehypeSanitize]}>
            {content}
          </Markdown>
        )}
        <div className="absolute top-0 right-[-45px] flex flex-col gap-2">
          <div
            className={cn(
              "p-[8px] rounded-[8px] cursor-pointer",
              "bg-background-container text-text-input-subtitle",
              "hover:text-text-primary hover:inset-ring-1 hover:inset-ring-text-primary",
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
          <div
            className={cn(
              "p-[8px] rounded-[8px] cursor-pointer",
              "bg-background-container text-text-input-subtitle",
              "hover:text-text-primary hover:inset-ring-1 hover:inset-ring-text-primary",
              "transition-all duration-200 ease-in-out",
              "opacity-0 group-hover/scenario:block group-hover/scenario:opacity-100",
              isEditing && "opacity-100",
            )}
            onClick={() => {
              if (isEditing) {
                // Cancel editing and restore original content
                setEditedContent(content ?? "");
                setIsEditing(false);
              } else {
                onDelete?.();
              }
            }}
          >
            {isEditing ? <X size={20} /> : <Trash2 size={20} />}
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
      <ScenarioMessageItem
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
    <MessageItemInternal
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
      className="group relative flex flex-col gap-[4px] items-center cursor-pointer"
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
                ? "shadow-[0px_0px_10px_0px_rgba(152,215,249,1.00)] border-2 border-primary-normal"
                : "",
            )}
          />
          <div
            className={cn(
              "truncate text-[12px] leading-[15px] font-[500] text-text-primary",
              "max-w-[48px]",
            )}
          >
            {characterCard.props.name}
          </div>
          <div
            className={cn(
              "absolute top-0 left-0 size-[48px] pointer-events-none",
              "border-[3px] border-border-selected-inverse rounded-full",
              "opacity-0 group-hover:opacity-100 transition-opacity ease-out duration-300",
            )}
          />
          {isUser && (
            <div className="absolute top-0 right-0 border-[2px] rounded-full size-[12px] bg-status-optional" />
          )}
        </>
      ) : (
        <>
          <div
            className={cn(
              "grid place-items-center size-[48px] rounded-full text-text-primary",
              "bg-background-surface-4 group-hover:bg-background-surface-5 transition-colors ease-out duration-300 border-1 border-border-normal",
            )}
          >
            {icon}
          </div>
          <div
            className={cn(
              "truncate font-[500] text-[12px] leading-[15px] text-text-body",
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
      className="group relative flex flex-col gap-[4px] items-center cursor-pointer"
      onClick={() => {
        switch (autoReply) {
          case AutoReply.Off:
            setAutoReply(AutoReply.Random);
            break;
          case AutoReply.Random:
            // Skip Rotate option if only one character
            setAutoReply(hasMultipleCharacters ? AutoReply.Rotate : AutoReply.Off);
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
          "m-[2px] grid place-items-center size-[44px] rounded-[5.25px]",
          "transition-colors ease-out duration-300 border-1 border-border-normal",
          autoReply === AutoReply.Off
            ? "bg-background-surface-4 group-hover:bg-background-surface-3"
            : "bg-background-surface-5 group-hover:bg-background-surface-4",
        )}
      >
        {autoReply === AutoReply.Off && (
          <div
            className={cn(
              "text-[15.75px] text-text-subtle leading-[19px] font-[600]",
              "transition-colors group-hover:text-text-primary",
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
          "w-[105px] font-[600] text-[12px] leading-[15px] text-text-body text-center select-none",
        )}
      >
        {autoReply === AutoReply.Off ? "Auto-reply off" : "Auto-reply on"}
        <div className="min-h-[15px] font-[400] mt-1">
          {autoReply === AutoReply.Random && "Random character"}
          {autoReply === AutoReply.Rotate && "All characters"}
        </div>
      </div>
    </div>
  );
};

const UserInputs = ({
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
  const isMobile = useIsMobile();
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
  useEffect(() => {
    setIsOpenTooltip(
      !isGroupButtonDonNotShowAgain &&
        messageContent.length > 0 &&
        activePage === Page.Sessions &&
        !isOpenSettings &&
        !isOkayButtonClicked,
    );
  }, [
    activePage,
    isGroupButtonDonNotShowAgain,
    isOkayButtonClicked,
    isOpenSettings,
    messageContent.length,
  ]);

  return (
    <div
      className={cn(
        "sticky bottom-0 inset-x-0 pb-[80px] px-[56px]",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <div
        className={cn(
          "mx-auto w-full min-w-[400px] max-w-[892px] p-[24px] rounded-[40px] flex flex-col gap-[16px]",
          "bg-[#3b3b3b]/50 backdrop-blur-xl border border-background-surface-2",
        )}
      >
        <TooltipProvider delayDuration={0}>
          <Tooltip open={isOpenTooltip}>
            <TooltipTrigger asChild>
              <div className="p-0 flex flex-row justify-between">
                <div
                  className={cn(
                    "flex flex-row gap-[16px]",
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
                    />
                  )}
                  {aiCharacterCardIds.map((characterCardId) => (
                    <UserInputCharacterButton
                      key={characterCardId.toString()}
                      characterCardId={characterCardId}
                      onClick={() => {
                        generateCharacterMessage?.(characterCardId);
                      }}
                    />
                  ))}
                  <UserInputCharacterButton
                    icon={<Shuffle className="min-w-[24px] min-h-[24px]" />}
                    label="Shuffle"
                    onClick={() => {
                      handleShuffle();
                    }}
                  />
                </div>
                <div className="shrink-0">
                  <UserInputAutoReplyButton 
                    autoReply={autoReply} 
                    setAutoReply={setAutoReply} 
                    characterCount={aiCharacterCardIds.length} 
                  />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              align="start"
              className="py-[12px] px-[16px] ml-[-16px] mb-[12px]"
            >
              <div className="flex flex-col gap-[8px]">
                <div className="font-[600] text-[14px] leading-[20px] text-text-primary">
                  Tap to prompt a response
                </div>
                <div className="font-[400] text-[12px] leading-[15px] text-text-primary">
                  You orchestrate the interaction —<br />
                  you select which character responds next.
                </div>
                <div className="flex flex-row justify-end gap-[8px]">
                  <Button
                    variant="outline"
                    className="py-[2px] bg-transparent outline-background-surface-light text-background-surface-light"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsGroupButtonDonNotShowAgain(true);
                    }}
                  >
                    Don&apos;t show this again
                  </Button>
                  <Button
                    size="sm"
                    className="py-[2px] bg-background-surface-light text-text-contrast-text"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOkayButtonClicked(true);
                    }}
                  >
                    <div className="px-[12px]">Okay</div>
                  </Button>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="p-0">
          <div
            className={cn(
              "rounded-[28px] p-[8px] pl-[32px] flex flex-row gap-[16px] items-center",
              "bg-background-surface-2 border border-border-dark",
              !isMobile && "border-1 border-border-selected-inverse/30", // Add border with 50% opacity for desktop only
            )}
          >
            <div className="grow">
              <TextareaAutosize
                maxRows={5}
                placeholder="Type a message"
                className={cn(
                  "w-full p-0 pt-[4.8px] border-0 outline-0 bg-transparent rounded-none no-resizer",
                  "ring-0 focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0",
                  "h-[25.6px] min-h-[25.6px]",
                  "text-[16px] leading-[1.6] font-normal",
                  "text-text-primary placeholder:text-text-placeholder",
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
              <Button
                onClick={() => {
                  onStopGenerate?.();
                }}
                className={cn(
                  "h-[40px] bg-background-surface-3 text-text-primary",
                  "hover:bg-background-card hover:text-text-primary",
                  "disabled:bg-background-surface-3 disabled:text-text-primary",
                )}
              >
                <div className="size-[10px] bg-text-primary rounded-[1px]" />
              </Button>
            ) : (
              <Button
                ref={sendButtonRef}
                disabled={messageContent.trim() === ""}
                onClick={() => {
                  addUserMessage?.(messageContent);
                  setMessageContent("");
                }}
                className={cn(
                  "h-[40px] bg-background-surface-3 text-text-primary",
                  "hover:bg-background-card hover:text-text-primary",
                  "disabled:bg-background-surface-3 disabled:text-text-primary",
                )}
              >
                <Send />
                Send
              </Button>
            )}
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
        "mx-auto w-[600px] p-[24px] rounded-[8px]",
        "bg-background-container",
        "flex flex-col gap-[24px]",
      )}
    >
      <div className="font-[400] text-[16px] leading-[24px] text-text-primary">
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
  renderedScenarios,
  onRenderScenarios,
  sessionId,
  plotCardId,
}: {
  onSkip: () => void;
  onAdd: (scenarioIndex: number) => void;
  renderedScenarios: Array<{ name: string; description: string }> | null;
  onRenderScenarios: () => void;
  sessionId: string;
  plotCardId: string;
}) => {
  const isMobile = useIsMobile();
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState<
    number | null
  >(null);
  const [isAddingScenario, setIsAddingScenario] = useState(false);

  // Render scenarios on mount and when plotCardId changes
  useEffect(() => {
    onRenderScenarios();
  }, [plotCardId, onRenderScenarios]);

  // Reset selected index when sessionId or plotCardId changes
  useEffect(() => {
    setSelectedScenarioIndex(null);
  }, [sessionId, plotCardId]);

  // Handle adding scenario
  const handleAddScenario = async () => {
    if (selectedScenarioIndex !== null) {
      setIsAddingScenario(true);
      try {
        await onAdd(selectedScenarioIndex);
      } finally {
        setIsAddingScenario(false);
      }
    }
  };

  if (isMobile) {
    return null; // Mobile uses Dialog component instead
  }

  // Always show scenario selection view directly
  if (renderedScenarios) {
    // Scenario selection view
    return (
      <div className="mx-auto w-[600px] p-6 bg-background-surface-2 rounded-lg outline-1 outline-border-light inline-flex flex-col justify-start items-start gap-2.5 overflow-hidden">
        <div className="self-stretch flex flex-col justify-start items-end gap-6">
          <div className="self-stretch flex flex-col justify-start items-start gap-2">
            <div className="self-stretch justify-start text-text-primary text-2xl font-semibold">
              Scenario
            </div>
            <div className="self-stretch justify-start text-text-body text-base font-medium leading-tight">
              Select a scenario for your new session.
            </div>
          </div>
          <div className="self-stretch flex flex-col justify-start items-start gap-4">
            {renderedScenarios.length > 0 ? (
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
              ))
            ) : (
              <div className="w-full self-stretch inline-flex flex-col justify-start items-start gap-4 py-6">
                <div className="self-stretch text-center justify-start text-text-body text-2xl font-bold">
                  No scenarios yet
                </div>
                <div className="self-stretch text-center justify-start text-background-surface-5 text-base font-medium leading-normal">
                  Start by adding a scenario to your plot card.<br/>
                  Scenarios set the opening scene for your session <br/>
                  — like a narrator kicking things off.
                </div>
              </div>
            )}
          </div>
          <div className="inline-flex justify-start items-center gap-2">
            <Button
              variant="ghost"
              className="min-w-20 px-3 py-2.5 rounded-[20px] flex justify-center items-center gap-2 h-auto"
              onClick={onSkip}
            >
              <div className="justify-center text-button-background-primary text-sm font-medium leading-tight">
                Skip
              </div>
            </Button>
            <Button
              disabled={selectedScenarioIndex === null || isAddingScenario}
              onClick={handleAddScenario}
              className="h-10 min-w-20 px-4 py-2.5 bg-button-background-primary rounded-[20px] inline-flex flex-col justify-center items-center gap-2.5"
            >
              <div className="inline-flex justify-start items-center gap-2">
                {isAddingScenario && (
                  <Loader2 className="animate-spin h-4 w-4" />
                )}
                <div className="justify-center text-button-foreground-primary text-sm font-semibold leading-tight">
                  Add
                </div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state while scenarios are being rendered
  return null;
};

const SessionMessagesAndUserInputs = ({
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
      } catch (error) {
        // Notify error to user
        const parsedError = parseAiSdkErrorMessage(error);
        if (parsedError) {
          toastError({
            title: "Faild to generate message",
            details: parsedError.message,
          });
        } else if (error instanceof Error) {
          if (error.message.includes("Stop generate by user")) {
            toast.info("Generation stopped.");
          } else {
            toastError({
              title: "Faild to generate message",
              details: JSON.stringify(
                {
                  name: error.name,
                  message: error.message,
                  stack: error.stack,
                },
                null,
                2,
              ),
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
            }
          } else {
            // Update message to database
            await TurnService.updateTurn.execute(streamingMessage);
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
          toastError({
            title: "Failed to add user message",
            details: JSON.stringify(
              {
                name: error.name,
                message: error.message,
                stack: error.stack,
              },
              null,
              2,
            ),
          });
        }
        logger.error("Failed to add user message", error);
      }
    },
    [autoReply, generateCharacterMessage, scrollToBottom, session],
  );

  // Set auto reply
  const setAutoReply = useCallback(async (autoReply: AutoReply) => {
    if (!session) {
      return;
    }
    session.update({
      autoReply,
    });
    await SessionService.saveSession.execute({ session });
  }, [session]);

  // Add plot card modal
  const [plotCard] = useCard<PlotCard>(session?.plotCard?.id);
  const [isOpenAddPlotCardModal, setIsOpenAddPlotCardModal] = useState(false);
  const messageCount = session?.turnIds.length ?? 0;
  const plotCardId = session?.plotCard?.id.toString() ?? "";
  const sessionId = session?.id.toString() ?? "";

  useEffect(() => {
    logger.debug("[Hook] useEffect: Add plot card modal");

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
    console.log("sessionId", plotCardId);
    // Check scenario count
    if (plotCardId === "") {
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

  }, [messageCount, plotCardScenarioCount, sessionId, plotCardId]);

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
    if (!session || !plotCard) {
      return;
    }
    
    // If no scenarios, set empty array
    if (!plotCard.props.scenarios || plotCard.props.scenarios.length === 0) {
      setRenderedScenarios([]);
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
      plotCard.props.scenarios.map(async (scenario) => {
        const renderedScenario = await TemplateRenderer.render(
          scenario.description,
          context,
        );
        return {
          name: scenario.name,
          description: renderedScenario,
        };
      }),
    );
    setRenderedScenarios(renderedScenarios);
  }, [sessionUserCardId, sessionAllCards, plotCardScenario]);

  // Select scenario - no longer needed as state is managed within SelectScenarioModal
  const addScenario = useCallback(
    async (scenarioIndex: number) => {
      // Check session
      if (!session) {
        return;
      }
      // Get selected scenario
      const scenario = renderedScenarios?.[scenarioIndex];
      if (!scenario) {
        return;
      }
      try {
        // Add scenario
        const scenarioMessageOrError = await addMessage({
          sessionId: session.id,
          messageContent: scenario.description,
          isUser: true,
        });
        if (scenarioMessageOrError.isFailure) {
          toastError({
            title: "Failed to add scenario",
            details: scenarioMessageOrError.getError(),
          });
          return;
        }

        // Invalidate session
        invalidateSession();

        // Close modal
        setIsOpenSelectScenarioModal(false);
      } finally {
        // Modal handles its own loading state
      }
    },
    [invalidateSession, renderedScenarios, session],
  );

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

      // Invalidate session
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
        "max-w-[1196px] mx-auto flex flex-col gap-[10px] justify-end",
        isMobile ? "min-h-dvh pt-[20px]" : "min-h-dvh pt-[54px]",
      )}
    >
      <InlineChatStyles
        container={`#session-${session.id}`}
        chatStyles={session.props.chatStyles}
      />

      {/* Spacer to prevent overlapping with session top gradient  */}
      <div className="h-[20px]" />

      {session.turnIds.map((messageId, index) => (
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
          onAdd={addScenario}
          renderedScenarios={renderedScenarios}
          onRenderScenarios={renderScenarios}
          sessionId={sessionId}
          plotCardId={plotCardId}
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
          className="w-80 p-6 bg-background-surface-2 rounded-lg outline-1 outline-border-light inline-flex flex-col justify-start items-start gap-2.5 overflow-hidden"
        >
          <div className="self-stretch flex flex-col justify-start items-end gap-6">
            <div className="self-stretch flex flex-col justify-start items-start gap-2">
              <DialogTitle className="self-stretch justify-start text-text-primary text-xl font-semibold">
                What to add a plot card?
              </DialogTitle>
              <DialogDescription className="self-stretch justify-start text-text-body text-sm font-medium leading-tight">
                You will not be able to add a scenario, because you have not
                selected a plot card for this session.
              </DialogDescription>
            </div>
            <div className="inline-flex justify-start items-center gap-2">
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => {
                    setIsOpenAddPlotCardModal(false);
                  }}
                >
                  <div className="justify-center text-button-background-primary text-sm font-medium leading-tight">
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
                <div className="inline-flex justify-start items-center gap-2">
                  <div className="justify-center text-button-foreground-primary text-sm font-semibold leading-tight">
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
            <DialogTitle>What to add a plot card?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-text-body">
              You will not be able to add a scenario, because you have not
              selected a plot card for this session.
            </p>
          </div>
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
                setIsOpenSelectScenarioModal(true);
              }}
            >
              Add plot card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UserInputs
        userCharacterCardId={session.userCharacterCardId}
        aiCharacterCardIds={session.aiCharacterCardIds}
        generateCharacterMessage={generateCharacterMessage}
        addUserMessage={addUserMessage}
        isOpenSettings={isOpenSettings}
        disabled={isOpenAddPlotCardModal || isOpenSelectScenarioModal}
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

export { MessageItemInternal, SessionMessagesAndUserInputs, UserInputs };
