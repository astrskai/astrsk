import React from 'react';
import { cn } from '../../lib/utils';

export interface CardAction {
  /** Icon component (supports lucide-react, heroicons, react-icons, or custom icons) */
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: (e: React.MouseEvent) => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  title?: string;
  className?: string;
}

interface CardActionToolbarProps {
  actions: CardAction[];
  className?: string;
}

/**
 * Card Action Toolbar Component (Internal)
 * Desktop: Hidden by default, shows on hover
 * Mobile: Always visible
 */
export function CardActionToolbar({
  actions,
  className,
}: CardActionToolbarProps) {
  const handleActionClick =
    (action: CardAction) => (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!action.disabled) {
        action.onClick(e);
      }
    };

  if (actions.length === 0) return null;

  return (
    <div
      className={cn(
        'absolute top-2 right-2 z-20 flex translate-y-0 items-center gap-1 rounded-lg border border-white/10 bg-black/60 p-1 opacity-100 backdrop-blur-md transition-all duration-300 lg:translate-y-[-10px] lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100',
        className
      )}
    >
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <button
            key={index}
            onClick={handleActionClick(action)}
            className={cn(
              'rounded p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white',
              action.disabled && 'cursor-not-allowed opacity-50',
              action.loading && 'animate-pulse',
              action.className
            )}
            title={action.title || action.label}
            disabled={action.disabled}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
