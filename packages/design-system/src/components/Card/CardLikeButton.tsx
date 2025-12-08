import * as React from 'react';
import { cn } from '../../lib/utils';

export interface LikeButtonProps {
  /** 현재 좋아요 상태 */
  isLiked: boolean;
  /** 클릭 핸들러 */
  onClick: (e: React.MouseEvent) => void;
  /** 로딩 상태 */
  isLoading?: boolean;
}

/**
 * Heart Icon Component (Internal)
 * Supports filled and outline states
 */
function HeartIcon({
  filled,
  className,
}: {
  filled?: boolean;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

/**
 * CardLikeButton Component
 *
 * A like/favorite button for card components.
 * Displays a heart icon that toggles between filled and outline states.
 *
 * @example
 * ```tsx
 * <CardLikeButton
 *   isLiked={true}
 *   onClick={(e) => handleLike(e)}
 * />
 * ```
 */
export function CardLikeButton({ isLiked, onClick, isLoading }: LikeButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoading) {
      onClick(e);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'flex items-center justify-center p-2',
        'transition-all duration-200',
        'hover:scale-110 active:scale-95',
        // Drop shadow for visibility on any background
        '[filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.8))_drop-shadow(0_2px_4px_rgba(0,0,0,0.6))]',
        isLiked
          ? 'text-rose-500 hover:text-rose-400'
          : 'text-white/90 hover:text-white',
        isLoading && 'pointer-events-none opacity-70'
      )}
      aria-label={isLiked ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={isLiked}
    >
      <HeartIcon filled={isLiked} className="h-5 w-5" />
    </button>
  );
}
