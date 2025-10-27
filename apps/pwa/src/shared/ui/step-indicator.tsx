import { cn } from "@/shared/lib";

export interface StepConfig<T extends string = string> {
  id: T;
  label: string;
  number: number;
  required: boolean;
}

interface StepIndicatorProps<T extends string = string> {
  steps: StepConfig<T>[];
  currentStep: T;
}

/**
 * Step Indicator Component
 * Shows progress through multi-step wizard
 * Mobile: Horizontal bar with step boxes
 * Desktop: Step circles with connector lines
 *
 * Generic component that can be used for any multi-step wizard
 */
export function StepIndicator<T extends string = string>({
  steps,
  currentStep,
}: StepIndicatorProps<T>) {
  return (
    <div className="border-border border-b px-4 py-3 md:px-8 md:py-4">
      {/* Mobile: Horizontal Bar Layout */}
      <div className="flex gap-1 md:hidden">
        {steps.map((step) => {
          const isActive = step.id === currentStep;
          const currentIndex = steps.findIndex((s) => s.id === currentStep);
          const stepIndex = steps.findIndex((s) => s.id === step.id);
          const isCompleted = currentIndex > stepIndex;

          return (
            <div
              key={step.id}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center rounded-sm px-2 py-2 text-xs font-medium transition-colors",
                isActive && "bg-white font-semibold text-black",
                isCompleted && "bg-primary/30 text-text-primary",
                !isActive &&
                  !isCompleted &&
                  "bg-background-surface-3 text-text-secondary",
              )}
            >
              <span className="truncate">
                {step.number}. {step.label}
                {step.required && (
                  <span className="text-status-required ml-0.5">*</span>
                )}
              </span>
              {/* Bottom border indicator for active step */}
              {isActive && (
                <div className="absolute right-2 bottom-0.5 left-2 h-0.5 rounded-full bg-blue-200" />
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop: Circle & Connector Layout */}
      <div className="hidden items-center justify-center gap-2 md:flex">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted =
            steps.findIndex((s) => s.id === currentStep) > index;

          return (
            <div key={step.id} className="flex items-center">
              {/* Step Circle & Label */}
              <div className="flex flex-col items-center gap-2">
                {/* Circle */}
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                    isActive && "bg-primary-normal text-background-surface-2",
                    isCompleted && "bg-primary/50 text-text-primary",
                    !isActive &&
                      !isCompleted &&
                      "bg-background-surface-4 text-text-secondary",
                  )}
                >
                  {step.number}
                </div>
                {/* Label */}
                <span
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isActive && "text-text-primary",
                    !isActive && "text-text-secondary",
                  )}
                >
                  {step.label}
                  {step.required && (
                    <span className="text-status-required ml-1">*</span>
                  )}
                </span>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-4 h-[2px] w-16 transition-colors",
                    isCompleted ? "bg-primary/50" : "bg-background-surface-4",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
