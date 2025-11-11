import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/shared/ui/forms";
import DialogBase from "./base";

interface ConfirmProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  content?: React.ReactNode;
  cancelLabel?: string;
  confirmLabel?: string;
  confirmVariant?: "default" | "destructive";
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

/**
 * DialogConfirm
 *
 * Confirmation dialog built on top of DialogBase
 *
 * @example
 * ```tsx
 * // Controlled mode (recommended)
 * const [isOpen, setIsOpen] = useState(false);
 *
 * return (
 *   <>
 *     <Button onClick={() => setIsOpen(true)}>Delete</Button>
 *
 *     <DialogConfirm
 *       open={isOpen}
 *       onOpenChange={setIsOpen}
 *       title="Are you sure?"
 *       description="This action cannot be undone."
 *       confirmLabel="Yes, delete"
 *       confirmVariant="destructive"
 *       onConfirm={handleDelete}
 *     />
 *   </>
 * );
 *
 * // Uncontrolled mode (with trigger)
 * <DialogConfirm
 *   trigger={<Button>Delete</Button>}
 *   title="Are you sure?"
 *   description="This action cannot be undone."
 *   confirmLabel="Yes, delete"
 *   confirmVariant="destructive"
 *   onConfirm={handleDelete}
 * />
 * ```
 */
export function DialogConfirm({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  content,
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  confirmVariant = "default",
  onConfirm,
  onCancel,
}: ConfirmProps) {
  const handleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    onConfirm?.();
    onOpenChange?.(false);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCancel?.();
    onOpenChange?.(false);
  };

  return (
    <DialogBase
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
      title={title}
      description={description}
      isShowCloseButton={false}
      content={
        <>
          {/* Body Content - Checkbox, Input, etc. */}
          {content && (
            <div className="py-4" onClick={(e) => e.stopPropagation()}>
              {content}
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 flex flex-row justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="ghost" onClick={handleCancel}>
                {cancelLabel}
              </Button>
            </Dialog.Close>
            <Button variant={confirmVariant} onClick={handleConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </>
      }
    />
  );
}
