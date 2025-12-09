import React from 'react';
import { cn } from '../../lib/utils';

export type CardBadgeVariant = 'default' | 'private' | 'owner';
export type CardBadgePosition = 'left' | 'right';

export interface CardBadge {
  /** Badge label text */
  label: string;
  /** Optional icon to display before label */
  icon?: React.ReactNode;
  /** Badge style variant */
  variant?: CardBadgeVariant;
  /** Badge position (left or right). Defaults to 'left' */
  position?: CardBadgePosition;
  /** Custom CSS classes to override default styles */
  className?: string;
}

interface CardBadgesProps {
  /** Array of badges to display */
  badges: CardBadge[];
  /** Filter badges by position. If not specified, renders all badges. */
  position?: CardBadgePosition;
  /** Additional CSS classes */
  className?: string;
}

const badgeVariantStyles: Record<CardBadgeVariant, string> = {
  default: 'border-white/10 bg-black/50 text-white',
  private: 'border-amber-500/30 bg-amber-950/50 text-amber-300',
  owner: 'border-blue-500/30 bg-blue-950/50 text-blue-300',
};

/**
 * CardBadges Component
 *
 * Renders a list of badges for card components.
 * Typically positioned at the top-left of the card image area.
 *
 * @example
 * ```tsx
 * <CardBadges
 *   badges={[
 *     { label: 'CHARACTER', icon: <LayersIcon /> },
 *     { label: 'Private', variant: 'private', icon: <LockIcon /> },
 *   ]}
 * />
 * ```
 */
export function CardBadges({ badges, position, className }: CardBadgesProps) {
  // Filter badges by position if specified
  const filteredBadges = position
    ? badges.filter((badge) => (badge.position ?? 'left') === position)
    : badges;

  if (filteredBadges.length === 0) return null;

  return (
    <div className={cn(
      'flex flex-wrap gap-1.5',
      position === 'right' && 'justify-end',
      className
    )}>
      {filteredBadges.map((badge, index) => (
        <div
          key={`${badge.label}-${index}`}
          className={cn(
            'flex max-w-full items-center gap-1 rounded border px-2 py-1 text-[10px] font-bold backdrop-blur-md',
            badgeVariantStyles[badge.variant ?? 'default'],
            badge.className
          )}
        >
          {badge.icon && <span className="shrink-0">{badge.icon}</span>}
          <span className="truncate">{badge.label}</span>
        </div>
      ))}
    </div>
  );
}
