import { useCallback, useState } from "react";
import { Send, StopCircle } from "lucide-react";

import ChatCharacterButton from "./chat-character-button";
import ChatAutoReplyButton from "./chat-auto-reply-button";
import ChatShuffleButton from "./chat-shuffle-button";

import { UniqueEntityID } from "@/shared/domain";
import { cn } from "@/shared/lib";
import { AutoReply } from "@/shared/stores/session-store";
import ChatStatsButton from "./chat-stats-button";

interface ChatInputProps {
  aiCharacterIds: UniqueEntityID[];
  userCharacterId?: UniqueEntityID;
  streamingMessageId?: UniqueEntityID | null;
  autoReply: AutoReply;
  isOpenStats: boolean;
  onOpenStats: (isOpen: boolean) => void;
  onAutoReply: (autoReply: AutoReply) => void;
  onSendMessage?: (messageContent: string) => void;
  onStopGenerate?: () => void;
  generateCharacterMessage?: (characterId: UniqueEntityID) => void;
  className?: string;
}

export default function ChatInput({
  aiCharacterIds,
  userCharacterId,
  streamingMessageId,
  autoReply,
  isOpenStats,
  onOpenStats,
  onAutoReply,
  onSendMessage,
  onStopGenerate,
  generateCharacterMessage,
  className,
}: ChatInputProps) {
  const [isOpenGuide, setIsOpenGuide] = useState<boolean>(false);
  const [messageContent, setMessageContent] = useState<string>("");
  // const shouldShowTooltip =
  // !disabled && (isOpenGuide || !sessionOnboardingSteps.inferenceButton);

  const handleShuffle = useCallback(() => {
    const characterCardIds = [userCharacterId, ...aiCharacterIds];
    const randomIndex = Math.floor(Math.random() * characterCardIds.length);
    const randomCharacterCardId = characterCardIds[randomIndex];
    if (randomCharacterCardId) {
      generateCharacterMessage?.(randomCharacterCardId);
    }
  }, [aiCharacterIds, generateCharacterMessage, userCharacterId]);

  const onCharacterButtonClicked = useCallback(() => {
    setIsOpenGuide(false);
    // setIsGroupButtonDonNotShowAgain(true);
    // Mark inference button onboarding step as completed
    // setSessionOnboardingStep("inferenceButton", true);
  }, []);

  return (
    <div
      className={cn(
        "relative z-10 w-full max-w-4xl border-t border-gray-50/50 bg-gray-50/10 px-4 py-2 backdrop-blur-md md:rounded-2xl md:border md:p-4",
        className,
      )}
    >
      <div className="flex flex-row items-start justify-between gap-1">
        <div className="flex flex-row gap-4">
          {userCharacterId && (
            <ChatCharacterButton
              characterId={userCharacterId}
              onClick={() => {
                generateCharacterMessage?.(userCharacterId);
                onCharacterButtonClicked();
              }}
              isUser
              isDisabled={!!streamingMessageId} // isOpenSelectScenarioModal
              isHighLighted={false}
            />
          )}
          {aiCharacterIds.map((aiCharacterId, index) => (
            <ChatCharacterButton
              key={`ai-character-${aiCharacterId.toString()}-${index}`}
              characterId={aiCharacterId}
              onClick={() => {
                generateCharacterMessage?.(aiCharacterId);
                onCharacterButtonClicked();
              }}
              isDisabled={!!streamingMessageId} // isOpenSelectScenarioModal
              isHighLighted={false}
            />
          ))}

          <ChatShuffleButton
            className="hidden"
            onClick={handleShuffle}
            isDisabled={!!streamingMessageId}
          />
        </div>

        <ChatStatsButton
          className="flex md:hidden"
          isOpen={isOpenStats}
          onOpenStats={onOpenStats}
        />

        <ChatAutoReplyButton
          characterCount={aiCharacterIds.length}
          autoReply={autoReply}
          onAutoReply={onAutoReply}
          className="hidden md:flex"
        />
      </div>

      <div className="relative mt-2 md:mt-4">
        <input
          type="text"
          className={cn(
            "w-full rounded-full border border-gray-50/30 bg-transparent px-4 py-1 pr-25 text-gray-50 placeholder:text-gray-300 focus:border-gray-50/50 focus:outline-none md:py-2",
          )}
          placeholder="Type a message..."
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();

              if (messageContent.trim() === "") return;

              if (streamingMessageId) {
                onStopGenerate?.();
                return;
              }

              onSendMessage?.(messageContent);
              setMessageContent("");
            }
          }}
        />
        <button
          type="button"
          onClick={() => {
            if (!streamingMessageId && messageContent.trim() === "") return;

            if (streamingMessageId) {
              onStopGenerate?.();
              return;
            }

            onSendMessage?.(messageContent);
            setMessageContent("");
          }}
          className={cn(
            "absolute top-1/2 right-0.5 flex -translate-y-1/2 items-center gap-2 rounded-full border border-gray-50/30 bg-gray-50/10 px-4 py-1.5 font-semibold text-white transition-colors hover:bg-gray-50/20 md:right-1",
            !streamingMessageId && messageContent.trim() === ""
              ? "cursor-not-allowed opacity-50"
              : "",
          )}
          disabled={!streamingMessageId && messageContent.trim() === ""}
        >
          {onStopGenerate !== undefined && streamingMessageId ? (
            <>
              <StopCircle className="h-4 w-4" />{" "}
              <span className="hidden text-sm md:block">Stop</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span className="hidden text-sm md:block">Send</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
