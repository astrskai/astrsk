import { VirtualItem } from "@tanstack/react-virtual";
import { UniqueEntityID } from "@/shared/domain";
import { Session } from "@/entities/session/domain/session";
import { MessageItem } from "./message-components";

interface SessionMessagesProps {
  session: Session;
  virtualItems: VirtualItem[];
  messageCount: number;
  streamingMessageId: UniqueEntityID | null;
  streamingAgentName?: string;
  streamingModelName?: string;
  editMessage: (messageId: UniqueEntityID, content: string) => Promise<void>;
  deleteMessage: (messageId: UniqueEntityID) => Promise<void>;
  selectOption: (
    messageId: UniqueEntityID,
    prevOrNext: "prev" | "next",
  ) => Promise<void>;
  generateOption: (messageId: UniqueEntityID) => Promise<void>;
  handleGenerateVideoFromImage: (
    messageId: UniqueEntityID,
    imageUrl: string,
    prompt: string,
    userPrompt: string,
  ) => Promise<void>;
  measureElement: (element: Element | null) => void;
}

export const SessionMessages = ({
  session,
  virtualItems,
  messageCount,
  streamingMessageId,
  streamingAgentName,
  streamingModelName,
  editMessage,
  deleteMessage,
  selectOption,
  generateOption,
  handleGenerateVideoFromImage,
  measureElement,
}: SessionMessagesProps) => {
  return (
    <>
      {virtualItems.map((virtualItem) => {
        const messageId = session.turnIds[virtualItem.index];
        const isLastMessage = virtualItem.index === messageCount - 1;

        return (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={measureElement}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualItem.start}px)`,
              paddingBottom: 16,
            }}
          >
            <MessageItem
              messageId={messageId}
              userCharacterCardId={session.userCharacterCardId}
              translationConfig={session.translation}
              disabled={!!streamingMessageId}
              streaming={
                messageId.equals(streamingMessageId)
                  ? {
                      agentName: streamingAgentName,
                      modelName: streamingModelName,
                    }
                  : undefined
              }
              isLastMessage={isLastMessage}
              dataSchemaOrder={session.dataSchemaOrder}
              editMessage={editMessage}
              deleteMessage={deleteMessage}
              selectOption={selectOption}
              generateOption={generateOption}
              onGenerateVideoFromImage={handleGenerateVideoFromImage}
            />
          </div>
        );
      })}
    </>
  );
};
