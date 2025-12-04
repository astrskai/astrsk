import { cn } from "@/shared/lib";
import { MediaDisplay } from "@/shared/ui";

type AvatarShape = "circle" | "hexagon";

const Avatar = ({
  src,
  alt = "Avatar",
  size = 48,
  className,
  isVideo = false,
  isDisabled = false,
  shape = "circle",
}: {
  src?: string | null;
  alt?: string;
  size?: number;
  className?: string;
  isVideo?: boolean;
  isDisabled?: boolean;
  shape?: AvatarShape;
}) => {
  const isHexagon = shape === "hexagon";

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden select-none",
        !isHexagon && "border-1 border-gray-700 rounded-full",
        !src && "bg-surface-overlay",
        className,
      )}
      style={{
        width: size,
        height: size,
        // Hexagon clip-path using CSS
        ...(isHexagon && {
          clipPath:
            "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
        }),
      }}
    >
      <MediaDisplay
        src={src || null}
        fallbackSrc="/img/placeholder/avatar.png"
        alt={alt}
        className={cn(
          "h-full w-full object-cover",
          !isHexagon && "rounded-full",
          isDisabled && "pointer-events-none",
        )}
        isVideo={isVideo}
        showControls={false}
        autoPlay={false}
        muted={true}
        loop={true}
        playOnHover={true}
        clickToToggle={false}
      />
    </div>
  );
};

export { Avatar };
