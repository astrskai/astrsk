import { AlertCircle, Copy, Check } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { DialogBase } from "./base";
import { Button, ScrollArea } from "@/shared/ui";
import { useErrorDialogStore } from "@/shared/stores/error-dialog-store";

/**
 * Global Error Details Dialog
 * Controlled by error-dialog-store
 * Use showErrorDetails() to open from anywhere
 */
export function ErrorDetailsDialog() {
  const { isOpen, title, details, close } = useErrorDialogStore();
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Reset copied state when dialog closes
    if (!isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopyDetails = async () => {
    try {
      await navigator.clipboard.writeText(details);
      setCopied(true);
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
        timeoutRef.current = null;
      }, 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  return (
    <DialogBase
      open={isOpen}
      onOpenChange={() => {
        // do nothing
      }}
      title={
        <div className="flex items-center gap-2">
          <div className="bg-status-error/20 flex h-8 w-8 items-center justify-center rounded-full">
            <AlertCircle className="text-status-error h-5 w-5" />
          </div>
          <span>{title}</span>
        </div>
      }
      description="Something went wrong. Here are the details:"
      size="lg"
      isShowCloseButton={false}
      className="border-status-error/30 bg-status-error/30 border"
      content={
        <div className="flex flex-col gap-4">
          {/* Error content */}
          <div className="border-status-error/20 bg-status-error/15 rounded-lg border p-4">
            <ScrollArea className="h-full max-h-[50vh]">
              <pre className="text-fg-muted font-mono text-xs break-words whitespace-pre-wrap">
                {details}
              </pre>
            </ScrollArea>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={handleCopyDetails}>
              {copied ? (
                <>
                  <Check className="text-status-success mr-1.5 h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-4 w-4" />
                  Copy details
                </>
              )}
            </Button>
            <Button onClick={close}>Close</Button>
          </div>
        </div>
      }
    />
  );
}
