import { cn } from "@/shared/lib";
import { MediaDisplay } from "@/shared/ui";

const Avatar = ({
  src,
  alt = "Avatar",
  size = 48,
  className,
  isVideo = false,
  isDisabled = false,
}: {
  src?: string | null;
  alt?: string;
  size?: number;
  className?: string;
  isVideo?: boolean;
  isDisabled?: boolean;
}) => {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full border-1 border-gray-700 select-none",
        !src && "bg-surface-overlay",
        className,
      )}
      style={{
        width: size,
        height: size,
      }}
    >
      <MediaDisplay
        src={src || null}
        fallbackSrc="/img/placeholder/avatar.png"
        alt={alt}
        className={cn(
          "h-full w-full rounded-full object-cover",
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
