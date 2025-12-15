import { memo, ReactNode } from "react";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkBreaks from "remark-breaks";
import { cn } from "@/shared/lib";

interface ScenarioMessageBoxProps {
  content: string;
  name?: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
}

/**
 * Reusable scenario/first message box with consistent styling.
 * Used for both selectable scenario items and chat messages.
 */
export const ScenarioMessageBox = memo(function ScenarioMessageBox({
  content,
  name,
  active = false,
  onClick,
  className,
  children,
}: ScenarioMessageBoxProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-start justify-start gap-2 self-stretch rounded-lg border-2 bg-surface-overlay p-4 backdrop-blur-3xl",
        active ? "border-accent-primary" : "border-transparent",
        onClick && "cursor-pointer",
        className,
      )}
      onClick={onClick}
    >
      {name && (
        <div className="text-fg-muted justify-start self-stretch text-base font-normal break-words">
          {name}
        </div>
      )}
      {content && (
        <Markdown
          remarkPlugins={[remarkBreaks]}
          rehypePlugins={[rehypeRaw, rehypeSanitize]}
          className="markdown text-fg-muted"
        >
          {content}
        </Markdown>
      )}
      {children}
    </div>
  );
});

export default ScenarioMessageBox;
