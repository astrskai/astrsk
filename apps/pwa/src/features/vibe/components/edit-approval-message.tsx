import React, { useState, useMemo } from "react";
import { Button, Editor } from "@/shared/ui";
import { Maximize2, Minimize2 } from "lucide-react";
import { SimpleMessage } from "../types";

interface EditApprovalMessageProps {
  message: SimpleMessage;
  onApprove: (
    messageId: string,
    sessionId: string,
    resourceId: string,
  ) => Promise<void>;
  onReject: (
    messageId: string,
    sessionId: string,
    resourceId: string,
  ) => Promise<void>;
  onRevert: (
    messageId: string,
    sessionId: string,
    resourceId: string,
  ) => Promise<void>;
  isProcessing?: boolean;
}

export const EditApprovalMessage: React.FC<EditApprovalMessageProps> = ({
  message,
  onApprove,
  onReject,
  onRevert,
  isProcessing = false,
}) => {
  // Move all hooks before early returns
  const { editData } = message;

  // Memoize appliedChanges to prevent dependency changes on every render
  const appliedChanges = useMemo(() => {
    return editData?.appliedChanges || [];
  }, [editData?.appliedChanges]);

  const [isExpanded, setIsExpanded] = useState(false);

  const isPending = message.status === "pending";
  const isApproved = message.status === "approved";
  const isRejected = message.status === "rejected";
  const isReverted = message.status === "reverted";

  // Create concatenated operations and changes text for Monaco Editor
  const { operationsText, language } = useMemo(() => {
    // Debug logging

    if (appliedChanges.length > 0) {
      // Try to format as JSON first for syntax highlighting
      try {
        const operationsArray = appliedChanges.map((change, index) => {
          const normalizedOperation =
            change.operation === "append"
              ? "PUT"
              : change.operation.toUpperCase();

          return {
            operation: `Operation ${index + 1}: ${normalizedOperation}`,
            path: change.path || "unknown",
            ...(change.metadata?.changeReason && {
              reason: change.metadata.changeReason,
            }),
            ...(change.metadata?.confidence !== undefined &&
              !isNaN(change.metadata.confidence) && {
                confidence: `${Math.round(change.metadata.confidence * 100)}%`,
              }),
            ...(change.value !== undefined && { value: change.value }),
          };
        });

        return {
          operationsText: JSON.stringify(operationsArray, null, 2),
          language: "json",
        };
      } catch (error) {
        // Fallback to plaintext format if JSON parsing fails
        let text = ``;
        appliedChanges.forEach((change, index) => {
          const normalizedOperation =
            change.operation === "append"
              ? "PUT"
              : change.operation.toUpperCase();
          text += `Operation ${index + 1}: ${normalizedOperation}\n`;
          text += `Path: ${String(change.path || "unknown")}\n`;

          if (change.metadata?.changeReason) {
            text += `Reason: ${String(change.metadata.changeReason)}\n`;
          }

          if (
            change.metadata?.confidence !== undefined &&
            !isNaN(change.metadata.confidence)
          ) {
            text += `Confidence: ${Math.round(change.metadata.confidence * 100)}%\n`;
          }

          if (change.value !== undefined) {
            text += `New Value:\n`;
            if (typeof change.value === "string") {
              text += `${change.value}\n`;
            } else {
              try {
                text += `${JSON.stringify(change.value, null, 2)}\n`;
              } catch (e) {
                text += `${String(change.value)}\n`;
              }
            }
          }

          text += "\n" + "-".repeat(50) + "\n\n";
        });

        return {
          operationsText: text,
          language: "plaintext",
        };
      }
    }

    return {
      operationsText: "No operations available",
      language: "plaintext",
    };
  }, [appliedChanges, message.analysis]);

  // Early return after all hooks are declared
  if (!message.editData || message.type !== "edit_approval") {
    return null;
  }

  const handleApprove = async () => {
    if (message.sessionId && editData!.resourceId) {
      await onApprove(message.id, message.sessionId, editData!.resourceId);
    }
  };

  const handleReject = async () => {
    if (message.sessionId && editData!.resourceId) {
      await onReject(message.id, message.sessionId, editData!.resourceId);
    }
  };

  const handleRevert = async () => {
    if (message.sessionId && editData!.resourceId) {
      await onRevert(message.id, message.sessionId, editData!.resourceId);
    }
  };

  return (
    <>
      {/* Code changes preview */}
      <div className="self-stretch h-64 max-h-64 flex flex-col justify-start items-start gap-1">
        <div className="self-stretch flex-1 rounded-md overflow-hidden border border-border-normal relative">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="absolute top-2 right-2 z-10 w-6 h-6 rounded-sm hover:bg-background-surface-1 flex items-center justify-center transition-colors"
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4 text-text-subtle" />
            ) : (
              <Maximize2 className="w-4 h-4 text-text-subtle" />
            )}
          </button>
          <Editor
            value={operationsText}
            language={language}
            height="100%"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 12,
              lineNumbers: "off",
              folding: false,
              wordWrap: "on",
              fontFamily: "Inter, sans-serif",
            }}
          />
        </div>
      </div>

      {/* Expanded Editor View */}
      {isExpanded && (
        <div className="absolute inset-0 z-20 bg-background-surface-2 p-4">
          <div className="w-full h-full bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal flex flex-col justify-start items-start overflow-hidden relative">
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute top-2 right-2 z-10 w-6 h-6 rounded-sm hover:bg-background-surface-1 flex items-center justify-center transition-colors"
            >
              <Minimize2 className="w-4 h-4 text-text-subtle" />
            </button>
            <div className="w-full h-full">
              <Editor
                value={operationsText}
                language={language}
                height="100%"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  lineNumbers: "on",
                  folding: true,
                  wordWrap: "on",
                  fontFamily: "Inter, sans-serif",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="self-stretch inline-flex justify-start items-start gap-1">
        {isPending && (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleReject}
              disabled={isProcessing}
            >
              Reject
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleApprove}
              disabled={isProcessing}
            >
              Approve and commit
            </Button>
          </>
        )}

        {(isApproved || isRejected) && !isReverted && (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleRevert}
            disabled={isProcessing}
          >
            Revert
          </Button>
        )}
      </div>
    </>
  );
};
