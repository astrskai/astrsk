import { cn } from "@/components-v2/lib/utils";
import { MediaDisplay } from "@/components-v2/shared/media-display";

const Avatar = ({
  src,
  alt = "Avatar",
  size = 48,
  className,
  isVideo = false,
}: {
  src?: string | null;
  alt?: string;
  size?: number;
  className?: string;
  isVideo?: boolean;
}) => {
  return (
    <div
      className={cn(
        "shrink-0 overflow-hidden rounded-full grid place-items-center select-none border-1 border-border-selected-inverse/50",
        !src && "bg-background-surface-3",
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
        width={size}
        height={size}
        className="w-full h-full object-cover"
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
