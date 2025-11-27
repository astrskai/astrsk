import { Shuffle, Send } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import TextareaAutosize from "@mui/material/TextareaAutosize";

import { UniqueEntityID } from "@/shared/domain";
import { useAssetShared } from "@/shared/hooks/use-asset-shared";
import { useCard } from "@/shared/hooks/use-card";
import { cn } from "@/shared/lib";
import { AutoReply } from "@/shared/stores/session-store";
import { useAppStore } from "@/shared/stores/app-store";
import {
  Avatar,
  Button,
  SubscribeBadge,
  SvgIcon,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui";
import { CharacterCard } from "@/entities/card/domain";

const UserInputCharacterButton = ({
  characterCardId,
  icon,
  label,
  isUser = false,
  onClick = () => {},
  isHighLighted = false,
  isSubscribeBadge = false,
  isDisabled = false,
}: {
  characterCardId?: UniqueEntityID;
  icon?: React.ReactNode;
  label?: string | React.ReactNode;
  isUser?: boolean;
  onClick?: () => void;
  isHighLighted?: boolean;
  isSubscribeBadge?: boolean;
  isDisabled?: boolean;
}) => {
  const [characterCard] = useCard<CharacterCard>(characterCardId);
  const [characterIcon, characterIconIsVideo] = useAssetShared(
    characterCard?.props.iconAssetId,
  );

  if (characterCardId && !characterCard) {
    return null;
  }

  return (
    <div
      className="group relative flex cursor-pointer flex-col items-center gap-[4px]"
      onClick={onClick}
    >
      {isSubscribeBadge && <SubscribeBadge />}
      {characterCard ? (
        <>
          <Avatar
            src={characterIcon}
            alt={characterCard.props.name?.at(0)?.toUpperCase() ?? ""}
            size={48}
            isVideo={characterIconIsVideo}
            isDisabled={isDisabled}
            className={cn(
              isHighLighted &&
                "border-accent-primary border-2 shadow-lg shadow-accent-primary/50",
            )}
          />
          <div
            className={cn(
              "text-fg-default truncate text-[12px] leading-[15px] font-[500]",
              "max-w-[48px]",
            )}
          >
            {characterCard.props.name}
          </div>
          <div
            className={cn(
              "pointer-events-none absolute top-0 left-0 size-[48px]",
              "border-border-emphasis rounded-full border-[3px]",
              "opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100",
            )}
          />
          {isUser && (
            <div className="bg-status-info absolute top-0 right-0 size-[12px] rounded-full border-[2px]" />
          )}
        </>
      ) : (
        <>
          <div
            className={cn(
              "text-fg-default grid size-[48px] place-items-center rounded-full",
              "bg-hover group-hover:bg-active border-border-muted border-1 transition-colors duration-300 ease-out",
              isHighLighted &&
                "border-accent-primary border-2 shadow-lg shadow-accent-primary/50",
            )}
          >
            {icon}
          </div>
          <div
            className={cn(
              "text-fg-muted text-center text-[12px] leading-[15px] font-[500]",
              "max-w-[72px]",
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
          "border-border-muted border-1 transition-colors duration-300 ease-out",
          autoReply === AutoReply.Off
            ? "bg-hover group-hover:bg-surface-overlay"
            : "bg-active group-hover:bg-hover",
        )}
      >
        {autoReply === AutoReply.Off && (
          <div
            className={cn(
              "text-fg-subtle text-[15.75px] leading-[19px] font-[600]",
              "group-hover:text-fg-default transition-colors",
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
          "text-fg-muted w-[105px] text-center text-[12px] leading-[15px] font-[600] select-none",
        )}
      >
        {autoReply === AutoReply.Off ? "Auto-reply off" : "Auto-reply on"}
        <div className="mt-1 min-h-[15px] font-[400]">
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
  streamingMessageId,
  onStopGenerate,
  autoReply,
  setAutoReply,
  onSkip = () => {},
  onAdd = () => {},
  handleGenerateImageForLastTurn = () => {},
  handleGenerateVideoForLastTurn = () => {},
  isGeneratingGlobalImage = false,
  isGeneratingGlobalVideo = false,
  globalVideoStatus = "",
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
  onSkip?: () => void;
  onAdd?: () => void;
  handleGenerateImageForLastTurn?: () => void;
  handleGenerateVideoForLastTurn?: () => void;
  isGeneratingGlobalImage?: boolean;
  isGeneratingGlobalVideo?: boolean;
  globalVideoStatus?: string;
}) => {
  const isGroupButtonDonNotShowAgain =
    useAppStore.use.isGroupButtonDonNotShowAgain();
  const setIsGroupButtonDonNotShowAgain =
    useAppStore.use.setIsGroupButtonDonNotShowAgain();

  // Session onboarding for inference button
  const sessionOnboardingSteps = useAppStore.use.sessionOnboardingSteps();
  const setSessionOnboardingStep = useAppStore.use.setSessionOnboardingStep();

  // Shuffle
  const handleShuffle = useCallback(() => {
    const characterCardIds = [userCharacterCardId, ...aiCharacterCardIds];
    const randomIndex = Math.floor(Math.random() * characterCardIds.length);
    const randomCharacterCardId = characterCardIds[randomIndex];
    if (randomCharacterCardId) {
      generateCharacterMessage?.(randomCharacterCardId);
    }
  }, [aiCharacterCardIds, generateCharacterMessage, userCharacterCardId]);

  // User message
  const sendButtonRef = useRef<HTMLButtonElement>(null);
  const [messageContent, setMessageContent] = useState<string>("");

  // Guide: Select to prompt a response
  const [isOpenGuide, setIsOpenGuide] = useState(false);

  // Show tooltip if either the old guide is open OR the inference button onboarding is not completed
  const shouldShowTooltip =
    !disabled && (isOpenGuide || !sessionOnboardingSteps.inferenceButton);

  const onFocusUserInput = useCallback(() => {
    if (isGroupButtonDonNotShowAgain) {
      return;
    }
    setIsOpenGuide(true);
  }, [isGroupButtonDonNotShowAgain]);

  const onCharacterButtonClicked = useCallback(() => {
    setIsOpenGuide(false);
    setIsGroupButtonDonNotShowAgain(true);
    // Mark inference button onboarding step as completed
    setSessionOnboardingStep("inferenceButton", true);
  }, [setSessionOnboardingStep, setIsGroupButtonDonNotShowAgain]);

  return (
    <div
      className={cn(
        // Desktop: sticky with padding, z-index above scroll area
        "sticky inset-x-0 bottom-0 z-20",
        "px-[56px] pb-[calc(40px+var(--topbar-height))]",
        // Mobile: fixed to bottom with safe area padding
        "md:px-[56px] md:pb-[calc(40px+var(--topbar-height))]",
        "max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:px-0 max-md:pb-0",
      )}
    >
      <div
        className={cn(
          // Desktop styling
          "mx-auto flex w-full max-w-[892px] flex-col gap-[16px] rounded-[40px] p-[24px]",
          "border-border-muted/20 border bg-neutral-700/50 backdrop-blur-xl",
          // Mobile styling: remove rounded corners, full width, adjust padding
          "md:min-w-[400px] md:rounded-[40px] md:p-[24px]",
          "max-md:rounded-none max-md:rounded-t-[20px] max-md:px-[16px] max-md:py-[16px] max-md:pb-[calc(16px+env(safe-area-inset-bottom))]",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <TooltipProvider delayDuration={0}>
          <Tooltip open={shouldShowTooltip}>
            <TooltipTrigger asChild>
              <div className="flex flex-row justify-between p-0">
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
                        onCharacterButtonClicked();
                      }}
                      isUser
                      isDisabled={disabled}
                      isHighLighted={shouldShowTooltip}
                    />
                  )}
                  {aiCharacterCardIds.map((characterCardId) => (
                    <UserInputCharacterButton
                      key={characterCardId.toString()}
                      characterCardId={characterCardId}
                      onClick={() => {
                        generateCharacterMessage?.(characterCardId);
                        onCharacterButtonClicked();
                      }}
                      isDisabled={disabled}
                      isHighLighted={shouldShowTooltip}
                    />
                  ))}
                  <UserInputCharacterButton
                    icon={<Shuffle className="min-h-[24px] min-w-[24px]" />}
                    label="Shuffle"
                    onClick={() => {
                      handleShuffle();
                      onCharacterButtonClicked();
                    }}
                    isHighLighted={shouldShowTooltip}
                  />
                  {/** disabled subscribe */}
                  {/* <div className="bg-border-normal mx-2 h-[48px] w-[1px]" /> */}
                  {/* <UserInputCharacterButton
                    icon={
                      isGeneratingGlobalImage ? (
                        <Loader2 className="min-h-[24px] min-w-[24px] animate-spin" />
                      ) : (
                        <SvgIcon name="image_gen" size={24} />
                      )
                    }
                    label={
                      isGeneratingGlobalImage ? (
                        "Generating"
                      ) : (
                        <>
                          Generate
                          <br />
                          Image
                        </>
                      )
                    }
                    onClick={() => {
                      if (!subscribed) {
                        setIsOpenSubscribeNudge(true);
                        return;
                      }
                      if (!isGeneratingGlobalImage) {
                        handleGenerateImageForLastTurn();
                        onCharacterButtonClicked();
                      }
                    }}
                    isHighLighted={false}
                    isSubscribeBadge={!subscribed}
                  /> */}
                  {/* Generate Video button - HIDDEN in user input */}
                  {/* <UserInputCharacterButton
                    icon={
                      isGeneratingGlobalVideo ? (
                        <Loader2 className="min-w-[24px] min-h-[24px] animate-spin" />
                      ) : (
                        <SvgIcon name="video_gen" size={24} />
                      )
                    }
                    label={
                      isGeneratingGlobalVideo ? (
                        "Generating"
                      ) : (
                        <>
                          Generate
                          <br />
                          Video
                        </>
                      )
                    }
                    onClick={() => {
                      if (!isGeneratingGlobalVideo) {
                        handleGenerateVideoForLastTurn();
                        onCharacterButtonClicked();
                      }
                    }}
                    isHighLighted={false}
                  /> */}
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
              className="bg-surface-raised border-accent-primary mb-[12px] ml-[-16px] border-1 px-[16px] py-[12px] shadow-lg shadow-accent-primary/40"
            >
              <div className="text-fg-default text-[14px] leading-[20px] font-[600]">
                Select to prompt a response
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="p-0">
          <div
            className={cn(
              "flex flex-row items-center rounded-[28px] bg-surface-overlay border-border-default border",
              // Desktop: gap and padding
              "gap-[16px] p-[8px] pl-[32px]",
              // Mobile: smaller gap and padding
              "max-md:gap-[8px] max-md:p-[6px] max-md:pl-[16px]",
              // Desktop: Add border with 50% opacity
              "md:border-border-emphasis/30 md:border-1",
            )}
          >
            <div className="grow">
              <TextareaAutosize
                maxRows={5}
                placeholder="Type a message"
                className={cn(
                  "no-resizer w-full rounded-none border-0 bg-transparent p-0 outline-0",
                  "ring-0 focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0",
                  "text-fg-default placeholder:text-fg-subtle font-normal",
                  // Desktop: size
                  "h-[25.6px] min-h-[25.6px] pt-[4.8px]",
                  "text-[16px] leading-[1.6]",
                  // Mobile: smaller size
                  "max-md:h-[20px] max-md:min-h-[20px] max-md:pt-[2px]",
                  "max-md:text-[14px] max-md:leading-[1.4]",
                )}
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendButtonRef.current?.click();
                  }
                }}
                onFocus={onFocusUserInput}
              />
            </div>
            {streamingMessageId ? (
              <Button
                onClick={() => {
                  onStopGenerate?.();
                }}
                className={cn(
                  "bg-hover text-fg-default shrink-0",
                  "hover:bg-active hover:text-fg-default",
                  "disabled:bg-hover disabled:text-fg-default",
                  // Desktop: height
                  "h-[40px]",
                  // Mobile: smaller height
                  "max-md:h-[32px]",
                )}
              >
                <div
                  className={cn(
                    "bg-fg-default rounded-[1px]",
                    // Desktop
                    "size-[10px]",
                    // Mobile
                    "max-md:size-[8px]",
                  )}
                />
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
                  "bg-hover text-fg-default shrink-0",
                  "hover:bg-active hover:text-fg-default",
                  "disabled:bg-hover disabled:text-fg-default",
                  // Desktop: height
                  "h-[40px]",
                  // Mobile: smaller height and text
                  "max-md:h-[32px] max-md:text-[14px]",
                )}
              >
                <Send
                  className={cn(
                    // Desktop
                    "w-[20px] h-[20px]",
                    // Mobile
                    "max-md:w-[16px] max-md:h-[16px]",
                  )}
                />
                Send
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInputs;
