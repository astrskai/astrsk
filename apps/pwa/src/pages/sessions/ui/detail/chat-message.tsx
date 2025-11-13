import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trash2, Pencil } from "lucide-react";

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
        <div className="group/bubble relative">
          <ChatBubble
            direction={isUser ? "right" : "left"}
            className={cn(
              "max-w-3xl",
              isUser
                ? "bg-gray-50 text-gray-900"
                : "text-text-secondary bg-gray-800",
            )}
          >
            <Markdown
              className="markdown"
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
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

            {/* Typing indicator - only show when streaming */}
            {isStreaming && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.3s]"></span>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.15s]"></span>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500"></span>
                </div>

                <div>
                  {streamingAgentName &&
                    `${streamingAgentName} ${streamingModelName}`}
                </div>
              </div>
            )}

            {isLastMessage && (
              <span className="text-xs text-green-400">Last</span>
            )}
          </ChatBubble>

          {/* Action buttons - shown on hover */}
          <div
            className={cn(
              "absolute z-10 hidden group-hover/bubble:flex",
              isUser ? "right-0" : "left-0",
              isLastMessage ? "bottom-full pb-1" : "top-full pt-1",
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center gap-1 rounded-lg px-2 py-1",
                isUser
                  ? "bg-gray-50/80 text-gray-900"
                  : "bg-gray-800/80 text-gray-200",
              )}
            >
              <button
                type="button"
                className={cn(
                  "flexitems-center justify-center p-1",
                  isUser ? "hover:text-gray-900/70" : "hover:text-gray-200/70",
                )}
                aria-label="Edit"
              >
                <Pencil className="h-5 w-5" />
              </button>
              <button
                type="button"
                className={cn(
                  "flex items-center justify-center p-1",
                  isUser ? "hover:text-gray-900/70" : "hover:text-gray-200/70",
                )}
                aria-label="Delete"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
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
