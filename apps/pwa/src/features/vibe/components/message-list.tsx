import React, { useRef, useEffect } from 'react';
import { ScrollAreaSimple } from '@/components-v2/ui/scroll-area-simple';
import { ChatMessage } from './chat-message';
import { SimpleMessage } from '../types';
import { cn } from '@/shared/utils';

interface MessageListProps {
  messages: SimpleMessage[];
  resourceId?: string | null;
  resourceName?: string | null;
  onApprove?: (messageId: string, sessionId: string, resourceId: string) => Promise<void>;
  onReject?: (messageId: string, sessionId: string, resourceId: string) => Promise<void>;
  onRevert?: (messageId: string, sessionId: string, resourceId: string) => Promise<void>;
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
    <div className="self-stretch flex-1 px-2 pb-4 inline-flex flex-col justify-start items-start gap-8 min-h-0">
      <ScrollAreaSimple 
        className="self-stretch flex-1 px-2 flex flex-col justify-start items-start min-h-0" 
        ref={scrollRef}
        orientation="vertical"
      >
        {messages.map((message, index) => {
          const isAnalysisRelated = message.type === 'analysis_ready' || 
            (message.type === 'edit_approval' && messages[index - 1]?.type === 'analysis_ready');
          
          return (
            <div key={message.id} className={cn(
              'self-stretch',
              index === 0 ? '' : isAnalysisRelated ? 'mt-4' : 'mt-10'
            )}>
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