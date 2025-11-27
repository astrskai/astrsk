import { ChartNoAxesColumnIncreasing } from "lucide-react";
import { cn } from "@/shared/lib";

interface ChatStatsButtonProps {
  isOpen: boolean;
  className?: string;
  onOpenStats: (isOpen: boolean) => void;
}

const ChatStatsButton = ({
  isOpen = false,
  className,
  onOpenStats,
}: ChatStatsButtonProps) => {
  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <button
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg border border-gray-50/10 text-base font-semibold text-gray-50 hover:bg-gray-50/30",
          isOpen ? "bg-gray-50" : "bg-gray-50/20",
        )}
        onClick={() => {
          onOpenStats(!isOpen);
        }}
        aria-label="Toggle statistics panel"
        aria-pressed={isOpen}
      >
        <ChartNoAxesColumnIncreasing
          className={cn("h-5 w-5", isOpen && "text-gray-900")}
        />
      </button>

      <div className="text-center text-[9px] font-semibold text-gray-100">
        Stats
      </div>
    </div>
  );
};

export default ChatStatsButton;
