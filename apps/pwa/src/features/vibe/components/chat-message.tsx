import React from "react";

import { Loader2 } from "lucide-react";
import { SimpleMessage } from "../types";
import { EditApprovalMessage } from "./edit-approval-message";
import { AnalysisReadyMessage } from "./analysis-ready-message";

interface ChatMessageProps {
  message: SimpleMessage;
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
  isProcessing?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onApprove,
  onReject,
  onRevert,
  appliedChanges = [],
  isProcessing = false,
}) => {
  const isUser = message.role === "user";
  const isMessageProcessing = message.isProcessing;

  // Check if changes were applied for this message
  const hasAppliedChanges =
    message.sessionId &&
    appliedChanges.some((change) => change.sessionId === message.sessionId);

  // Handle edit approval messages specially
  if (message.type === "edit_approval") {
    return (
      <div className="flex flex-col self-stretch">
        <div className="flex justify-end">
          <div className="w-14 max-w-[600px] px-4 rounded-lg"></div>
        </div>
        <div
          className="flex flex-col gap-4"
          data-state={
            message.status === "pending"
              ? "Default"
              : message.status === "approved"
                ? "Approved"
                : "Revert"
          }
          data-type="Vibe coder"
        >
          <EditApprovalMessage
            message={message}
            onApprove={onApprove!}
            onReject={onReject!}
            onRevert={onRevert!}
            isProcessing={isProcessing}
          />
        </div>
      </div>
    );
  }

  // Handle analysis ready messages specially
  if (message.type === "analysis_ready") {
    return (
      <div className="flex flex-col gap-4 self-stretch">
        <div className="flex justify-end">
          <div className="w-14 max-w-[600px] px-4 rounded-lg"></div>
        </div>
        <div
          className="flex flex-col gap-4"
          data-state="Default"
          data-type="Vibe coder"
        >
          <AnalysisReadyMessage message={message} />
        </div>
      </div>
    );
  }

  return (
    <>
      {message.role === "user" ? (
        <div
          data-state="Default"
          data-type="User"
          className="self-stretch flex flex-col justify-start items-end gap-10"
        >
          <div className="inline-flex justify-end items-start max-w-[600px]">
            <div className="px-4 py-2.5 bg-background-surface-4 rounded-lg flex justify-center items-center gap-2.5">
              <div className="justify-start text-text-primary text-sm font-medium leading-tight">
                {message.content}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          data-state="Default"
          data-type="Vibe coder"
          className="self-stretch flex flex-col justify-start items-start gap-4"
        >
          <div className="self-stretch justify-start text-text-primary text-sm font-medium leading-tight">
            {isMessageProcessing ? (
              <div className="flex items-center gap-2">
                <Loader2 className="min-w-4 min-h-4 animate-spin" />
                <span>{message.content}</span>
              </div>
            ) : (
              message.content
            )}
          </div>

          {/* Simple answer display */}
          {message.analysis?.isSimpleAnswer &&
            message.analysis.simpleAnswer && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  {message.analysis.simpleAnswer}
                </div>
              </div>
            )}
        </div>
      )}
    </>
  );
};
