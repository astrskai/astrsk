import { ArrowLeft, Check, X } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

import { cn } from "@/shared/utils";

import { useBackGesture } from "@/shared/hooks/use-back-gesture";
import { Button } from "@/components-v2/ui/button";
import { Progress } from "@/components-v2/ui/progress";

interface StepperMobileProps {
  title?: string;
  stepTitles?: string[]; // Custom titles for each step
  steps: {
    label: string;
    content: React.ReactNode;
  }[];
  validation?: {
    [index: number]: boolean;
  };
  onCancel?: () => void;
  onFinish?: () => Promise<boolean> | boolean | void;
  isOpen?: boolean;
}

export function StepperMobile({
  title = "Create session",
  stepTitles,
  steps = [],
  validation = {},
  onCancel,
  onFinish,
  isOpen = false,
}: StepperMobileProps) {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Check if the current step is valid
  const isCurrentStepValid = validation[activeStep] !== false;
  const isLastStep = activeStep === steps.length - 1;
  const isFirstStep = activeStep === 0;

  // Calculate progress
  const progress = ((activeStep + 1) / steps.length) * 100;

  // Reset step when modal opens/closes and handle body scroll
  useEffect(() => {
    if (!isOpen) {
      setActiveStep(0);
    }

    // Prevent background scrolling when modal is open
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleNext = async () => {
    if (isLastStep) {
      if (onFinish) {
        setIsFinishing(true);
        const success = await onFinish();
        setIsFinishing(false);
        if (success !== false) {
          setActiveStep(0); // Reset on success
        }
      }
    } else {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (isFirstStep) {
      // First step - Cancel
      onCancel?.();
      setActiveStep(0);
    } else {
      // Other steps - Go back
      setActiveStep(activeStep - 1);
    }
  };

  // Handle Android back gesture
  // useBackGesture({ enabled: isOpen, onBack: handleBack });

  // Touch handlers for swipe to dismiss - only on header area
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only allow dragging from the top portion (header area)
    const target = e.target as HTMLElement;
    const isInHeader = target.closest(".stepper-header") !== null;
    if (!isInHeader) return;

    setIsDragging(true);
    setDragStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;

      const y = e.touches[0].clientY;
      setCurrentY(y);

      // Only allow dragging down
      const deltaY = Math.max(0, y - dragStartY);

      if (drawerRef.current) {
        drawerRef.current.style.transform = `translateY(${deltaY}px)`;
      }
    },
    [isDragging, dragStartY],
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);
    const deltaY = currentY - dragStartY;

    if (drawerRef.current) {
      drawerRef.current.style.transform = "";
    }

    // If dragged down more than 100px, close the modal
    if (deltaY > 100) {
      onCancel?.();
      setActiveStep(0);
    }
  }, [isDragging, currentY, dragStartY, onCancel]);

  const currentStep = steps[activeStep];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => {
            onCancel?.();
            setActiveStep(0);
          }}
        />
      )}

      {/* Bottom Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "bg-background-surface-3 rounded-t-xl",
          "h-[95vh] flex flex-col",
          "transform transition-transform duration-300 ease-in-out",
          "shadow-2xl border-t border-border-card",
          isOpen ? "translate-y-0" : "translate-y-full",
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle for dragging */}
        <div className="flex justify-center pb-2 pt-3">
          <div className="w-36 h-[5px] opacity-20 bg-text-primary rounded-[100px]" />
        </div>

        {/* Header */}
        <div className="stepper-header">
          {/* Top bar with title and navigation */}
          <div className="flex items-center h-14 justify-between">
            <Button size="lg" variant="ghost" onClick={handleBack} className="mr-2">
              {isFirstStep ? "Cancel" : "Previous"}
            </Button>
            <h1 className="absolute left-1/2 -translate-x-1/2 flex-1 text-lg font-medium text-center">
              {stepTitles && stepTitles[activeStep]
                ? stepTitles[activeStep]
                : steps[activeStep]?.label || title}
            </h1>
            <Button
              size="lg"
              variant="ghost"
              onClick={handleNext}
              disabled={!isCurrentStepValid || isFinishing}
            >
              {isFinishing ? "Creating..." : isLastStep ? "Create" : "Next"}
            </Button>
          </div>

          {/* Progress bar */}
          {/* <div className="pb-3">
            <Progress value={progress} className="h-1" />
          </div> */}

          {/* Step indicator */}
          {/* <div className="pb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary">
                Step {activeStep + 1} of {steps.length}
              </span>
              <span className="text-sm font-medium">
                {currentStep?.label}
              </span>
            </div>
          </div> */}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto">{currentStep?.content}</div>
        </div>
      </div>
    </>
  );
}
