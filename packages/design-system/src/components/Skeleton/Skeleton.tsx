import * as React from 'react';
import { cn } from '../../lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Width of the skeleton */
  width?: string | number;
  /** Height of the skeleton */
  height?: string | number;
  /** Border radius variant */
  variant?: 'default' | 'circular' | 'rounded';
}

/**
 * Skeleton Component
 *
 * A placeholder component that shows a pulsing animation while content is loading.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Skeleton className="h-4 w-32" />
 *
 * // With explicit dimensions
 * <Skeleton width={200} height={20} />
 *
 * // Circular avatar placeholder
 * <Skeleton variant="circular" className="size-10" />
 *
 * // Rounded card placeholder
 * <Skeleton variant="rounded" className="h-48 w-full" />
 * ```
 */
function Skeleton({
  className,
  width,
  height,
  variant = 'default',
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-zinc-700',
        variant === 'default' && 'rounded',
        variant === 'circular' && 'rounded-full',
        variant === 'rounded' && 'rounded-xl',
        className
      )}
      style={{
        ...style,
        ...(width !== undefined && {
          width: typeof width === 'number' ? `${width}px` : width,
        }),
        ...(height !== undefined && {
          height: typeof height === 'number' ? `${height}px` : height,
        }),
      }}
      aria-hidden="true"
      {...props}
    />
  );
}

Skeleton.displayName = 'Skeleton';

export { Skeleton };
