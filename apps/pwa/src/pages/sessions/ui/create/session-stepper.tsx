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
 * Responsive stepper for wizard navigation
 * - Mobile: Compact horizontal pills
 * - Desktop: Full-width with labels and connector lines
 */
export function SessionStepper({
  currentStep,
  onStepClick,
  steps = SESSION_STEPS,
  isStatsGenerating = false,
  maxAccessibleStepIndex = 0,
  className,
}: SessionStepperProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div
      className={cn(
        "bg-canvas relative z-20 flex w-full justify-center px-4 py-2 md:pt-2 md:pb-4 md:shadow-xl",
        className,
      )}
    >
      {/* Mobile: Compact step indicators */}
      <div className="flex items-center gap-1 md:hidden">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const isCompleted = index < currentIndex;
          const isAccessible = index <= maxAccessibleStepIndex;
          const isLocked = index > maxAccessibleStepIndex;
          const isClickable = isAccessible && !isActive;
          const isStatsStep = step.id === "stats";
          const showLoading = isStatsStep && isStatsGenerating && !isActive;

          return (
            <div key={step.id} className="flex items-center">
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                  isActive && "bg-brand-500/20 text-brand-400",
                  isCompleted && "bg-surface-overlay text-fg-muted",
                  !isActive && !isCompleted && isAccessible && "bg-surface-overlay text-fg-subtle",
                  isLocked && !showLoading && "bg-zinc-800/30 text-zinc-600",
                  showLoading && "bg-brand-500/10 text-brand-400 ring-1 ring-brand-500/40 animate-pulse",
                  isClickable && "hover:bg-surface-raised",
                )}
              >
                {showLoading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : isCompleted ? (
                  <Check size={12} className="text-brand-400" />
                ) : (
                  <Icon size={12} />
                )}
                <span>{step.label}</span>
              </button>
              {/* Connector */}
              {index !== steps.length - 1 && (
                <div
                  className={cn(
                    "mx-1 h-[2px] w-3",
                    index < currentIndex ? "bg-brand-500/50" : "bg-zinc-700",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop: Full stepper with icons and labels */}
      <div className="hidden items-center gap-8 md:flex">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const isCompleted = index < currentIndex;
          const isAccessible = index <= maxAccessibleStepIndex;
          const isLocked = index > maxAccessibleStepIndex;
          const isClickable = isAccessible && !isActive;
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
                    isActive &&
                      "border-brand-500 bg-brand-500/20 text-brand-400 shadow-[0_0_15px_rgba(var(--brand-500-rgb),0.3)]",
                    isCompleted &&
                      "border-brand-500/50 bg-brand-500/10 text-brand-400",
                    !isActive &&
                      !isCompleted &&
                      isAccessible &&
                      "border-border-default bg-surface-overlay text-fg-muted hover:border-brand-500/50",
                    isLocked &&
                      !showLoading &&
                      "border-zinc-700 bg-zinc-800/50 text-zinc-600",
                    showLoading &&
                      "border-zinc-500/50 bg-zinc-500/10 text-zinc-400",
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
                    isActive && "text-fg-default",
                    isCompleted && "text-brand-400",
                    !isActive && !isCompleted && isAccessible && "text-fg-muted",
                    isLocked && !showLoading && "text-zinc-600",
                    showLoading && "text-zinc-400",
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
                    index < currentIndex ? "bg-brand-500/50" : "bg-border-default",
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
