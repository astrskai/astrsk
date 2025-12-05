import { memo, useMemo } from "react";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import Markdown from "react-markdown";
import remarkBreaks from "remark-breaks";

interface ChatMarkdownProps {
  content: string;
  contentColor: string;
  boldColor?: string;
  italicColor?: string;
  className?: string;
}

/**
 * Reusable Markdown component for chat messages with consistent styling.
 * Used for both streaming and non-streaming content display.
 */
export const ChatMarkdown = memo(function ChatMarkdown({
  content,
  contentColor,
  boldColor,
  italicColor,
  className,
}: ChatMarkdownProps) {
  const components = useMemo(
    () => ({
      p: ({ children }: { children?: React.ReactNode }) => (
        <p style={{ color: contentColor }}>{children}</p>
      ),
      strong: ({ children }: { children?: React.ReactNode }) => (
        <strong style={{ color: boldColor ?? contentColor }}>{children}</strong>
      ),
      em: ({ children }: { children?: React.ReactNode }) => (
        <em style={{ color: italicColor ?? contentColor }}>{children}</em>
      ),
      pre: ({ children }: { children?: React.ReactNode }) => (
        <pre
          tabIndex={0}
          className="my-2 max-w-full overflow-x-auto rounded-md p-3"
        >
          {children}
        </pre>
      ),
      code: ({
        children,
        className,
      }: {
        children?: React.ReactNode;
        className?: string;
      }) => {
        const isInlineCode = !className;
        return isInlineCode ? (
          <code className="rounded px-1 py-0.5 text-sm">{children}</code>
        ) : (
          <code className="text-sm break-words whitespace-pre-wrap">
            {children}
          </code>
        );
      },
    }),
    [contentColor, boldColor, italicColor],
  );

  return (
    <Markdown
      className={className ? `markdown ${className}` : "markdown"}
      remarkPlugins={[remarkBreaks]}
      rehypePlugins={[rehypeRaw, rehypeSanitize]}
      components={components}
    >
      {content}
    </Markdown>
  );
});
