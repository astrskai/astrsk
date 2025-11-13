import { Shuffle } from "lucide-react";
import { useCallback } from "react";

import { cn } from "@/shared/lib";

interface ChatShuffleButtonProps {
  onClick: () => void;
  isDisabled?: boolean;
}

export default function ChatShuffleButton({
  onClick,
  isDisabled,
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
      )}
    >
      <button
        type="button"
        className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-50/30 bg-gray-50/10 hover:bg-gray-50/20"
        onClick={handleClick}
        disabled={isDisabled}
      >
        <Shuffle className="h-6 w-6" />
      </button>

      <span className="text-xs text-gray-200 group-hover/shuffle:text-gray-50">
        Shuffle
      </span>
    </div>
  );
}
