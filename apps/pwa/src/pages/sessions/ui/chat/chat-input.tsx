import { useCallback, useMemo, useRef, useState } from "react";
import { Send, StopCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import ChatCharacterButton from "./chat-character-button";
import ChatAutoReplyButton from "./chat-auto-reply-button";
import ChatShuffleButton from "./chat-shuffle-button";

import { UniqueEntityID } from "@/shared/domain";
import { cn } from "@/shared/lib";
import { AutoReply } from "@/shared/stores/session-store";
import ChatStatsButton from "./chat-stats-button";
import { useExtensionUI } from "@/shared/hooks/use-extension-ui";
import { UserInputCharacterButton } from "./user-input-character-button";
import { sessionQueries } from "@/entities/session/api/query-factory";

interface ChatInputProps {
  sessionId: UniqueEntityID;
  aiCharacterIds: UniqueEntityID[];
  userCharacterId?: UniqueEntityID;
  streamingMessageId?: UniqueEntityID | null;
  autoReply: AutoReply;
  isOpenStats: boolean;
  onOpenStats: (isOpen: boolean) => void;
  onAutoReply: () => void;
  onSendMessage?: (messageContent: string) => void;
  onStopGenerate?: () => void;
  generateCharacterMessage?: (
    characterId: UniqueEntityID,
    regenerateMessageId?: UniqueEntityID,
    triggerType?: string,
  ) => void;
  className?: string;
}

export default function ChatInput({
  sessionId,
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
  const [messageContent, setMessageContent] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch session data for extensions (at component level, not inside extension render)
  const { data: session } = useQuery(sessionQueries.detail(sessionId));

  // Memoize context object to prevent infinite re-renders
  // Include session data so extensions can access it without using hooks
  const extensionContext = useMemo(
    () => ({
      sessionId,
      session, // Pass session data fetched by ChatInput
      disabled: !!streamingMessageId,
      generateCharacterMessage,
    }),
    [sessionId, session, streamingMessageId, generateCharacterMessage]
  );

  // Get extension UI components for the session input buttons slot
  const extensionButtons = useExtensionUI("session-input-buttons", extensionContext);

  const handleShuffle = useCallback(() => {
    const characterCardIds = [userCharacterId, ...aiCharacterIds];
    const randomIndex = Math.floor(Math.random() * characterCardIds.length);
    const randomCharacterCardId = characterCardIds[randomIndex];
    if (randomCharacterCardId) {
      generateCharacterMessage?.(randomCharacterCardId);
    }
  }, [aiCharacterIds, generateCharacterMessage, userCharacterId]);

  const onCharacterButtonClicked = useCallback(() => {
    // Character button clicked - can be used for analytics/tracking
  }, []);

  return (
    <div
      className={cn(
        "relative z-10 w-full max-w-dvw border-t border-fg-default/50 bg-fg-default/10 px-4 py-2 backdrop-blur-3xl md:max-w-4xl md:rounded-2xl md:border md:p-4",
        className,
      )}
    >
      <div className="flex flex-row items-start justify-between gap-1">
        <div className="flex flex-row gap-4 overflow-x-auto">
          {/* Extension buttons (e.g., scenario trigger) */}
          {extensionButtons.map((button) => {
            const buttonProps = button.render();
            // If extension returns null or no props, skip rendering
            if (!buttonProps) return null;
            // Render UserInputCharacterButton with props from extension
            return (
              <UserInputCharacterButton
                key={button.id}
                {...buttonProps}
              />
            );
          })}

          {userCharacterId && (
            <ChatCharacterButton
              characterId={userCharacterId}
              onClick={() => {
                // Pass "user" trigger type to use user start node in flow
                generateCharacterMessage?.(userCharacterId, undefined, "user");
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
          autoReply={autoReply}
          onAutoReply={onAutoReply}
          className="hidden md:flex"
        />
      </div>

      <div className="relative mt-2 md:mt-4">
        <input
          ref={inputRef}
          type="text"
          className={cn(
            "w-full rounded-full border border-fg-default/30 bg-transparent px-4 py-1 pr-25 text-sm text-fg-default placeholder:text-sm placeholder:text-fg-subtle focus:border-fg-default/50 focus:outline-none md:py-2 md:text-base md:placeholder:text-base",
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
              inputRef.current?.focus();
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
            inputRef.current?.focus();
          }}
          className={cn(
            "absolute top-1/2 right-0 flex -translate-y-1/2 items-center gap-2 rounded-full border border-fg-default/30 bg-fg-default/10 px-4 py-1.5 font-semibold text-fg-default transition-colors hover:bg-fg-default/20 md:right-1",
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
