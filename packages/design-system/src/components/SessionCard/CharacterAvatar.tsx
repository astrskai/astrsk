import { useState, useEffect } from 'react';

export interface CharacterAvatarProps {
  /** Character name */
  name: string;
  /** Character avatar image URL */
  avatarUrl?: string;
  /**
   * Loading strategy for the avatar image.
   * @default 'lazy'
   */
  loading?: 'lazy' | 'eager';
}

/**
 * Character Avatar Component
 * Displays a character's avatar image with fallback to initial letter.
 */
export function CharacterAvatarImage({
  name,
  avatarUrl,
  loading = 'lazy',
}: CharacterAvatarProps) {
  const [imageError, setImageError] = useState(false);

  // Reset error state when avatarUrl changes
  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  const shouldShowImage = avatarUrl && !imageError;

  return (
    <div
      className='flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-zinc-900 bg-zinc-700'
      title={name}
    >
      {shouldShowImage ? (
        <img
          src={avatarUrl}
          alt={name}
          className='h-full w-full object-cover'
          loading={loading}
          onError={() => setImageError(true)}
        />
      ) : (
        <span className='text-xs text-zinc-400'>
          {name.charAt(0).toUpperCase() || '?'}
        </span>
      )}
    </div>
  );
}

/**
 * Character Avatar Skeleton Component
 * Loading placeholder for character avatars.
 */
export function CharacterAvatarSkeleton() {
  return (
    <div className='h-10 w-10 animate-pulse rounded-full border-2 border-zinc-900 bg-zinc-700' />
  );
}
