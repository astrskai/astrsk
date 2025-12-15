import * as React from 'react';
import { cn } from '../../lib/utils';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Image source URL */
  src?: string | null;
  /** Alt text for the image, also used for fallback initial */
  alt?: string;
  /** Predefined size: xs (24px), sm (32px), md (40px), lg (48px), xl (64px), 2xl (96px) */
  size?: AvatarSize;
  /** Custom size in pixels (overrides size prop) */
  customSize?: number;
  /** Fallback content when no src is provided (defaults to first letter of alt) */
  fallback?: React.ReactNode;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-sm',
  xl: 'h-16 w-16 text-base',
  '2xl': 'h-24 w-24 text-lg',
};

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt = 'Avatar',
      size = 'md',
      customSize,
      fallback,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = React.useState(false);

    const handleImageError = () => {
      setImageError(true);
    };

    // Reset error state when src changes
    React.useEffect(() => {
      setImageError(false);
    }, [src]);

    const showFallback = !src || imageError;
    const fallbackContent =
      fallback ?? (alt ? alt.charAt(0).toUpperCase() : '?');

    return (
      <div
        ref={ref}
        data-slot="avatar"
        className={cn(
          'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full',
          'border border-[var(--border-default)] bg-[var(--bg-surface)]',
          !customSize && sizeClasses[size],
          className
        )}
        style={{
          ...(customSize && { width: customSize, height: customSize }),
          ...style,
        }}
        {...props}
      >
        {showFallback ? (
          <span className="flex h-full w-full items-center justify-center bg-[var(--bg-elevated)] font-medium text-[var(--fg-muted)]">
            {fallbackContent}
          </span>
        ) : (
          <img
            src={src}
            alt={alt}
            onError={handleImageError}
            className="h-full w-full object-cover"
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };
