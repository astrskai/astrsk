import { useCallback } from "react";
import { Shuffle, RotateCw } from "lucide-react";
import { AutoReply } from "@/shared/stores/session-store";
import { cn } from "@/shared/lib";

interface ChatAutoReplyButtonProps {
  autoReply: AutoReply;
  onAutoReply: () => void;
  className?: string;
}

export default function ChatAutoReplyButton({
  autoReply,
  onAutoReply,
  className,
}: ChatAutoReplyButtonProps) {
  return (
    <div
      className={cn(
        "flex min-w-[107px] flex-col items-center gap-1",
        className,
      )}
    >
      <button
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-50 bg-gray-50/20 text-base font-semibold text-gray-50 hover:bg-gray-50/30"
        onClick={onAutoReply}
      >
        {autoReply === AutoReply.Off ? (
          "Off"
        ) : autoReply === AutoReply.Random ? (
          <Shuffle className="h-5 w-5" />
        ) : autoReply === AutoReply.Rotate ? (
          <RotateCw className="h-5 w-5" />
        ) : (
          "-"
        )}
      </button>

      <div className="text-center text-xs font-semibold text-gray-100">
        <div>
          {autoReply === AutoReply.Off ? "Auto-reply off" : "Auto-reply on"}
        </div>

        <div className="font-normal">
          {autoReply === AutoReply.Random
            ? "Random character"
            : autoReply === AutoReply.Rotate
              ? "All characters"
              : ""}
        </div>
      </div>
    </div>
  );
}
