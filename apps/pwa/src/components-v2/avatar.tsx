import { cn } from "@/components-v2/lib/utils";

const Avatar = ({
  src,
  alt = "Avatar",
  size = 48,
  className,
}: {
  src?: string | null;
  alt?: string;
  size?: number;
  className?: string;
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
      <img
        src={src ?? "/img/placeholder/avatar.png"}
        alt={alt}
        width={size}
        height={size}
        className="pointer-events-none"
      />
    </div>
  );
};

export { Avatar };
