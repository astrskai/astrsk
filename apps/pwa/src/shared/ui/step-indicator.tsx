import { Check } from "lucide-react";
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
    <div className="px-4 py-2 md:px-8 md:py-4">
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
                isCompleted && "bg-brand-600",
                !isCompleted && "bg-neutral-800",
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
                <div
                  key={step.id}
                  className="flex flex-1 flex-col items-center"
                >
                  {/* Circle and Connector Row */}
                  <div className="flex w-full items-center">
                    {/* Connector Line - Left Half */}
                    <div
                      className={cn(
                        "h-[2px] flex-1 transition-all duration-500 ease-in-out",
                        index === 0
                          ? "bg-transparent"
                          : steps.findIndex((s) => s.id === currentStep) >=
                              index
                            ? "bg-brand-600/50"
                            : "bg-neutral-500",
                      )}
                    />

                    {/* Circle */}
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-fg-on-emphasis transition-all duration-300 xl:h-12 xl:w-12 xl:text-base",
                        isActive && "scale-110 bg-brand-600",
                        isCompleted && "scale-100 bg-brand-600/50",
                        !isActive && !isCompleted && "scale-100 bg-neutral-500",
                      )}
                    >
                      {isCompleted ? <Check size={20} /> : step.number}
                    </div>

                    {/* Connector Line - Right Half */}
                    <div
                      className={cn(
                        "h-[2px] flex-1 transition-all duration-500 ease-in-out",
                        index === steps.length - 1
                          ? "bg-transparent"
                          : steps.findIndex((s) => s.id === currentStep) > index
                            ? "bg-brand-600/50"
                            : "bg-neutral-500",
                      )}
                    />
                  </div>

                  {/* Label - Centered below circle */}
                  <span
                    className={cn(
                      "mt-2 text-center text-sm font-medium transition-all duration-300 xl:text-base",
                      isActive && "scale-105 text-fg-default",
                      !isActive && "scale-100 text-fg-muted",
                    )}
                  >
                    {step.label}
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
