import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/shared/lib";

interface DialogBaseProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  content: React.ReactNode;
  isShowCloseButton?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "2xl"; // Dialog size (default: "md")
}

const DialogBase = ({
  open,
  onOpenChange,
  trigger,
  title = "",
  description = "",
  content,
  isShowCloseButton = true,
  size = "md",
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
            "bg-dark-surface fixed top-[50%] left-[50%] z-100 max-h-[85dvh] w-[90vw] translate-x-[-50%] translate-y-[-50%] rounded-lg p-6 shadow-lg focus:outline-none",
            sizeClasses[size],
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            "data-[state=closed]:duration-200 data-[state=open]:duration-200",
          )}
        >
          {title && (
            <Dialog.Title className="m-0 text-lg font-semibold text-gray-50 md:text-xl">
              {title}
            </Dialog.Title>
          )}

          <Dialog.Description className="mx-0 mt-2 mb-4 text-sm text-gray-200">
            {description}
          </Dialog.Description>

          {content}

          {isShowCloseButton && (
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="absolute top-3 right-3 inline-flex cursor-pointer items-center text-gray-100 hover:text-gray-50"
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

export default DialogBase;
