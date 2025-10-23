import React, { useRef, useEffect } from "react";
import { ScrollAreaSimple } from "@/shared/ui/scroll-area-simple";
import { ChatMessage } from "./chat-message";
import { SimpleMessage } from "../types";
import { cn } from "@/shared/lib";

interface MessageListProps {
  messages: SimpleMessage[];
  resourceId?: string | null;
  resourceName?: string | null;
  onApprove?: (
    messageId: string,
    sessionId: string,
    resourceId: string,
  ) => Promise<void>;
  onReject?: (
    messageId: string,
    sessionId: string,
    resourceId: string,
  ) => Promise<void>;
  onRevert?: (
    messageId: string,
    sessionId: string,
    resourceId: string,
  ) => Promise<void>;
  appliedChanges?: { sessionId: string; resourceId: string }[];
  className?: string;
  isProcessing?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  resourceId,
  resourceName,
  onApprove,
  onReject,
  onRevert,
  appliedChanges,
  className,
  isProcessing = false,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="inline-flex min-h-0 flex-1 flex-col items-start justify-start gap-8 self-stretch px-2 pb-4">
      <ScrollAreaSimple
        className="flex min-h-0 flex-1 flex-col items-start justify-start self-stretch px-2"
        ref={scrollRef}
        orientation="vertical"
      >
        {messages.map((message, index) => {
          const isAnalysisRelated =
            message.type === "analysis_ready" ||
            (message.type === "edit_approval" &&
              messages[index - 1]?.type === "analysis_ready");

          return (
            <div
              key={message.id}
              className={cn(
                "self-stretch",
                index === 0 ? "" : isAnalysisRelated ? "mt-4" : "mt-10",
              )}
            >
              <ChatMessage
                message={message}
                resourceId={resourceId}
                resourceName={resourceName}
                onApprove={onApprove}
                onReject={onReject}
                onRevert={onRevert}
                appliedChanges={appliedChanges}
                isProcessing={isProcessing}
              />
            </div>
          );
        })}
      </ScrollAreaSimple>
    </div>
  );
};
