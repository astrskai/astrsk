import { useCallback, useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import delay from "lodash-es/delay";
// import { ArrowDown } from "lucide-react";

import { Session } from "@/entities/session/domain/session";
import { ChatStyles } from "@/entities/session/domain/chat-styles";
import { UniqueEntityID } from "@/shared/domain";
import { cn } from "@/shared/lib";
import ChatMessage from "./chat-message";

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

  // Virtualizer 설정
  const virtualizer = useVirtualizer({
    count: messageCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // 메시지 평균 높이
    overscan: 5, // 버퍼: 위아래 5개씩 더 렌더링
  });

  // 자동 스크롤 (사용자가 맨 아래에 있을 때만)
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

  // 새 메시지 추가 시 자동 스크롤 (맨 아래에 있을 때만)
  useEffect(() => {
    if (isAtBottom && messageCount > 0) {
      scrollToBottom(300);
    }
  }, [messageCount, isAtBottom, scrollToBottom]);

  // 초기 로드 시 맨 아래로 스크롤 (최초 1회만)
  const hasInitialScrolled = useRef(false);

  useEffect(() => {
    if (!hasInitialScrolled.current && messageCount > 0) {
      scrollToBottom(300);
      hasInitialScrolled.current = true;
    }
  }, [messageCount, scrollToBottom]);

  const handleScrollToBottom = () => {
    scrollToBottom();
  };

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
            const isStreaming = streamingMessageId?.equals(messageId);
            // Check if this is the last message
            const isLastMessage =
              virtualItem.index === messageCount - 1 &&
              messageCount > 0 &&
              virtualItem.index !== 0;

            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{ paddingBottom: 4 }}
              >
                <ChatMessage
                  messageId={messageId}
                  userCharacterId={data.userCharacterCardId}
                  translationConfig={data.translation}
                  isStreaming={isStreaming}
                  streamingAgentName={streamingAgentName}
                  streamingModelName={streamingModelName}
                  isLastMessage={isLastMessage}
                  chatStyles={chatStyles}
                  onEdit={onEditMessage}
                  onDelete={onDeleteMessage}
                  onRegenerate={onRegenerateMessage}
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
