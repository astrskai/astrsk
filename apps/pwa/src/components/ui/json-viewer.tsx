/**
 * [CLEANUP-TODO] UNUSED COMPONENT
 * Last checked: 2025-10-22
 * Usage: None (except stories)
 * Action: Review for deletion
 */

import { useMemo } from "react";

interface JsonViewerProps {
  json: string;
  className?: string;
}

export function JsonViewer({ json, className = "" }: JsonViewerProps) {
  const formattedContent = useMemo(() => {
    try {
      // Parse and prettify JSON
      const parsed = JSON.parse(json);
      return JSON.stringify(parsed, null, 2);
    } catch {
      // If not valid JSON, return as is
      return json;
    }
  }, [json]);

  const highlightedContent = useMemo(() => {
    // Simple JSON syntax highlighting using our defined colors
    return (
      formattedContent
        // Keys - using red-300
        .replace(
          /"([^"]+)":/g,
          '<span style="color: var(--red-300); font-weight:500">"$1"</span>:',
        )
        // String values - using green-300
        .replace(
          /: "([^"]*)"/g,
          ': <span style="color: var(--text-primary)">"$1"</span>',
        )
        // Numbers - using orange-300
        .replace(
          /: (-?\d+\.?\d*)/g,
          ': <span style="color: var(--orange-300)">$1</span>',
        )
        // Booleans - using cyan-300
        .replace(
          /: (true|false)/g,
          ': <span style="color: var(--cyan-300)">$1</span>',
        )
        // Null - using violet-300
        .replace(
          /: (null)/g,
          ': <span style="color: var(--violet-300)">$1</span>',
        )
        // Arrays and objects - using amber-300
        .replace(
          /([[{}\]])/g,
          '<span style="color: var(--amber-300); font-weight: 600">$1</span>',
        )
    );
  }, [formattedContent]);

  return (
    <div className={`${className}`}>
      <pre
        className="m-0 bg-transparent p-4"
        style={{ color: "var(--text-body)" }}
      >
        <code
          className="block font-mono text-xs leading-relaxed break-words whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: highlightedContent }}
        />
      </pre>
    </div>
  );
}
