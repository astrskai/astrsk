import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { X } from "lucide-react";
import { cn } from "@/shared/lib";

interface DialogBaseProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  content: React.ReactNode;
  footer?: React.ReactNode; // Optional footer (always visible, not scrollable)
  isShowCloseButton?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "2xl"; // Dialog size (default: "md")
  className?: string; // Custom className for dialog content container
  contentClassName?: string; // Custom className for inner content wrapper (default: scrollable)
  closeOnOverlayClick?: boolean; // If true, allows closing by clicking outside (default: true)
  hideTitle?: boolean; // If true, visually hides title (still accessible to screen readers)
}

export const DialogBase = ({
  open,
  onOpenChange,
  trigger,
  title = "",
  description = "",
  content,
  footer,
  isShowCloseButton = true,
  size = "md",
  className,
  contentClassName,
  closeOnOverlayClick = true,
  hideTitle = false,
}: DialogBaseProps) => {
  // Map size to max-width classes
  const sizeClasses = {
    sm: "max-w-sm", // 384px
    md: "max-w-lg", // 512px (default)
    lg: "max-w-2xl", // 672px
    xl: "max-w-4xl", // 896px
    "2xl": "max-w-6xl", // 1152px
  };
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}

      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/70",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
            "data-[state=closed]:duration-200 data-[state=open]:duration-200",
          )}
        />
        <Dialog.Content
          className={cn(
            "bg-surface-raised fixed top-[50%] left-[50%] z-100 flex max-h-[85dvh] w-[90vw] translate-x-[-50%] translate-y-[-50%] flex-col overflow-hidden rounded-lg p-6 shadow-lg focus:outline-none",
            sizeClasses[size],
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            "data-[state=closed]:duration-200 data-[state=open]:duration-200",
            className,
          )}
          // Explicitly set to undefined when no description to suppress Radix warning
          {...(!description && { "aria-describedby": undefined })}
          onPointerDownOutside={(e) => {
            if (!closeOnOverlayClick) {
              e.preventDefault();
            }
          }}
          onInteractOutside={(e) => {
            if (!closeOnOverlayClick) {
              e.preventDefault();
            }
          }}
        >
          {title && hideTitle ? (
            <VisuallyHidden.Root asChild>
              <Dialog.Title>{title}</Dialog.Title>
            </VisuallyHidden.Root>
          ) : title ? (
            <Dialog.Title className="m-0 flex-shrink-0 text-lg font-semibold text-fg-default md:text-xl">
              {title}
            </Dialog.Title>
          ) : null}

          {description && !hideTitle ? (
            <Dialog.Description className="mx-0 mt-2 mb-4 flex-shrink-0 text-sm text-fg-muted">
              {description}
            </Dialog.Description>
          ) : description ? (
            <VisuallyHidden.Root asChild>
              <Dialog.Description>{description}</Dialog.Description>
            </VisuallyHidden.Root>
          ) : null}

          {/* Scrollable Content */}
          <div className={cn("min-h-0 flex-1 overflow-y-auto", contentClassName)}>
            {content}
          </div>

          {/* Fixed Footer (always visible) */}
          {footer && <div className="mt-4 flex-shrink-0">{footer}</div>}

          {isShowCloseButton && (
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="absolute top-3 right-3 z-20 inline-flex cursor-pointer items-center text-fg-muted hover:text-fg-default"
              >
                <X className="h-6 w-6" />
              </button>
            </Dialog.Close>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

