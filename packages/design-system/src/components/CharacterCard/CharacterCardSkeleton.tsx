import { cn } from '../../lib/utils';
import { BaseCard } from '../Card';
import { Skeleton } from '../Skeleton';

export interface CharacterCardSkeletonProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * CharacterCardSkeleton Component
 *
 * A skeleton placeholder for CharacterCard while loading.
 * Matches the exact layout of CharacterCard for seamless loading states.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <CharacterCardSkeleton />
 *
 * // In a grid
 * {isLoading ? (
 *   <CharacterCardSkeleton />
 * ) : (
 *   <CharacterCard {...props} />
 * )}
 * ```
 */
export function CharacterCardSkeleton({ className }: CharacterCardSkeletonProps) {
  return (
    <BaseCard className={cn('min-h-[380px]', className)} isDisabled>
      {/* Image Area - Portrait ratio */}
      <div className="relative h-64 overflow-hidden bg-zinc-800">
        <Skeleton className="absolute inset-0 h-full w-full" variant="default" />
      </div>

      {/* Content Area */}
      <div className="relative z-10 -mt-12 flex flex-grow flex-col p-4">
        {/* Name */}
        <Skeleton className="mb-1 h-6 w-3/4" />

        {/* Tags */}
        <div className="mb-4 flex flex-wrap gap-2">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-10" />
        </div>

        {/* Summary */}
        <div className="mb-4 flex-grow space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-2 border-t border-zinc-800 pt-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </BaseCard>
  );
}

CharacterCardSkeleton.displayName = 'CharacterCardSkeleton';
