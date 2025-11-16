import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useVirtualizer, VirtualItem } from "@tanstack/react-virtual";
import delay from "lodash-es/delay";

// import { ArrowDown } from "lucide-react";

import { Session } from "@/entities/session/domain/session";
import { ChatStyles } from "@/entities/session/domain/chat-styles";
import { UniqueEntityID } from "@/shared/domain";
import { cn } from "@/shared/lib";
import { Loading } from "@/shared/ui";
import ChatMessage from "./chat-message";
import { turnQueries } from "@/entities/turn/api/turn-queries";
import ChatScenarioMessage from "./chat-scenario-message";

interface ChatMessageListProps {
  data: Session;
  streamingMessageId?: UniqueEntityID | null;
  streamingAgentName?: string;
  streamingModelName?: string;
  chatStyles?: ChatStyles;
  onEditMessage?: (messageId: UniqueEntityID, content: string) => void;
  onDeleteMessage?: (messageId: UniqueEntityID) => void;
  onRegenerateMessage?: (messageId: UniqueEntityID) => void;
  className?: string;
}

interface RenderMessageProps {
  session: Session;
  messageId: UniqueEntityID;
  virtualItem: VirtualItem;
  messageCount: number;
  streamingMessageId: UniqueEntityID | null;
  streamingAgentName: string | undefined;
  streamingModelName: string | undefined;
  chatStyles?: ChatStyles;
  onEditMessage?: (messageId: UniqueEntityID, content: string) => void;
  onDeleteMessage?: (messageId: UniqueEntityID) => void;
  onRegenerateMessage?: (messageId: UniqueEntityID) => void;
}

const RenderMessage = ({
  session,
  messageId,
  virtualItem,
  messageCount,
  streamingMessageId,
  streamingAgentName,
  streamingModelName,
  chatStyles,
  onEditMessage,
  onDeleteMessage,
  onRegenerateMessage,
}: RenderMessageProps) => {
  const {
    data: message,
    isLoading,
    isError,
  } = useQuery(turnQueries.detail(messageId));

  if (isLoading) {
    return (
      <div className="flex h-20 items-center justify-center">
        <Loading />
      </div>
    );
  }

  // if (isError || !message) {
  //   return (
  //     <div className="px-4 pb-4">
  //       <div className="mx-auto flex h-10 max-w-lg items-center justify-center rounded-lg bg-gray-800/20 text-sm text-red-500 backdrop-blur-md">
  //         Failed to load message
  //       </div>
  //     </div>
  //   );
  // }

  const isStreaming = streamingMessageId?.equals(messageId);

  const isLastMessage =
    virtualItem.index === messageCount - 1 && messageCount > 0;

  return message && !isError ? (
    typeof message.characterCardId === "undefined" &&
    typeof message.characterName === "undefined" ? (
      <ChatScenarioMessage
        content={message.content}
        onEdit={(content) => onEditMessage?.(messageId, content)}
        onDelete={() => onDeleteMessage?.(messageId)}
      />
    ) : (
      <ChatMessage
        message={message}
        userCharacterId={session.userCharacterCardId}
        translationConfig={session.translation}
        isStreaming={isStreaming}
        streamingAgentName={streamingAgentName}
        streamingModelName={streamingModelName}
        isLastMessage={isLastMessage}
        chatStyles={chatStyles}
        onEdit={onEditMessage}
        onDelete={onDeleteMessage}
        onRegenerate={onRegenerateMessage}
      />
    )
  ) : null;
};

export default function ChatMessageList({
  data,
  streamingMessageId,
  streamingAgentName,
  streamingModelName,
  chatStyles,
  onEditMessage,
  onDeleteMessage,
  onRegenerateMessage,
  className,
}: ChatMessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const messageCount = data.turnIds.length;

  // Virtualizer
  const virtualizer = useVirtualizer({
    count: messageCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 5,
  });

  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);

  const scrollToBottom = useCallback(
    (wait: number = 50) => {
      delay(() => {
        virtualizer.scrollToIndex(messageCount - 1, {
          align: "end",
          behavior: "auto",
        });
      }, wait);
    },
    [messageCount, virtualizer],
  );

  useEffect(() => {
    const handleScroll = () => {
      if (!parentRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
      const isBottom = scrollHeight - scrollTop - clientHeight < 100;

      setIsAtBottom(isBottom);
    };

    const element = parentRef.current;
    element?.addEventListener("scroll", handleScroll);
    return () => element?.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isAtBottom && messageCount > 0) {
      scrollToBottom(300);
    }
  }, [messageCount, isAtBottom, scrollToBottom]);

  const hasInitialScrolled = useRef(false);

  useEffect(() => {
    if (!hasInitialScrolled.current && messageCount > 0) {
      scrollToBottom(300);
      hasInitialScrolled.current = true;
    }
  }, [messageCount, scrollToBottom]);

  // const handleScrollToBottom = () => {
  //   scrollToBottom();
  // };

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={cn("custom-scrollbar flex-1", className)}
      style={{
        width: "100%",
        overflowY: "auto",
        contain: "strict",
      }}
    >
      {/* Virtual spacer - creates scroll height */}
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: "100%",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            transform: `translateY(${virtualItems[0]?.start ?? 0}px)`,
          }}
        >
          {virtualItems.map((virtualItem) => {
            const messageId = data.turnIds[virtualItem.index];

            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{ paddingBottom: 4 }}
              >
                <RenderMessage
                  session={data}
                  messageId={messageId}
                  virtualItem={virtualItem}
                  messageCount={messageCount}
                  streamingMessageId={streamingMessageId ?? null}
                  streamingAgentName={streamingAgentName}
                  streamingModelName={streamingModelName}
                  chatStyles={chatStyles}
                  onEditMessage={onEditMessage}
                  onDeleteMessage={onDeleteMessage}
                  onRegenerateMessage={onRegenerateMessage}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Jump to Bottom Button */}
      {/* {!isAtBottom && messageCount > 0 && (
        <button
          type="button"
          onClick={handleScrollToBottom}
          className="absolute right-4 bottom-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 shadow-lg transition-colors hover:bg-blue-600"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="h-5 w-5 text-white" />
        </button>
      )} */}
    </div>
  );
}
