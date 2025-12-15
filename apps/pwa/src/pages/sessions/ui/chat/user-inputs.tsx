import { Shuffle, Send, ChartNoAxesColumnIncreasing } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import TextareaAutosize from "@mui/material/TextareaAutosize";

import { UniqueEntityID } from "@/shared/domain";
import { useAssetShared } from "@/shared/hooks/use-asset-shared";
import { useCard } from "@/shared/hooks/use-card";
import { useExtensionUI } from "@/shared/hooks/use-extension-ui";
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

export const UserInputCharacterButton = ({
  characterCardId,
  icon,
  iconSrc,
  label,
  isUser = false,
  onClick = () => {},
  isHighLighted = false,
  isSubscribeBadge = false,
  isDisabled = false,
  showName = true,
  shape = "circle",
}: {
  characterCardId?: UniqueEntityID;
  icon?: React.ReactNode;
  iconSrc?: string; // Custom icon source URL (overrides card's icon)
  label?: string | React.ReactNode;
  isUser?: boolean;
  onClick?: () => void;
  isHighLighted?: boolean;
  isSubscribeBadge?: boolean;
  isDisabled?: boolean;
  showName?: boolean;
  shape?: "circle" | "hexagon";
}) => {
  const [characterCard] = useCard<CharacterCard>(characterCardId);
  const [characterIcon, characterIconIsVideo] = useAssetShared(
    characterCard?.props.iconAssetId,
  );

  if (characterCardId && !characterCard) {
    return null;
  }

  const isHexagon = shape === "hexagon";

  // Use custom iconSrc if provided, otherwise use card's icon
  const avatarSrc = iconSrc || characterIcon;
  const avatarIsVideo = iconSrc ? false : characterIconIsVideo;

  return (
    <div
      className={cn(
        "group relative flex flex-col items-center gap-[4px]",
        isDisabled ? "pointer-events-none cursor-default opacity-50" : "cursor-pointer",
      )}
      onClick={onClick}
    >
      {isSubscribeBadge && <SubscribeBadge />}
      {characterCard ? (
        <>
          {/* Mobile avatar (36px) */}
          <Avatar
            src={avatarSrc}
            alt={characterCard.props.name?.at(0)?.toUpperCase() ?? ""}
            size={36}
            isVideo={avatarIsVideo}
            isDisabled={isDisabled}
            shape={shape}
            className={cn(
              "md:hidden",
              isHighLighted &&
                "border-primary-normal border-2 shadow-[0px_0px_10px_0px_rgba(152,215,249,1.00)]",
            )}
          />
          {/* Desktop avatar (48px) */}
          <Avatar
            src={avatarSrc}
            alt={characterCard.props.name?.at(0)?.toUpperCase() ?? ""}
            size={48}
            isVideo={avatarIsVideo}
            isDisabled={isDisabled}
            shape={shape}
            className={cn(
              "hidden md:flex",
              isHighLighted &&
                "border-primary-normal border-2 shadow-[0px_0px_10px_0px_rgba(152,215,249,1.00)]",
            )}
          />
          <div
            className={cn(
              "text-text-primary text-[10px] leading-[12px] font-[500] md:text-[12px] md:leading-[15px]",
              showName && "max-w-[36px] truncate md:max-w-[48px]",
            )}
          >
            {showName
              ? (characterCard.props.name ?? characterCard.props.title)
              : (label ?? "Scenario")}
          </div>
          {/* Hover overlay - different style for hexagon vs circle */}
          {!isHexagon && (
            <>
              {/* Mobile overlay (36px) */}
              <div
                className={cn(
                  "pointer-events-none absolute top-0 left-0 size-[36px] md:hidden",
                  "border-border-selected-inverse rounded-full border-[3px]",
                  "opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100",
                )}
              />
              {/* Desktop overlay (48px) */}
              <div
                className={cn(
                  "pointer-events-none absolute top-0 left-0 hidden size-[48px] md:block",
                  "border-border-selected-inverse rounded-full border-[3px]",
                  "opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100",
                )}
              />
            </>
          )}
          {isHexagon && (
            <>
              {/* Mobile hexagon overlay (36px) */}
              <div
                className={cn(
                  "pointer-events-none absolute top-0 left-0 size-[36px] md:hidden",
                  "bg-white/10",
                  "opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100",
                )}
                style={{
                  clipPath:
                    "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
                }}
              />
              {/* Desktop hexagon overlay (48px) */}
              <div
                className={cn(
                  "pointer-events-none absolute top-0 left-0 hidden size-[48px] md:block",
                  "bg-white/10",
                  "opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100",
                )}
                style={{
                  clipPath:
                    "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
                }}
              />
            </>
          )}
          {isUser && (
            <div className="bg-status-optional absolute top-0 right-0 size-[12px] rounded-full border-[2px]" />
          )}
        </>
      ) : (
        <>
          {/* Mobile icon (36px) */}
          <div
            className={cn(
              "text-text-primary grid size-[36px] place-items-center md:hidden",
              isHexagon ? "" : "rounded-full",
              "bg-background-surface-4 group-hover:bg-background-surface-5 border-border-normal border-1 transition-colors duration-300 ease-out",
              isHighLighted &&
                "border-primary-normal border-2 shadow-[0px_0px_10px_0px_rgba(152,215,249,1.00)]",
            )}
            style={
              isHexagon
                ? {
                    clipPath:
                      "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
                  }
                : undefined
            }
          >
            {icon}
          </div>
          {/* Desktop icon (48px) */}
          <div
            className={cn(
              "text-text-primary hidden size-[48px] place-items-center md:grid",
              isHexagon ? "" : "rounded-full",
              "bg-background-surface-4 group-hover:bg-background-surface-5 border-border-normal border-1 transition-colors duration-300 ease-out",
              isHighLighted &&
                "border-primary-normal border-2 shadow-[0px_0px_10px_0px_rgba(152,215,249,1.00)]",
            )}
            style={
              isHexagon
                ? {
                    clipPath:
                      "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
                  }
                : undefined
            }
          >
            {icon}
          </div>
          <div
            className={cn(
              "text-text-primary text-[10px] leading-[12px] font-[500] md:text-[12px] md:leading-[15px]",
              showName && "max-w-[36px] truncate md:max-w-[48px]",
            )}
          >
            {showName ? label : (label ?? "Scenario")}
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
        {/* <div className="mt-1 min-h-[15px] font-[400]">
          {autoReply === AutoReply.Random && "Random character"}
          {autoReply === AutoReply.Rotate && "All characters"}
        </div> */}
      </div>
    </div>
  );
};

const UserInputs = ({
  sessionId,
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
  isDataPanelOpen = false,
  onToggleDataPanel,
  showDataPanelButton = false,
}: {
  sessionId?: UniqueEntityID;
  userCharacterCardId?: UniqueEntityID;
  aiCharacterCardIds?: UniqueEntityID[];
  generateCharacterMessage?: (
    characterCardId: UniqueEntityID,
    regenerateMessageId?: UniqueEntityID,
    triggerType?: string
  ) => Promise<void>;
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
  isDataPanelOpen?: boolean;
  onToggleDataPanel?: () => void;
  showDataPanelButton?: boolean;
}) => {
  console.log("[UserInputs] Component rendering, sessionId:", sessionId?.toString());

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

  // Extension UI components for session input buttons
  // Pass isInferencing so extension buttons can disable during generation
  const isInferencing = !!streamingMessageId;
  const extensionButtons = useExtensionUI("session-input-buttons", {
    sessionId,
    disabled: disabled || isInferencing,
    onCharacterButtonClicked,
    generateCharacterMessage,
  });

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
          "border-text-primary/10 border bg-[#3b3b3b]/50 backdrop-blur-xl",
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
                  {extensionButtons.map((component) => (
                    <div key={component.id}>{component.render()}</div>
                  ))}
                  {userCharacterCardId && (
                    <UserInputCharacterButton
                      characterCardId={userCharacterCardId}
                      onClick={() => {
                        // Pass "user" trigger type to use user start node in flow
                        generateCharacterMessage?.(userCharacterCardId, undefined, "user");
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
                <div className="flex shrink-0 items-start gap-2">
                  {/* Mobile Data Panel Button */}
                  {showDataPanelButton && (
                    <button
                      onClick={onToggleDataPanel}
                      className={cn(
                        "md:hidden flex flex-col items-center gap-[4px]",
                      )}
                    >
                      <div
                        className={cn(
                          "m-[2px] grid size-[44px] place-items-center rounded-[5.25px]",
                          "border-border-normal border-1 transition-colors duration-300 ease-out",
                          isDataPanelOpen
                            ? "bg-background-surface-5"
                            : "bg-background-surface-4 hover:bg-background-surface-3",
                        )}
                      >
                        <ChartNoAxesColumnIncreasing
                          className={cn(
                            "h-5 w-5",
                            isDataPanelOpen ? "text-fg-default" : "text-fg-muted",
                          )}
                        />
                      </div>
                      <div className="text-text-body text-center text-[10px] leading-[12px] font-[500]">
                        Stats
                      </div>
                    </button>
                  )}
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
              "flex flex-row items-center rounded-[28px] bg-background-surface-2 border-border-dark border",
              // Desktop: gap and padding
              "gap-[16px] p-[8px] pl-[32px]",
              // Mobile: smaller gap and padding
              "max-md:gap-[8px] max-md:p-[6px] max-md:pl-[16px]",
              // Desktop: Add border with 50% opacity
              "md:border-border-selected-inverse/30 md:border-1",
            )}
          >
            <div className="grow">
              <TextareaAutosize
                maxRows={5}
                placeholder="Type a message"
                className={cn(
                  "no-resizer w-full rounded-none border-0 bg-transparent p-0 outline-0",
                  "ring-0 focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0",
                  "text-text-primary placeholder:text-text-placeholder font-normal",
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
                  "bg-background-surface-3 text-text-primary shrink-0",
                  "hover:bg-background-card hover:text-text-primary",
                  "disabled:bg-background-surface-3 disabled:text-text-primary",
                  // Desktop: height
                  "h-[40px]",
                  // Mobile: smaller height
                  "max-md:h-[32px]",
                )}
              >
                <div
                  className={cn(
                    "bg-text-primary rounded-[1px]",
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
                  "bg-background-surface-3 text-text-primary shrink-0",
                  "hover:bg-background-card hover:text-text-primary",
                  "disabled:bg-background-surface-3 disabled:text-text-primary",
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
