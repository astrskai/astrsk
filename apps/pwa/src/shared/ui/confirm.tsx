import React from "react";

import { Button } from "@/shared/ui";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui";

const Confirm = ({
  open,
  onOpenChange,
  children,
  title,
  description,
  confirmLabel = "Ok",
  onConfirm,
  footer,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: string;
  onConfirm?: () => void;
  footer?: React.ReactNode;
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent hideClose>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          {footer ?? (
            <>
              <DialogClose asChild>
                <Button size="lg" variant="ghost">Cancel</Button>
              </DialogClose>
              <Button
                onClick={() => {
                  onConfirm?.();
                  onOpenChange?.(false);
                }}
              >
                {confirmLabel}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// TODO:
const UnsavedChangesConfirm = ({
  open,
  onOpenChange,
  children,
  onCloseWithoutSaving,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  onCloseWithoutSaving?: () => void;
}) => {
  return (
    <Confirm
      open={open}
      onOpenChange={onOpenChange}
      title="You've got unsaved changes!"
      description="Are you sure you want to close?"
      footer={
        <>
          <DialogClose asChild>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                onCloseWithoutSaving?.();
                onOpenChange?.(false);
              }}
            >
              Close without saving
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button size="lg">Go back</Button>
          </DialogClose>
        </>
      }
    >
      {children}
    </Confirm>
  );
};

const DeleteConfirm = ({
  open,
  onOpenChange,
  title = "Are you sure?",
  description,
  children,
  deleteLabel = "Yes, delete",
  onDelete,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  deleteLabel?: string;
  onDelete?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}) => {
  return (
    <Confirm
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={
        <>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="lg"
              onClick={(e) => {
                e.stopPropagation();
                onOpenChange?.(false);
              }}
            >
              Cancel
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              variant="destructive"
              size="lg"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(e);
                onOpenChange?.(false);
              }}
            >
              {deleteLabel}
            </Button>
          </DialogClose>
        </>
      }
    >
      {children}
    </Confirm>
  );
};

export { Confirm, DeleteConfirm, UnsavedChangesConfirm };
