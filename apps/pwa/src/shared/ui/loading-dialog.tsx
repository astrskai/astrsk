import { Dialog, DialogContent } from "./dialog";
import { Loading } from "./loading";

export interface LoadingDialogProps {
  open: boolean;
  message?: string;
  subtitle?: string;
  /** Callback when user closes the dialog (via X button or ESC) */
  onOpenChange?: (open: boolean) => void;
}

/**
 * Reusable loading dialog for long-running operations
 * Used for imports, exports, processing, etc.
 * 
 * @example
 * <LoadingDialog 
 *   open={isImporting}
 *   message="Importing session..."
 *   subtitle="Session Title"
 *   onOpenChange={(open) => !open && setIsImporting(false)}
 * />
 */
export function LoadingDialog({ 
  open, 
  message = "Loading...", 
  subtitle,
  onOpenChange,
}: LoadingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <Loading />
          <div className="flex flex-col gap-1 text-center">
            <p className="text-fg-muted text-base">
              {message}
            </p>
            {subtitle && (
              <p className="text-fg-subtle text-sm">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
