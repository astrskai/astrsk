import React from "react";
import { cn } from "@/shared/lib";

interface BaseCardProps {
  children: React.ReactNode;
  className?: string;
  isDisabled?: boolean;
  onClick?: () => void;
}

/**
 * BaseCard Component
 * Shared card wrapper providing consistent styling across all card types.
 *
 * Features:
 * - Consistent border, background, shadow, and hover effects
 * - `group` class for child hover interactions (e.g., CardActionToolbar)
 * - Disabled state handling
 * - Click interaction support
 *
 * Note: min-height should be set via className prop as each card type has different content.
 *
 * @example
 * ```tsx
 * <BaseCard className="min-h-[320px]" onClick={handleClick}>
 *   <CardImageArea />
 *   <CardContent />
 * </BaseCard>
 * ```
 */
export function BaseCard({
  children,
  className,
  isDisabled = false,
  onClick,
}: BaseCardProps) {
  return (
    <article
      className={cn(
        // Base structure
        "group relative flex h-full flex-col overflow-hidden",
        // Visual styling
        "rounded-xl border border-zinc-800 bg-zinc-900 shadow-lg",
        // Transitions
        "transition-all duration-300",
        // Interactive states
        !isDisabled &&
          onClick &&
          "cursor-pointer hover:border-zinc-600 hover:shadow-xl",
        // Disabled state
        isDisabled && "pointer-events-none opacity-60",
        className,
      )}
      onClick={isDisabled ? undefined : onClick}
    >
      {children}
    </article>
  );
}
