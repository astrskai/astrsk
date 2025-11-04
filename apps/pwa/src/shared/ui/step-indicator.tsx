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
      {/* Mobile: Thin Horizontal Bars Layout */}
      <div className="flex gap-1 md:hidden">
        {steps.map((step) => {
          const currentIndex = steps.findIndex((s) => s.id === currentStep);
          const stepIndex = steps.findIndex((s) => s.id === step.id);
          const isCompleted = currentIndex >= stepIndex;

          return (
            <div
              key={step.id}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                isCompleted && "bg-blue-200",
                !isCompleted && "bg-background-surface-3",
              )}
            />
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
                    "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors xl:h-12 xl:w-12 xl:text-base",
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
                    "text-sm font-medium transition-colors xl:text-base",
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
