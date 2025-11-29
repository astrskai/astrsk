import React from 'react';
import { cn } from '../../lib/utils';
import { BaseCard, CardActionToolbar, type CardAction } from '../Card';

export interface CharacterCardProps {
  /** Character name */
  name: string;
  /** Character image URL */
  imageUrl?: string | null;
  /** Character summary/description */
  summary?: string;
  /** Character tags */
  tags: string[];
  /** Token count for the character */
  tokenCount?: number;
  /** Last updated timestamp */
  updatedAt?: string;
  /** Action buttons displayed on the card */
  actions?: CardAction[];
  /** Additional CSS classes */
  className?: string;
  /** Whether the card is disabled */
  isDisabled?: boolean;
  /** Click handler for the card */
  onClick?: () => void;
  /** Whether to show the type indicator badge */
  showTypeIndicator?: boolean;
  /** Custom content for the type indicator badge (icon and/or text) */
  typeIndicator?: React.ReactNode;
  /** Placeholder image URL when imageUrl is not provided */
  placeholderImageUrl?: string;
}

/**
 * CharacterCard Component
 *
 * A card component for displaying character information including
 * image, name, tags, summary, and metadata.
 *
 * @example
 * ```tsx
 * <CharacterCard
 *   name="Alice"
 *   imageUrl="/characters/alice.png"
 *   summary="A curious girl who fell into Wonderland"
 *   tags={["fantasy", "adventure"]}
 *   tokenCount={1500}
 *   updatedAt="2 days ago"
 *   onClick={() => console.log('clicked')}
 * />
 * ```
 */
export function CharacterCard({
  name,
  imageUrl,
  summary,
  tags,
  tokenCount = 0,
  updatedAt,
  className,
  actions = [],
  isDisabled = false,
  onClick,
  showTypeIndicator = false,
  typeIndicator,
  placeholderImageUrl,
}: CharacterCardProps) {
  const displayImageUrl = imageUrl || placeholderImageUrl;
  return (
    <BaseCard
      className={cn('min-h-[380px]', className)}
      isDisabled={isDisabled}
      onClick={onClick}
    >
      {/* Image Area - Portrait ratio */}
      <div className="relative h-64 overflow-hidden bg-zinc-800">
        {displayImageUrl && (
          <img
            src={displayImageUrl}
            alt={name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-90" />

        {/* Action Toolbar (Responsive) */}
        <CardActionToolbar actions={actions} />

        {/* Type Badge */}
        {showTypeIndicator && (
          <div className="absolute top-3 left-3 z-10">
            <div className="flex items-center gap-1.5 rounded border border-white/10 bg-black/50 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md">
              {typeIndicator || 'CHARACTER'}
            </div>
          </div>
        )}
      </div>

      {/* Content Area - Overlapping with image */}
      <div className="relative z-10 -mt-12 flex flex-grow flex-col p-4">
        <h3 className="mb-1 line-clamp-2 text-xl font-bold break-words text-white drop-shadow-md">
          {name}
        </h3>

        {/* Tags */}
        <div className="mb-4 flex flex-wrap gap-2">
          {tags.length > 0 ? (
            <>
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300">
                  +{tags.length - 3}
                </span>
              )}
            </>
          ) : (
            <span className="text-[10px] text-zinc-600">No tags</span>
          )}
        </div>

        <p className="mb-4 line-clamp-3 flex-grow text-xs leading-relaxed break-words text-zinc-400">
          {summary || 'No summary'}
        </p>

        {/* Stats */}
        <div className="mt-auto flex items-center justify-between border-t border-zinc-800 pt-3 text-xs text-zinc-500">
          <div className="flex items-center gap-1">{tokenCount} Tokens</div>
          {updatedAt && (
            <div className="flex items-center gap-1">
              {updatedAt}
            </div>
          )}
        </div>
      </div>
    </BaseCard>
  );
}

export type { CardAction };
