import type { ReactNode } from "react";
import { cn } from "@/shared/lib";

interface StepHeaderProps {
  /** Icon displayed before the title */
  icon: ReactNode;
  /** Main title text */
  title: string;
  /** Subtitle/description text */
  subtitle: string;
  /** Action buttons on the right side */
  actions?: ReactNode;
  /** Additional content below the title row (e.g., search bar) */
  children?: ReactNode;
  /** Additional class names for the container */
  className?: string;
}

/**
 * Shared header component for session creation steps
 * Provides consistent layout: Icon + Title + Subtitle with optional actions
 */
export function StepHeader({
  icon,
  title,
  subtitle,
  actions,
  children,
  className,
}: StepHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-shrink-0 flex-col gap-4 px-4 py-2 md:px-6 md:py-4",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-fg-default flex items-center gap-2 text-xl font-bold tracking-tight md:text-2xl">
            <span className="text-brand-400">{icon}</span>
            {title}
          </h1>
          <p className="text-fg-muted mt-1 font-mono text-xs">{subtitle}</p>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
