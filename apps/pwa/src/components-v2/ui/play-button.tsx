import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/components-v2/lib/utils";

const playButtonVariants = cva(
  "bg-background-surface-4/50 rounded-full backdrop-blur-sm inline-flex justify-center items-center transition-all duration-200 hover:bg-neutral-700/60 cursor-pointer",
  {
    variants: {
      size: {
        small: "w-8 h-8 p-2.5 gap-1",
        large: "w-20 h-20 p-6 gap-2",
      },
    },
    defaultVariants: {
      size: "large",
    },
  },
);

export interface PlayButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof playButtonVariants> {
  isPlaying?: boolean;
}

const PlayButton = React.forwardRef<HTMLButtonElement, PlayButtonProps>(
  ({ className, size, isPlaying = false, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(playButtonVariants({ size }), className)}
        type="button"
        {...props}
      >
        {isPlaying ? <PauseIcon size={size} /> : <PlayIcon size={size} />}
      </button>
    );
  },
);
PlayButton.displayName = "PlayButton";

interface IconProps {
  size?: "small" | "large" | null;
}

const PlayIcon = ({ size }: IconProps) => {
  if (size === "small") {
    return (
      <div className="w-3 h-3 relative flex items-center justify-center">
        <svg
          width="10"
          height="12"
          viewBox="0 0 10 12"
          fill="none"
          className="w-2.5 h-3"
        >
          <path
            d="M10 6L0 12L0 0L10 6Z"
            fill="currentColor"
            className="text-text-primary"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="w-7 h-7 relative flex items-center justify-center">
      <svg
        width="24"
        height="28"
        viewBox="0 0 24 28"
        fill="none"
        className="w-6 h-7"
      >
        <path
          d="M23.3997 14L0.599731 27.3L0.599733 0.700012L23.3997 14Z"
          fill="currentColor"
          className="text-text-primary"
        />
      </svg>
    </div>
  );
};

const PauseIcon = ({ size }: IconProps) => {
  if (size === "small") {
    return (
      <div className="w-3 h-3 relative">
        <div className="w-[3.43px] h-2.5 left-[1.29px] top-[0.86px] absolute bg-text-primary"></div>
        <div className="w-[3.43px] h-2.5 left-[7.29px] top-[0.86px] absolute bg-text-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-7 h-7 relative">
      <div className="w-2 h-6 left-[3px] top-[2px] absolute bg-text-primary"></div>
      <div className="w-2 h-6 left-[17px] top-[2px] absolute bg-text-primary"></div>
    </div>
  );
};

export { PlayButton, playButtonVariants };
