import React from 'react';
import { cn } from '../../lib/utils';

interface BaseCardProps {
  children: React.ReactNode;
  className?: string;
  isDisabled?: boolean;
  onClick?: () => void;
}

/**
 * BaseCard Component (Internal)
 * Shared card wrapper providing consistent styling across all card types.
 *
 * Features:
 * - Consistent border, background, shadow, and hover effects
 * - `group` class for child hover interactions (e.g., CardActionToolbar)
 * - Disabled state handling
 * - Click interaction support
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
        // Base structure - @container enables container queries for responsive children
        '@container group relative flex h-full flex-col overflow-hidden',
        // Visual styling
        'rounded-xl border border-border-default bg-surface-raised shadow-lg',
        // Transitions
        'transition-all duration-300',
        // Interactive states
        !isDisabled &&
          onClick &&
          'cursor-pointer hover:border-border-subtle hover:shadow-xl',
        // Disabled state
        isDisabled && 'pointer-events-none opacity-60',
        className
      )}
      onClick={isDisabled ? undefined : onClick}
    >
      {children}
    </article>
  );
}
