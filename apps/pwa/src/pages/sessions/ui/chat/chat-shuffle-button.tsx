import { Shuffle } from "lucide-react";
import { useCallback } from "react";

import { cn } from "@/shared/lib";

interface ChatShuffleButtonProps {
  onClick: () => void;
  isDisabled?: boolean;
  className?: string;
}

export default function ChatShuffleButton({
  onClick,
  isDisabled,
  className,
}: ChatShuffleButtonProps) {
  const handleClick = useCallback(() => {
    if (isDisabled) return;

    onClick();
  }, [onClick, isDisabled]);

  return (
    <div
      className={cn(
        "group/shuffle flex flex-col items-center gap-2",
        isDisabled && "pointer-events-none cursor-default opacity-50",
        className,
      )}
    >
      <button
        type="button"
        className="flex h-12 w-12 items-center justify-center rounded-full border border-fg-default/30 bg-fg-default/10 hover:bg-fg-default/20"
        onClick={handleClick}
        disabled={isDisabled}
      >
        <Shuffle className="h-6 w-6" />
      </button>

      <span className="text-xs text-fg-muted group-hover/shuffle:text-fg-default">
        Shuffle
      </span>
    </div>
  );
}
