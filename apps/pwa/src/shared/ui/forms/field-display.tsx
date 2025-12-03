import { cn } from "@/shared/lib";

interface FieldDisplayProps {
  label?: string;
  value?: string | number | null;
  labelPosition?: "top" | "left" | "inner";
  className?: string;
  emptyText?: string;
}

// Shared style constants - matching Input component (no border for view mode)
const STYLES = {
  field: {
    base: "w-full rounded-lg bg-surface-raised text-fg-default",
    size: {
      sm: "px-2 py-1.5 text-xs min-h-[30px]",
      md: "px-3 py-2 text-sm min-h-[38px]",
      lg: "px-4 py-3 text-base min-h-[46px]",
    },
  },
  label: {
    floating:
      "absolute top-0 left-3 -translate-y-1/2 rounded-sm bg-canvas px-1 text-xs font-medium transition-all pointer-events-none",
    standard: "flex items-center gap-1.5 text-sm font-medium text-fg-muted",
  },
  text: {
    secondary: "text-fg-subtle",
    empty: "text-fg-subtle italic",
  },
} as const;

/**
 * FieldDisplay - Read-only display that matches Input styling
 * Same size and spacing as Input component but shows value as text
 */
export function FieldDisplay({
  label,
  value,
  labelPosition = "top",
  className,
  emptyText = "—",
}: FieldDisplayProps) {
  const displayValue = value ?? emptyText;
  const isEmpty = !value;

  const fieldClasses = cn(
    STYLES.field.base,
    STYLES.field.size.md,
    "flex items-center",
    className,
  );

  // Inner label layout (floating label on border) - matches Input "inner" layout
  if (label && labelPosition === "inner") {
    return (
      <div className="relative w-full">
        <div className={fieldClasses}>
          <span className={isEmpty ? STYLES.text.empty : ""}>
            {displayValue}
          </span>
        </div>

        {/* Floating label on border */}
        <label className={cn(STYLES.label.floating, STYLES.text.secondary)}>
          {label}
        </label>
      </div>
    );
  }

  // Field element (no label or top/left label)
  const fieldElement = (
    <div className={fieldClasses}>
      <span className={isEmpty ? STYLES.text.empty : ""}>{displayValue}</span>
    </div>
  );

  // No label - return field only
  if (!label) {
    return fieldElement;
  }

  // With label (top or left)
  return (
    <div
      className={cn(
        "flex",
        labelPosition === "top"
          ? "flex-col gap-2"
          : "flex-row items-center gap-4",
      )}
    >
      <label className={STYLES.label.standard}>{label}</label>
      {fieldElement}
    </div>
  );
}

interface TextDisplayProps {
  label?: string;
  value?: string | null;
  labelPosition?: "top" | "left" | "inner";
  className?: string;
  emptyText?: string;
}

// Shared style constants - matching Textarea component (no border for view mode)
const TEXTAREA_STYLES = {
  field: {
    base: "w-full min-h-[120px] rounded-lg bg-surface-raised px-4 py-3 text-base text-fg-default",
  },
  label: {
    floating:
      "absolute left-3 top-0 -translate-y-1/2 rounded-sm bg-neutral-800 px-1 text-xs font-medium transition-all pointer-events-none",
    standard: "text-sm font-medium text-neutral-200",
  },
  text: {
    secondary: "text-neutral-400",
    empty: "text-fg-subtle italic",
  },
} as const;

/**
 * TextDisplay - Read-only display that matches Textarea styling
 * Same size and spacing as Textarea component but shows value as text
 */
export function TextDisplay({
  label,
  value,
  labelPosition = "top",
  className,
  emptyText = "No content",
}: TextDisplayProps) {
  const displayValue = value ?? emptyText;
  const isEmpty = !value;

  const fieldClasses = cn(
    TEXTAREA_STYLES.field.base,
    className,
  );

  // Inner label layout (floating label on border) - matches Textarea "inner" layout
  if (labelPosition === "inner" && label) {
    return (
      <div className="relative w-full">
        <div className={fieldClasses}>
          <span
            className={cn(
              "whitespace-pre-wrap",
              isEmpty ? TEXTAREA_STYLES.text.empty : "",
            )}
          >
            {displayValue}
          </span>
        </div>

        {/* Floating label on border */}
        <label
          className={cn(
            TEXTAREA_STYLES.label.floating,
            TEXTAREA_STYLES.text.secondary,
          )}
        >
          {label}
        </label>
      </div>
    );
  }

  // Field element (no label or top/left label)
  const fieldElement = (
    <div className={fieldClasses}>
      <span
        className={cn(
          "whitespace-pre-wrap",
          isEmpty ? TEXTAREA_STYLES.text.empty : "",
        )}
      >
        {displayValue}
      </span>
    </div>
  );

  // No label - return field only
  if (!label) {
    return fieldElement;
  }

  // With label (top or left)
  return (
    <div
      className={cn(
        "flex w-full",
        labelPosition === "top"
          ? "flex-col gap-2"
          : "flex-row items-start gap-4",
      )}
    >
      <label className={TEXTAREA_STYLES.label.standard}>{label}</label>
      {fieldElement}
    </div>
  );
}
