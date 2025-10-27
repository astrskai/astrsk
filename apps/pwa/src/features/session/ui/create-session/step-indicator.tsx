import { cn } from "@/shared/lib";

type Step = "flow" | "ai-character" | "user-character" | "plot";

interface StepConfig {
  id: Step;
  label: string;
  number: number;
  required: boolean;
}

interface StepIndicatorProps {
  steps: StepConfig[];
  currentStep: Step;
}

/**
 * Step Indicator Component
 * Shows progress through multi-step wizard
 * Displays step numbers, labels, and completion status
 */
export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="border-border border-b px-8 py-4">
      <div className="flex items-center justify-center gap-2">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = steps.findIndex((s) => s.id === currentStep) > index;

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
