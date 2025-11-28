import { forwardRef, useEffect, useRef, useImperativeHandle } from "react";
import { cn } from "@/shared/lib";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  labelPosition?: "top" | "left" | "inner";
  autoResize?: boolean;
  caption?: string;
  isRequired?: boolean; // For display purposes only (shows * indicator)
}

// Shared style constants
const STYLES = {
  textarea: {
    base: "w-full min-h-[120px] rounded-lg border bg-surface-raised px-4 py-3 text-base text-fg-default placeholder:text-fg-subtle outline-none",
    focus: "focus:ring-2 focus:ring-offset-0",
    transition: "transition-all",
    disabled: "disabled:cursor-not-allowed disabled:opacity-50",
  },
  resize: {
    auto: "resize-none overflow-hidden",
    manual: "resize-vertical",
  },
  border: {
    error:
      "border-status-error focus:border-status-error focus:ring-status-error/20",
    normal: "border-neutral-700 focus:border-brand-500 focus:ring-brand-500/20",
  },
  label: {
    floating:
      "absolute left-3 top-0 -translate-y-1/2 rounded-sm bg-neutral-800 px-1 text-xs font-medium transition-all pointer-events-none",
    standard: "text-sm font-medium text-neutral-200",
  },
  text: {
    error: "text-status-error",
    secondary: "text-neutral-400",
    required: "text-accent-purple ml-1",
    small: "mt-1 text-xs",
    caption: "mt-1 pl-2 text-xs",
  },
} as const;

// Sub-components
const RequiredIndicator = () => <span className={STYLES.text.required}>*</span>;

const FeedbackMessages = ({
  error,
  caption,
}: {
  error?: string;
  caption?: string;
}) => (
  <>
    {error && (
      <p className={cn(STYLES.text.error, STYLES.text.small)}>{error}</p>
    )}
    {!error && caption && (
      <p className={cn(STYLES.text.secondary, STYLES.text.caption)}>
        {caption}
      </p>
    )}
  </>
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      labelPosition = "top",
      className,
      required,
      isRequired,
      autoResize = false,
      caption,
      ...props
    },
    ref,
  ) => {
    const showRequiredIndicator = required || isRequired;
    const internalRef = useRef<HTMLTextAreaElement>(null);

    // Expose the internal ref to the parent via forwardRef
    useImperativeHandle(ref, () => internalRef.current!);

    // Auto-resize logic
    useEffect(() => {
      if (!autoResize || !internalRef.current) return;

      const textarea = internalRef.current;

      const adjustHeight = () => {
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
      };

      adjustHeight();
      textarea.addEventListener("input", adjustHeight);

      return () => {
        textarea.removeEventListener("input", adjustHeight);
      };
    }, [autoResize, props.value]);

    // Shared textarea classes
    const textareaClasses = cn(
      STYLES.textarea.base,
      STYLES.textarea.focus,
      STYLES.textarea.transition,
      STYLES.textarea.disabled,
      autoResize ? STYLES.resize.auto : STYLES.resize.manual,
      error ? STYLES.border.error : STYLES.border.normal,
      className,
    );

    // Inner label layout (floating label on border)
    if (labelPosition === "inner" && label) {
      return (
        <div className="relative w-full">
          <textarea
            ref={internalRef}
            required={required}
            placeholder={props.placeholder || " "}
            className={textareaClasses}
            {...props}
          />

          {/* Floating label on border */}
          <label
            className={cn(
              STYLES.label.floating,
              error ? STYLES.text.error : STYLES.text.secondary,
            )}
          >
            {label}
            {showRequiredIndicator && <RequiredIndicator />}
          </label>

          <FeedbackMessages error={error} caption={caption} />
        </div>
      );
    }

    // Textarea element with feedback (no label or top/left label)
    const textareaElement = (
      <div className="relative w-full">
        <textarea
          ref={internalRef}
          required={required}
          className={textareaClasses}
          {...props}
        />
        <FeedbackMessages error={error} caption={caption} />
      </div>
    );

    // No label - return textarea only
    if (!label) {
      return textareaElement;
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
        <label className={STYLES.label.standard}>
          {label}
          {showRequiredIndicator && <RequiredIndicator />}
        </label>
        {textareaElement}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
