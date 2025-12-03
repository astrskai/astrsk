import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import {
  BaseCard,
  CardActionToolbar,
  CardMetadataContainer,
  CardMetadataItem,
  type CardAction,
} from '../Card';

export interface CharacterAvatar {
  /** Character name */
  name: string;
  /** Character avatar image URL */
  avatarUrl?: string;
}

export interface SessionCardProps {
  /** Session title */
  title: string;
  /** Cover image URL */
  imageUrl?: string | null;
  /** Number of messages in the session (used in default metadata) */
  messageCount?: number;
  /** Action buttons displayed on the card */
  actions?: CardAction[];
  /** Additional CSS classes */
  className?: string;
  /** Whether the card is disabled */
  isDisabled?: boolean;
  /** Click handler for the card */
  onClick?: () => void;
  /** Character avatars to display */
  characterAvatars?: CharacterAvatar[];
  /** Whether characters are loading */
  areCharactersLoading?: boolean;
  /** Whether to show the type indicator badge */
  showTypeIndicator?: boolean;
  /** Custom content for the type indicator badge (icon and/or text) */
  typeIndicator?: React.ReactNode;
  /**
   * Custom render function for the metadata section.
   * When provided, replaces the default messageCount display.
   * Use CardMetadataContainer and CardMetadataItem for consistent styling.
   */
  renderMetadata?: () => React.ReactNode;
  /** Tags to display on the card */
  tags?: string[];
  /** Session summary/description */
  summary?: string;
}

/**
 * Character Avatar Component (Internal)
 */
function CharacterAvatarImage({ name, avatarUrl }: CharacterAvatar) {
  const [imageError, setImageError] = useState(false);

  // Reset error state when avatarUrl changes
  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  const shouldShowImage = avatarUrl && !imageError;

  return (
    <div
      className='flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-zinc-900 bg-zinc-700'
      title={name}
    >
      {shouldShowImage ? (
        <img
          src={avatarUrl}
          alt={name}
          className='h-full w-full object-cover'
          onError={() => setImageError(true)}
        />
      ) : (
        <span className='text-[10px] text-zinc-500'>
          {name.charAt(0).toUpperCase() || '?'}
        </span>
      )}
    </div>
  );
}

/**
 * Character Avatar Skeleton Component (Internal)
 */
function CharacterAvatarSkeleton() {
  return (
    <div className='h-8 w-8 animate-pulse rounded-full border-2 border-zinc-900 bg-zinc-700' />
  );
}

/**
 * Message Icon Component (Internal)
 * Inline SVG to avoid external icon library dependency
 */
function MessageIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
    </svg>
  );
}

/**
 * SessionCard Component
 *
 * A card component for displaying session information including
 * cover image, title, message count, and character avatars.
 *
 * @example
 * ```tsx
 * <SessionCard
 *   title="Adventure in Wonderland"
 *   imageUrl="/sessions/cover.png"
 *   messageCount={42}
 *   characterAvatars={[
 *     { name: "Alice", avatarUrl: "/avatars/alice.png" },
 *     { name: "Bob", avatarUrl: "/avatars/bob.png" },
 *   ]}
 *   onClick={() => console.log('clicked')}
 * />
 * ```
 */
// Re-export for convenience
export const MetadataContainer = CardMetadataContainer;
export const MetadataItem = CardMetadataItem;

