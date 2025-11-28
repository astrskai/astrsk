import { Check } from "lucide-react";
import { useState } from "react";

import { cn } from "@/shared/lib";

import { Button, ScrollArea, ScrollBar, UnsavedChangesConfirm } from "@/shared/ui";

const Step = ({
  index,
  label,
  active = false,
  completed = false,
  disabled = false,
  last = false,
  onClick,
}: {
  index: number;
  label: string;
  active?: boolean;
  completed?: boolean;
  disabled?: boolean;
  last?: boolean;
  onClick?: () => void;
}) => {
  return (
    <>
      <button
        className={cn(
          "focus-visible:ring-border-focus inline-flex items-center justify-center gap-2 whitespace-nowrap focus-visible:ring-1 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50",
          "my-[-16px] h-[72px] gap-[16px] rounded-full p-[16px]",
        )}
        disabled={disabled}
        onClick={onClick}
      >
        <div
          className={cn(
            "size-[40px] rounded-full",
            "bg-text-placeholder text-background-container font-[500]",
            "grid place-content-center",
            (active || completed) && "bg-primary-normal",
            "hover:bg-hover",
          )}
        >
          {completed ? (
            <Check className="size-[24px]" />
          ) : (
            <div className="text-[20px]">{index + 1}</div>
          )}
        </div>
        <div className="relative">
          {/* Hidden label for fixed width */}
          <div
            className={cn(
              "invisible hidden text-[20px] leading-[24px] font-[500] xl:block",
              active && "invisible block",
            )}
          >
            {label}
          </div>
          {/* Visible label */}
          <div
            className={cn(
              "absolute top-0 left-1/2 -translate-x-1/2 text-[20px] leading-[24px] font-[400]",
              "xl:block",
              !active && "hidden xl:block",
              completed && "text-text-secondary font-[500]",
              active && "text-text-primary font-[500]",
              disabled && "text-text-secondary",
            )}
          >
            {label}
          </div>
        </div>
      </button>
      {!last && (
        <div className="border-text-placeholder w-[60px] border-b"></div>
      )}
    </>
  );
};

const Stepper = ({
  title,
  description,
  className,
  steps = [],
  validation = {},
  allVisitted = false,
  onCancel,
  onFinish,
  isSave = false,
  showConfirm = true,
}: {
  title?: string;
  description?: string;
  className?: string;
  steps?: {
    label: string;
    content: React.ReactNode;
  }[];
  validation?: {
    [index: number]: boolean;
  };
  allVisitted?: boolean;
  onCancel?: () => void;
  onFinish?: () => Promise<boolean> | boolean | void;
  isSave?: boolean;
  showConfirm?: boolean;
}) => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [visittedSteps, setVisittedSteps] = useState<{
    [index: number]: boolean;
  }>({ 0: true });

  // Check if the current step is the last step
  const isLastStep = () => {
    return steps.length - 1 === activeStep;
  };

  // Check step is disabled
  const isDisabled = (index: number) => {
    // If step is visited, it is not disabled
    if (allVisitted || visittedSteps[index]) {
      return false;
    }

    // If step has never been visited, it should be disabled for stepper toggle
    if (!visittedSteps[index]) {
      return true;
    }

    // If step is not visited, check if all previous steps are valid and visited
    let isPrevStepsValid = validation[0];
    for (let i = 0; i < index; i++) {
      isPrevStepsValid =
        isPrevStepsValid && validation[i] && (allVisitted || visittedSteps[i]);
    }
    return !isPrevStepsValid;
  };

  // Check step is completed
  const isCompleted = (index: number) => {
    return (
      !isDisabled(index) &&
      (allVisitted || visittedSteps[index]) &&
      validation[index]
    );
  };

  // Handle step click
  const goStep = (index: number) => {
    if (isDisabled(index)) {
      return;
    }
    setActiveStep(index);
    setVisittedSteps((prev) => ({ ...prev, [index]: true }));
  };

  // Handle previous step button click
  const handlePrevStep = () => {
    if (activeStep === 0) {
      return;
    }
    goStep(activeStep - 1);
  };

  // Handle next step button click
  const handleNextStep = () => {
    if (isLastStep()) {
      return;
    }
    const nextStep = activeStep + 1;
    setActiveStep(nextStep);
    setVisittedSteps((prev) => ({ ...prev, [nextStep]: true }));
  };

  // Reset stepper states after finish or cancel
  const resetStates = () => {
    setActiveStep(0);
    setVisittedSteps({ 0: true });
  };

  // Unsaved changes confirm
  const [isOpenUnsavedChangesConfirm, setIsOpenUnsavedChangesConfirm] =
    useState(false);

  const handleFinish = async () => {
    if (onFinish) {
      const result = await onFinish();
      // Only reset if result is NOT false
      if (result !== false) {
        resetStates();
      }
    } else {
      resetStates();
    }
  };

  return (
    <div className="bg-surface-raised absolute inset-0 flex flex-col">
      <div
        className={cn(
          "w-full px-[40px] py-[24px]",
          "bg-surface-overlay",
          "flex flex-row items-center justify-between",
        )}
      >
        <div className="flex flex-row gap-[16px]">
          <div className="text-text-secondary text-[24px] leading-[40px] font-[500]">
            {title}
          </div>
          <div className="text-text-primary text-[24px] leading-[40px] font-[600]">
            {description}
          </div>
        </div>
        <div className="flex flex-row gap-[8px]">
          {showConfirm ? (
            <UnsavedChangesConfirm
              open={isOpenUnsavedChangesConfirm}
              onOpenChange={setIsOpenUnsavedChangesConfirm}
              onCloseWithoutSaving={() => {
                onCancel?.();
                resetStates();
                setIsOpenUnsavedChangesConfirm(false);
              }}
            >
              <Button
                variant="ghost"
                className="text-button-background-primary"
                size="lg"
              >
                Cancel
              </Button>
            </UnsavedChangesConfirm>
          ) : (
            <Button
              variant="ghost"
              className="text-button-background-primary"
              size="lg"
              onClick={() => {
                onCancel?.();
                resetStates();
              }}
            >
              Cancel
            </Button>
          )}
          {activeStep > 0 && (
            <Button
              variant="outline"
              className="bg-transparent"
              size="lg"
              onClick={handlePrevStep}
            >
              Previous
            </Button>
          )}
          {isLastStep() ? (
            <Button
              onClick={() => {
                handleFinish();
              }}
              disabled={validation[activeStep] !== true}
              size="lg"
            >
              {isSave ? "Save" : "Finish"}
            </Button>
          ) : (
            <Button
              onClick={handleNextStep}
              disabled={validation[activeStep] !== true}
              size="lg"
            >
              Next
            </Button>
          )}
        </div>
      </div>
      <ScrollArea className={cn(className)}>
        <div className="bg-surface-raised sticky top-0 z-10 py-[40px] pb-[60px]">
          {steps.length > 1 && (
            <div className="mx-auto flex flex-row items-center justify-center">
              {steps.map((step, index) => (
                <Step
                  key={index}
                  index={index}
                  label={step.label}
                  active={activeStep === index}
                  completed={isCompleted(index)}
                  disabled={isDisabled(index)}
                  last={index === steps.length - 1}
                  onClick={() => {
                    goStep(index);
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <div className="flex min-h-full flex-row justify-center pb-8">
          {steps.at(activeStep)?.content}
        </div>
        <ScrollBar orientation="vertical" />
        {/* <ScrollBar orientation="horizontal"/> */}
      </ScrollArea>
    </div>
  );
};

export { Stepper };
