import { Shuffle, Send } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import TextareaAutosize from "@mui/material/TextareaAutosize";

import { UniqueEntityID } from "@/shared/domain";
import { useAssetShared } from "@/shared/hooks/use-asset-shared";
import { useCard } from "@/shared/hooks/use-card";
import { useIsMobile } from "@/shared/hooks/use-mobile";
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
                "border-primary-normal border-2 shadow-[0px_0px_10px_0px_rgba(152,215,249,1.00)]",
            )}
          />
          <div
            className={cn(
              "text-text-primary truncate text-[12px] leading-[15px] font-[500]",
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
              "bg-background-surface-4 group-hover:bg-background-surface-5 border-border-normal border-1 transition-colors duration-300 ease-out",
              isHighLighted &&
                "border-primary-normal border-2 shadow-[0px_0px_10px_0px_rgba(152,215,249,1.00)]",
            )}
          >
            {icon}
          </div>
          <div
            className={cn(
              "text-text-body text-center text-[12px] leading-[15px] font-[500]",
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
          "text-text-body w-[105px] text-center text-[12px] leading-[15px] font-[600] select-none",
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
  const isMobile = useIsMobile();
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
    <div className="sticky inset-x-0 bottom-0 px-[56px] pb-[calc(40px+var(--topbar-height))]">
      <div
        className={cn(
          "mx-auto flex w-full max-w-[892px] min-w-[400px] flex-col gap-[16px] rounded-[40px] p-[24px]",
          "border-text-primary/10 border bg-[#3b3b3b]/50 backdrop-blur-xl",
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
              className="bg-background-surface-2 border-border-selected-primary mb-[12px] ml-[-16px] border-1 px-[16px] py-[12px] shadow-[0px_0px_15px_-3px_rgba(152,215,249,1.00)]"
            >
              <div className="text-text-primary text-[14px] leading-[20px] font-[600]">
                Select to prompt a response
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="p-0">
          <div
            className={cn(
              "flex flex-row items-center gap-[16px] rounded-[28px] p-[8px] pl-[32px]",
              "bg-background-surface-2 border-border-dark border",
              !isMobile && "border-border-selected-inverse/30 border-1", // Add border with 50% opacity for desktop only
            )}
          >
            <div className="grow">
              <TextareaAutosize
                maxRows={5}
                placeholder="Type a message"
                className={cn(
                  "no-resizer w-full rounded-none border-0 bg-transparent p-0 pt-[4.8px] outline-0",
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
                onFocus={onFocusUserInput}
              />
            </div>
            {streamingMessageId ? (
              <Button
                onClick={() => {
                  onStopGenerate?.();
                }}
                className={cn(
                  "bg-background-surface-3 text-text-primary h-[40px]",
                  "hover:bg-background-card hover:text-text-primary",
                  "disabled:bg-background-surface-3 disabled:text-text-primary",
                )}
              >
                <div className="bg-text-primary size-[10px] rounded-[1px]" />
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
                  "bg-background-surface-3 text-text-primary h-[40px]",
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

export default UserInputs;
