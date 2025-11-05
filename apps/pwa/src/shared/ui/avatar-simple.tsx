import { cn } from "@/shared/lib";

interface AvatarSimpleProps {
  src?: string;
  alt?: string;
  size?: number;
  className?: string;
}

/**
 * Simple Avatar Component
 * Lightweight avatar for list items and cards
 */
export function AvatarSimple({
  src,
  alt = "Avatar",
  size = 32,
  className,
}: AvatarSimpleProps) {
  return (
    <div
      className={cn(
        "flex-shrink-0 overflow-hidden rounded-full bg-gray-700",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gray-600 text-xs font-medium text-gray-300">
          {alt.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}
