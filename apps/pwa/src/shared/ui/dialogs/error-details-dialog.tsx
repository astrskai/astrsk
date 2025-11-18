import DialogBase from "./base";
import { Button, ScrollArea } from "@/shared/ui";
import { useErrorDialogStore } from "@/shared/stores/error-dialog-store";

/**
 * Global Error Details Dialog
 * Controlled by error-dialog-store
 * Use showErrorDetails() to open from anywhere
 */
export function ErrorDetailsDialog() {
  const { isOpen, title, details, close } = useErrorDialogStore();

  const handleCopyDetails = () => {
    navigator.clipboard.writeText(details);
  };

  return (
    <DialogBase
      open={isOpen}
      onOpenChange={() => {
        // do nothing
      }}
      title={title}
      description="Error details"
      size="lg"
      content={
        <div className="flex flex-col gap-4">
          {/* Error content */}
          <div className="rounded-lg bg-gray-900/50 p-4">
            <ScrollArea className="h-full max-h-[50vh]">
              <pre className="font-mono text-xs break-words whitespace-pre-wrap text-gray-300">
                {details}
              </pre>
            </ScrollArea>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={handleCopyDetails}>
              Copy details
            </Button>
            <Button onClick={close}>Close</Button>
          </div>
        </div>
      }
    />
  );
}
