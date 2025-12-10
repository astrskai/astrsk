import type { LucideIcon } from "lucide-react";
import { Users, Globe, Database } from "lucide-react";
import { cn } from "@/shared/lib";

export type SessionStep = "scenario" | "stats" | "cast";

export interface StepConfig {
  id: SessionStep;
  label: string;
  number: number;
  icon: LucideIcon;
}

export const SESSION_STEPS: StepConfig[] = [
  { id: "scenario", label: "Scenario", number: 1, icon: Globe },
  { id: "stats", label: "Stats", number: 2, icon: Database },
  { id: "cast", label: "Cast", number: 3, icon: Users },
];

interface SessionStepperProps {
  /** Currently active step */
  currentStep: SessionStep;
  /** Callback when a step is clicked */
  onStepClick: (step: SessionStep) => void;
  /** Custom step configuration (optional, defaults to SESSION_STEPS) */
  steps?: StepConfig[];
  /** Additional class names */
  className?: string;
}

/**
 * Session creation stepper component
 * Full-width sticky bar style stepper for wizard navigation
 */
export function SessionStepper({
  currentStep,
  onStepClick,
  steps = SESSION_STEPS,
  className,
}: SessionStepperProps) {
  return (
    <div
      className={cn(
        "bg-canvas relative z-20 hidden w-full justify-center pt-2 pb-4 shadow-xl md:flex",
        className,
      )}
    >
      <div className="flex items-center gap-2 overflow-x-auto px-4 md:gap-8">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const currentIndex = steps.findIndex((s) => s.id === currentStep);
          const isCompleted = index < currentIndex;
          const isClickable = isCompleted; // Only completed steps are clickable
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex min-w-max items-center gap-3">
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                className={cn(
                  "flex items-center gap-3 transition-all duration-300",
                  isClickable && "cursor-pointer hover:opacity-80",
                  !isClickable && !isActive && "cursor-default",
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300",
                    isActive &&
                      "border-brand-500 bg-brand-500/10 text-brand-400 shadow-[0_0_15px_rgba(var(--brand-500-rgb),0.3)]",
                    isCompleted &&
                      "border-border-default bg-surface-overlay text-fg-muted",
                    !isActive &&
                      !isCompleted &&
                      "border-border-subtle bg-surface text-fg-subtle",
                  )}
                >
                  <Icon size={14} />
                </div>
                <span
                  className={cn(
                    "text-xs font-bold",
                    isActive && "text-fg-default",
                    isCompleted && "text-fg-muted",
                    !isActive && !isCompleted && "text-fg-subtle",
                  )}
                >
                  {step.label}
                </span>
              </button>
              {index !== steps.length - 1 && (
                <div className="bg-border-default h-[1px] w-8" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
