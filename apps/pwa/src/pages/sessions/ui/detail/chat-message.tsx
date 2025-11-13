import { memo } from "react";
import { useQuery } from "@tanstack/react-query";

import { Session } from "@/entities/session/domain/session";
import { turnQueries } from "@/entities/turn/api/turn-queries";
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

interface ChatMessageProps {
  messageId: UniqueEntityID;
  userCharacterId?: UniqueEntityID;
  translationConfig?: TranslationConfig;
  isStreaming?: boolean;
  streamingAgentName?: string;
  streamingModelName?: string;
  isLastMessage?: boolean;
}

const ChatMessage = ({
  messageId,
  userCharacterId,
  translationConfig,
  isStreaming,
  streamingAgentName,
  streamingModelName,
  isLastMessage,
}: ChatMessageProps) => {
  const { data: message } = useQuery(turnQueries.detail(messageId));
  const selectedOption = message?.options[message.selectedOptionIndex];
  // TODO: Get message data
  // const message = useMessage(messageId);

  //   console.log("message", message);

  const [character] = useCard<CharacterCard>(message?.characterCardId);
  const [characterImageUrl] = useAsset(character?.props.iconAssetId);

  const content = selectedOption?.content;
  const language = translationConfig?.displayLanguage ?? "none";
  const translation = selectedOption?.translations.get(language);

  if (!message) return null;

  const isUser = userCharacterId
    ? userCharacterId.equals(message?.characterCardId)
    : typeof message.characterCardId === "undefined";

  return (
    <div
      className={cn(
        "flex items-start gap-4 px-4 pb-4",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      <AvatarSimple
        src={characterImageUrl || "/img/message-avatar-default.svg"}
        alt={character?.props.title ?? ""}
        size="xl"
      />

      {/* TODO: Implement message UI */}
      <div
        className={cn(
          "flex flex-col gap-2",
          isUser ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "rounded-full bg-gray-50/10 px-3 py-1 text-base font-medium backdrop-blur-sm",
          )}
        >
          {character?.props.title || "User"}
        </div>
        <ChatBubble
          direction={isUser ? "right" : "left"}
          className={cn(
            "max-w-3xl",
            isUser
              ? "bg-gray-50 text-gray-900"
              : "text-text-secondary bg-gray-800",
          )}
        >
          <Markdown rehypePlugins={[rehypeRaw, rehypeSanitize]}>
            {translation ?? content}
          </Markdown>

          {/* Typing indicator - only show when streaming */}
          {isStreaming && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.3s]"></span>
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.15s]"></span>
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500"></span>
              </div>
              <div>
                {streamingAgentName} {streamingModelName}
                {/* {`${character?.props.title} is typing...`} */}
              </div>
            </div>
          )}

          {isLastMessage && (
            <span className="text-xs text-green-400">Last</span>
          )}
        </ChatBubble>
      </div>
    </div>
  );
};

// Memoization: Prevent re-render if messageId is the same
export default memo(ChatMessage, (prev, next) => {
  return (
    prev.messageId.equals(next.messageId) &&
    prev.isStreaming === next.isStreaming &&
    prev.isLastMessage === next.isLastMessage &&
    prev.streamingAgentName === next.streamingAgentName &&
    prev.streamingModelName === next.streamingModelName
  );
});
