import * as React from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/shared/lib";
import { PlayButtonIconSize } from "./media-display";

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
  const IconComponent = isPlaying ? Pause : Play;

  return <IconComponent size={iconSize} />;
};

export { PlayButton };
