import { useCallback, useState } from "react";
import { Send } from "lucide-react";

import ChatCharacterButton from "./chat-character-button";
import ChatAutoReplyButton from "./chat-auto-reply-button";
import ChatShuffleButton from "./chat-shuffle-button";

import { UniqueEntityID } from "@/shared/domain";
import { cn } from "@/shared/lib";

interface ChatInputProps {
  aiCharacterIds: UniqueEntityID[];
  userCharacterId?: UniqueEntityID;
  generateCharacterMessage?: (characterId: UniqueEntityID) => void;
  streamingMessageId?: UniqueEntityID | null;
  onSendMessage?: (messageContent: string) => void;
  onStopGenerate?: () => void;
  className?: string;
}

export default function ChatInput({
  aiCharacterIds,
  userCharacterId,
  generateCharacterMessage,
  streamingMessageId,
  onSendMessage,
  onStopGenerate,
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
        "relative z-10 w-full max-w-4xl rounded-2xl border border-gray-50/50 bg-gray-50/10 p-4 backdrop-blur-md",
        className,
      )}
    >
      <div className="flex flex-row items-center justify-between gap-1">
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
            onClick={handleShuffle}
            isDisabled={!!streamingMessageId}
          />
        </div>

        <ChatAutoReplyButton />
      </div>

      <div className="relative mt-4">
        <input
          type="text"
          className="w-full rounded-full border border-gray-50/30 bg-transparent px-4 py-2 pr-25 text-gray-50 placeholder:text-gray-300 focus:border-gray-50/50 focus:outline-none"
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
            "absolute top-1/2 right-1 flex -translate-y-1/2 items-center gap-2 rounded-full border border-gray-50/30 bg-gray-50/10 px-4 py-1.5 font-semibold text-white transition-colors hover:bg-gray-50/20",
            !streamingMessageId && messageContent.trim() === ""
              ? "cursor-not-allowed opacity-50"
              : "",
          )}
          disabled={!streamingMessageId && messageContent.trim() === ""}
        >
          <Send className="h-4 w-4" />
          <span className="text-sm">
            {onStopGenerate !== undefined && streamingMessageId
              ? "Stop"
              : "Send"}
          </span>
        </button>
      </div>
    </div>
  );
}
