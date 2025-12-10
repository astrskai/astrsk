import type { LucideIcon } from "lucide-react";
import { Users, Globe, Database, Loader2, Check } from "lucide-react";
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
  { id: "cast", label: "Cast", number: 2, icon: Users },
  { id: "stats", label: "Stats", number: 3, icon: Database },
];

interface SessionStepperProps {
  /** Currently active step */
  currentStep: SessionStep;
  /** Callback when a step is clicked */
  onStepClick: (step: SessionStep) => void;
  /** Custom step configuration (optional, defaults to SESSION_STEPS) */
  steps?: StepConfig[];
  /** Whether stats data is being generated in background */
  isStatsGenerating?: boolean;
  /** Maximum step index that is accessible (based on requirements completion) */
  maxAccessibleStepIndex?: number;
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
  isStatsGenerating = false,
  maxAccessibleStepIndex = 0,
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
          const currentIndex = steps.findIndex((s) => s.id === currentStep);
          const Icon = step.icon;

          // Step states
          const isActive = step.id === currentStep;
          const isCompleted = index < currentIndex; // Already passed this step
          const isAccessible = index <= maxAccessibleStepIndex; // Requirements met for this step
          const isLocked = index > maxAccessibleStepIndex; // Requirements not met

          // Clickable: accessible and not current step
          const isClickable = isAccessible && !isActive;

          // Show loading spinner for Stats step when generating in background
          const isStatsStep = step.id === "stats";
          const showLoading = isStatsStep && isStatsGenerating && !isActive;

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
                    // Active: current step (brand highlight with glow)
                    isActive &&
                      "border-brand-500 bg-brand-500/20 text-brand-400 shadow-[0_0_15px_rgba(var(--brand-500-rgb),0.3)]",
                    // Completed: passed step (green check)
                    isCompleted &&
                      "border-green-500/50 bg-green-500/10 text-green-400",
                    // Accessible but not visited yet (clickable, normal style)
                    !isActive &&
                      !isCompleted &&
                      isAccessible &&
                      "border-border-default bg-surface-overlay text-fg-muted hover:border-brand-500/50",
                    // Locked: can't navigate yet (more visible locked state)
                    isLocked &&
                      "border-zinc-700 bg-zinc-800/50 text-zinc-600",
                    // Stats generating: special highlight
                    showLoading &&
                      "border-brand-500/50 bg-brand-500/10 text-brand-400",
                  )}
                >
                  {showLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : isCompleted ? (
                    <Check size={14} />
                  ) : (
                    <Icon size={14} />
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-bold transition-colors",
                    // Active: bright text
                    isActive && "text-fg-default",
                    // Completed: green text
                    isCompleted && "text-green-400",
                    // Accessible: normal text
                    !isActive && !isCompleted && isAccessible && "text-fg-muted",
                    // Locked: more visible locked text
                    isLocked && "text-zinc-600",
                    // Stats generating: brand color
                    showLoading && "text-brand-400",
                  )}
                >
                  {step.label}
                </span>
              </button>
              {/* Connector line between steps */}
              {index !== steps.length - 1 && (
                <div
                  className={cn(
                    "h-[2px] w-8 transition-colors",
                    // Line is green if next step is completed or current
                    index < currentIndex
                      ? "bg-green-500/50"
                      : "bg-border-default",
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
