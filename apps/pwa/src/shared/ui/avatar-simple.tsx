import { cn } from "@/shared/lib";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

interface AvatarSimpleProps {
  src?: string;
  alt?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: "h-6 w-6 text-xs",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-sm",
  xl: "h-16 w-16 text-base",
  "2xl": "h-24 w-24 text-lg",
};

/**
 * Simple Avatar Component
 * Lightweight avatar for list items and cards
 *
 * @param size - Predefined size: xs (24px), sm (32px), md (40px), lg (48px), xl (64px), 2xl (96px)
 */
export function AvatarSimple({
  src,
  alt = "Avatar",
  size = "sm",
  className,
}: AvatarSimpleProps) {
  return (
    <div
      className={cn(
        "flex-shrink-0 overflow-hidden rounded-full bg-gray-700",
        sizeClasses[size],
        className,
      )}
    >
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gray-600 font-medium text-gray-300">
          {alt.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}
