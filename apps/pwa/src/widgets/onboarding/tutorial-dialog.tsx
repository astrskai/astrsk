import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/shared/lib";
import { useAppStore } from "@/shared/stores/app-store";

interface TutorialDialogProps {
  /**
   * Controlled open state. If provided, dialog is controlled externally.
   * If not provided, uses sessionOnboardingSteps.tutorialVideo (onboarding mode).
   */
  open?: boolean;
  /**
   * Callback when open state changes. Required when using controlled mode.
   */
  onOpenChange?: (open: boolean) => void;
}

/**
 * Tutorial Dialog
 * Shows introductory video explaining how astrsk works.
 *
 * Can be used in two modes:
 * 1. Onboarding mode (default): Controlled by sessionOnboardingSteps.tutorialVideo
 * 2. Controlled mode: Pass `open` and `onOpenChange` props for external control
 */
export function TutorialDialog({ open, onOpenChange }: TutorialDialogProps) {
  const navigate = useNavigate();
  const sessionOnboardingSteps = useAppStore.use.sessionOnboardingSteps();
  const setSessionOnboardingStep = useAppStore.use.setSessionOnboardingStep();

  // Determine if controlled externally or by onboarding state
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : !sessionOnboardingSteps.tutorialVideo;

  const handleClose = () => {
    if (isControlled) {
      onOpenChange?.(false);
    } else {
      // Onboarding mode: mark as complete and navigate
      setSessionOnboardingStep("tutorialVideo", true);
      navigate({ to: "/settings/providers", replace: true });
    }
  };

  const handleOpenChange = (openState: boolean) => {
    if (isControlled) {
      onOpenChange?.(openState);
    } else if (!openState) {
      handleClose();
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
            "data-[state=closed]:duration-200 data-[state=open]:duration-200",
          )}
        />
        <Dialog.Content
          className={cn(
            "fixed inset-0 z-50 flex flex-col items-center justify-center",
            "px-4 md:px-0",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
            "data-[state=closed]:duration-200 data-[state=open]:duration-200",
          )}
        >
          {/* Close Button */}
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Close tutorial"
              className="text-text-subtle absolute top-4 right-4 z-50 cursor-pointer hover:text-white md:top-[34px] md:right-[40px]"
              onClick={handleClose}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </Dialog.Close>

          {/* Content */}
          <div className="flex flex-col items-center gap-6 md:gap-[49px]">
            {/* Header */}
            <div className="flex flex-col items-center gap-2 md:gap-[8px]">
              <Dialog.Title className="text-text-primary text-center text-xl font-semibold leading-tight md:text-[32px] md:font-semibold md:leading-[40px]">
                Two short minutes to understand how astrsk works!
              </Dialog.Title>
              <Dialog.Description className="text-text-placeholder text-center text-sm leading-relaxed md:text-[16px] md:font-normal md:leading-[25.6px]">
                Get a sense of the overall structure of astrsk
              </Dialog.Description>
            </div>

            {/* Video */}
            <div className="aspect-video w-full max-w-[1000px] overflow-hidden rounded-lg md:rounded-[12px]">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/vO6JFL6R_mc?mute=1&cc_load_policy=1&start=0"
                title="astrsk Tutorial"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
