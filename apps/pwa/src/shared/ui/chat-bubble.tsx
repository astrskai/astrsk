import { cn } from "@/shared/lib";

interface ChatBubbleProps {
  children: React.ReactNode;
  direction?: "left" | "right";
  className?: string;
  style?: React.CSSProperties;
}

export function ChatBubble({
  children,
  direction,
  className,
  style,
}: ChatBubbleProps) {
  return (
    <div
      className={cn(
        "text-text-secondary w-fit max-w-full bg-gray-800 p-3 text-[14px] break-words md:p-4 md:text-base",
        direction === "left"
          ? "rounded-tl-sm rounded-tr-2xl rounded-br-2xl rounded-bl-2xl"
          : direction === "right"
            ? "rounded-tl-2xl rounded-tr-md rounded-br-2xl rounded-bl-2xl"
            : "rounded-2xl",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}
