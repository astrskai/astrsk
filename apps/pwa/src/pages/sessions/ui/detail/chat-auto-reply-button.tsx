import { useCallback } from "react";
import { Shuffle, RotateCw } from "lucide-react";
import { AutoReply } from "@/shared/stores/session-store";

interface ChatAutoReplyButtonProps {
  characterCount: number;
  autoReply: AutoReply;
  onAutoReply: (autoReply: AutoReply) => void;
}

export default function ChatAutoReplyButton({
  characterCount,
  autoReply,
  onAutoReply,
}: ChatAutoReplyButtonProps) {
  const hasMultipleCharacters = characterCount > 1;

  const handleAutoReply = useCallback(() => {
    switch (autoReply) {
      case AutoReply.Off:
        onAutoReply(AutoReply.Random);
        break;
      case AutoReply.Random:
        // Skip Rotate option if only one character
        onAutoReply(hasMultipleCharacters ? AutoReply.Rotate : AutoReply.Off);
        break;
      case AutoReply.Rotate:
        onAutoReply(AutoReply.Off);
        break;
      default:
        throw new Error("Unknown auto reply");
    }
  }, [autoReply, onAutoReply, hasMultipleCharacters]);

  return (
    <div className="flex min-w-[107px] flex-col items-center gap-1">
      <button
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-50 bg-gray-50/20 text-base font-semibold text-gray-50 hover:bg-gray-50/30"
        onClick={handleAutoReply}
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
