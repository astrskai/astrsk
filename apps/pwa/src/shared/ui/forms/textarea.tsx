import { forwardRef, useEffect, useRef, useImperativeHandle } from "react";
import { cn } from "@/shared/lib";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  labelPosition?: "top" | "left";
  autoResize?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      labelPosition = "top",
      className,
      required,
      autoResize = false,
      ...props
    },
    ref,
  ) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);

    // Expose the internal ref to the parent via forwardRef
    useImperativeHandle(ref, () => internalRef.current!);

    // Auto-resize logic
    useEffect(() => {
      if (!autoResize || !internalRef.current) return;

      const textarea = internalRef.current;

      const adjustHeight = () => {
        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = "auto";
        // Set height to scrollHeight to fit content
        textarea.style.height = `${textarea.scrollHeight}px`;
      };

      // Adjust on mount and when value changes
      adjustHeight();

      // Listen to input events for real-time adjustment
      textarea.addEventListener("input", adjustHeight);

      return () => {
        textarea.removeEventListener("input", adjustHeight);
      };
    }, [autoResize, props.value]);

    const textareaElement = (
      <div className="relative w-full">
        <textarea
          ref={internalRef}
          required={required}
          className={cn(
            // Base styles
            "text-text-primary placeholder:text-text-placeholder min-h-[120px] w-full rounded-lg border bg-gray-800 px-4 py-3 text-base transition-colors focus:ring-2 focus:outline-none",
            // Resize behavior
            autoResize ? "resize-none overflow-hidden" : "resize-vertical",
            // Border and focus styles
            error
              ? "border-status-destructive-light focus:border-status-destructive-light focus:ring-status-destructive-light/20"
              : "border-border focus:border-primary-normal focus:ring-primary-normal/20",
            // Disabled styles
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        />
        {/* Error message */}
        {error && (
          <p className="text-status-destructive-light mt-1 text-xs">{error}</p>
        )}
      </div>
    );

    // If no label, return textarea only
    if (!label) {
      return textareaElement;
    }

    // With label
    return (
      <div
        className={cn(
          "flex",
          labelPosition === "top"
            ? "flex-col gap-2"
            : "flex-row items-start gap-4",
        )}
      >
        <label className="text-text-secondary text-sm font-medium">
          {label}
          {required && <span className="text-status-required ml-1">*</span>}
        </label>
        {textareaElement}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
