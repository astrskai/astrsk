import React from "react";
import { Button } from "@/shared/ui/forms";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui";

interface ConfirmProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  content?: React.ReactNode;
  cancelLabel?: string;
  confirmLabel?: string;
  confirmVariant?: "default" | "destructive";
  onConfirm?: () => void | Promise<void>;
}

/**
 * ActionConfirm
 *
 * IMPORTANT: Place Dialog outside of onClick area to prevent event bubbling
 *
 * @example
 * ```tsx
 * return (
 *   <>
 *     <div onClick={handleCardClick}>
 *       <Button onClick={(e) => {
 *         e.stopPropagation();
 *         setIsOpen(true);
 *       }}>
 *         Delete
 *       </Button>
 *     </div>
 *
 *     <ActionConfirm
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
 * ```
 */
export const ActionConfirm = ({
  open,
  onOpenChange,
  title,
  description,
  content,
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  confirmVariant = "default",
  onConfirm,
}: ConfirmProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        onPointerDownOutside={(e) => e.stopPropagation()}
        onInteractOutside={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {/* Body Content - Checkbox, Input, etc. */}
        {content && (
          <div className="py-4" onClick={(e) => e.stopPropagation()}>
            {content}
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button
              size="lg"
              variant="ghost"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                onOpenChange?.(false);
              }}
            >
              {cancelLabel}
            </Button>
          </DialogClose>
          <Button
            size="lg"
            variant={confirmVariant}
            onClick={(e) => {
              e.stopPropagation();
              onConfirm?.();
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
