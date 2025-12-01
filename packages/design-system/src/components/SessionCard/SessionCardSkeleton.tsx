import { cn } from '../../lib/utils';
import { BaseCard } from '../Card';
import { Skeleton } from '../Skeleton';

export interface SessionCardSkeletonProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * SessionCardSkeleton Component
 *
 * A skeleton placeholder for SessionCard while loading.
 * Matches the exact layout of SessionCard for seamless loading states.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <SessionCardSkeleton />
 *
 * // In a grid
 * {isLoading ? (
 *   <SessionCardSkeleton />
 * ) : (
 *   <SessionCard {...props} />
 * )}
 * ```
 */
export function SessionCardSkeleton({ className }: SessionCardSkeletonProps) {
  return (
    <BaseCard
      className={cn(
        'min-h-[320px] w-full border-zinc-700 ring-1 ring-zinc-800',
        className
      )}
      isDisabled
    >
      {/* Header Image Area */}
      <div className="relative h-48 overflow-hidden bg-zinc-800">
        <Skeleton className="absolute inset-0 h-full w-full" variant="default" />

        {/* Session Title placeholder */}
        <div className="absolute bottom-0 left-0 w-full p-5">
          <Skeleton className="mb-2 h-7 w-3/4" />
          <Skeleton className="h-7 w-1/2" />
        </div>
      </div>

      {/* Session Details */}
      <div className="flex flex-grow flex-col justify-between p-5">
        <div className="space-y-3">
          {/* Metadata */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <Skeleton className="size-4" variant="circular" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>

          {/* Character Avatars */}
          <div className="flex -space-x-2 pt-1">
            <Skeleton className="size-8 border-2 border-zinc-900" variant="circular" />
            <Skeleton className="size-8 border-2 border-zinc-900" variant="circular" />
            <Skeleton className="size-8 border-2 border-zinc-900" variant="circular" />
          </div>
        </div>
      </div>
    </BaseCard>
  );
}

SessionCardSkeleton.displayName = 'SessionCardSkeleton';