export function SessionCard({
  title,
  imageUrl,
  messageCount,
  actions = [],
  className,
  isDisabled = false,
  onClick,
  characterAvatars = [],
  areCharactersLoading = false,
  showTypeIndicator = false,
  typeIndicator,
  renderMetadata,
  tags = [],
  summary,
}: SessionCardProps) {
  const [imageError, setImageError] = useState(false);

  // Reset error state when imageUrl changes
  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  // Show image if URL exists and no error
  const shouldShowImage = imageUrl && !imageError;
  // Show initial fallback when image fails to load (only if imageUrl was provided)
  const shouldShowInitial = imageUrl && imageError;

  return (
    <BaseCard
      className={cn(
        'min-h-[320px] w-full border-zinc-700 ring-1 ring-zinc-800',
        !isDisabled && onClick && 'hover:ring-zinc-600',
        className
      )}
      isDisabled={isDisabled}
      onClick={onClick}
    >
      {/* Header Image Area */}
      <div className='relative h-48 overflow-hidden bg-zinc-800'>
        {/* Cover Image */}
        {shouldShowImage ? (
          <>
            <img
              src={imageUrl}
              alt={title}
              className='absolute inset-0 h-full w-full object-cover opacity-80 transition-all duration-700 group-hover:scale-105 group-hover:opacity-90'
              loading='lazy'
              onError={() => setImageError(true)}
            />
            <div className='absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent' />
          </>
        ) : shouldShowInitial ? (
          <>
            {/* Initial fallback when image fails to load */}
            <div className='absolute inset-0 flex items-center justify-center'>
              <span className='text-6xl font-bold text-zinc-600'>
                {title.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
            <div className='absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent' />
          </>
        ) : (
          <>
            {/* Placeholder pattern */}
            <div className='absolute inset-0 bg-zinc-800'>
              <div
                className='absolute inset-0 opacity-20'
                style={{
                  backgroundImage:
                    'radial-gradient(#4f46e5 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }}
              />
            </div>
            <div className='absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent' />
          </>
        )}

        {/* Action Toolbar (Responsive) */}
        <CardActionToolbar actions={actions} />

        {/* Type Badge */}
        {showTypeIndicator && (
          <div className='absolute top-3 left-3 z-10'>
            <div className='flex items-center gap-1.5 rounded border border-white/10 bg-black/50 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md'>
              {typeIndicator || 'SESSION'}
            </div>
          </div>
        )}

        {/* Session Title */}
        <div className='absolute bottom-0 left-0 w-full p-5'>
          <h2 className='line-clamp-2 h-[3.75rem] text-2xl leading-tight font-bold break-words text-white'>
            {title}
          </h2>
        </div>
      </div>

      {/* Session Details */}
      <div className='flex flex-grow flex-col justify-between p-5'>
        <div className='space-y-3'>
          {/* Tags */}
          {tags.length > 0 && (
            <div className='flex flex-wrap gap-2'>
              {tags.slice(0, 3).map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className='rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300'
                >
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className='rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300'>
                  +{tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Summary */}
          {summary && (
            <p className='line-clamp-2 text-xs leading-relaxed text-zinc-400'>
              {summary}
            </p>
          )}

          {/* Metadata */}
          {renderMetadata ? (
            renderMetadata()
          ) : (
            messageCount !== undefined && (
              <div className='flex items-center justify-between text-sm'>
                {messageCount === 0 ? (
                  <span className='text-zinc-400'>New session</span>
                ) : (
                  <div className='flex items-center gap-2'>
                    <MessageIcon className='h-4 w-4 text-zinc-500' />
                    <span className='font-semibold text-zinc-300'>
                      {messageCount.toLocaleString()}
                    </span>
                    <span className='text-zinc-400'>
                      {messageCount === 1 ? 'Message' : 'Messages'}
                    </span>
                  </div>
                )}
              </div>
            )
          )}

          {/* Character Avatars */}
          {(areCharactersLoading || characterAvatars.length > 0) && (
            <div className='border-t border-zinc-800 pt-3'>
              {areCharactersLoading ? (
                <div className='flex -space-x-2'>
                  <CharacterAvatarSkeleton />
                  <CharacterAvatarSkeleton />
                  <CharacterAvatarSkeleton />
                </div>
              ) : (
                <div className='flex -space-x-2'>
                  {characterAvatars.slice(0, 3).map((avatar, idx) => (
                    <CharacterAvatarImage
                      key={`${avatar.name}-${idx}`}
                      name={avatar.name}
                      avatarUrl={avatar.avatarUrl}
                    />
                  ))}
                  {characterAvatars.length > 3 && (
                    <div className='flex h-8 w-8 items-center justify-center rounded-full border-2 border-zinc-900 bg-zinc-800 text-[10px] text-zinc-500'>
                      +{characterAvatars.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </BaseCard>
  );
}

export type { CardAction };
