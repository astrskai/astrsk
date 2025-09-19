import * as React from "react";
import { cn } from "@/components-v2/lib/utils";
import { SvgIcon } from "@/components-v2/svg-icon";
import { PlayButtonIconSize } from "@/components-v2/shared/media-display";

export interface PlayButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: PlayButtonIconSize;
  isPlaying?: boolean;
}

interface IconProps {
  isPlaying: boolean;
  size: PlayButtonIconSize;
}

const PlayButton = React.forwardRef<HTMLButtonElement, PlayButtonProps>(
  ({ className, size = "large", isPlaying = false, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn("cursor-pointer", className)}
        type="button"
        {...props}
      >
        <Icon isPlaying={isPlaying} size={size} />
      </button>
    );
  },
);
PlayButton.displayName = "PlayButton";

const Icon = ({ isPlaying, size }: IconProps) => {
  const iconSize = size === "small" ? 32 : size === "medium" ? 48 : 76;

  return (
    <SvgIcon
      name={isPlaying ? "pause" : "play"}
      width={iconSize}
      height={iconSize}
    />
  );
};

export { PlayButton };
