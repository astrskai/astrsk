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
      <div className="hidden md:flex md:w-full md:justify-center">
        <div className="w-full max-w-2xl">
        <div className="flex w-full">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted =
              steps.findIndex((s) => s.id === currentStep) > index;

            return (
              <div key={step.id} className="flex flex-1 flex-col items-center">
                {/* Circle and Connector Row */}
                <div className="flex w-full items-center">
                  {/* Connector Line - Left Half */}
                  <div
                    className={cn(
                      "h-[2px] flex-1 transition-all duration-500 ease-in-out",
                      index === 0
                        ? "bg-transparent"
                        : steps.findIndex((s) => s.id === currentStep) >= index
                          ? "bg-primary/50"
                          : "bg-background-surface-4",
                    )}
                  />

                  {/* Circle */}
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 xl:h-12 xl:w-12 xl:text-base",
                      isActive && "bg-primary-normal text-background-surface-2 scale-110",
                      isCompleted && "bg-primary/50 text-text-primary scale-100",
                      !isActive &&
                        !isCompleted &&
                        "bg-background-surface-4 text-text-secondary scale-100",
                    )}
                  >
                    {step.number}
                  </div>

                  {/* Connector Line - Right Half */}
                  <div
                    className={cn(
                      "h-[2px] flex-1 transition-all duration-500 ease-in-out",
                      index === steps.length - 1
                        ? "bg-transparent"
                        : steps.findIndex((s) => s.id === currentStep) > index
                          ? "bg-primary/50"
                          : "bg-background-surface-4",
                    )}
                  />
                </div>

                {/* Label - Centered below circle */}
                <span
                  className={cn(
                    "mt-2 text-center text-sm font-medium transition-all duration-300 xl:text-base",
                    isActive && "text-text-primary scale-105",
                    !isActive && "text-text-secondary scale-100",
                  )}
                >
                  {step.label}
                  {step.required && (
                    <span className="text-status-required ml-1">*</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
        </div>
      </div>
    </div>
  );
}
