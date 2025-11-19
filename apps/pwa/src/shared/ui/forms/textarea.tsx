import { forwardRef, useEffect, useRef, useImperativeHandle } from "react";
import { cn } from "@/shared/lib";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  labelPosition?: "top" | "left" | "inner";
  autoResize?: boolean;
  caption?: string;
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
      caption,
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

    // Inner label layout
    if (labelPosition === "inner" && label) {
      return (
        <div className="relative w-full">
          <div className="flex flex-col gap-1 rounded-lg bg-gray-800 px-4 py-2">
            <label className="text-text-secondary flex items-center gap-1.5 text-xs font-medium">
              <span>
                {label}
                {required && (
                  <span className="text-status-required ml-1">*</span>
                )}
              </span>
            </label>
            <textarea
              ref={internalRef}
              required={required}
              className={cn(
                "text-text-primary placeholder:text-text-placeholder min-h-[120px] bg-transparent text-base transition-colors outline-none",
                // Resize behavior
                autoResize ? "resize-none overflow-hidden" : "resize-vertical",
                // Disabled styles
                "disabled:cursor-not-allowed disabled:opacity-50",
                className,
              )}
              {...props}
            />
          </div>
          {/* Error message */}
          {error && (
            <p className="text-status-destructive-light mt-1 text-xs">
              {error}
            </p>
          )}
          {/* Caption */}
          {!error && caption && (
            <p className="text-text-secondary mt-1 pl-2 text-xs">{caption}</p>
          )}
        </div>
      );
    }

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
        {/* Caption */}
        {!error && caption && (
          <p className="text-text-secondary mt-1 pl-2 text-xs">{caption}</p>
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
          "flex w-full",
          labelPosition === "top"
            ? "flex-col gap-2"
            : "flex-row items-start gap-4",
        )}
      >
        <label className="text-text-secondary text-xs font-medium">
          {label}
          {required && <span className="text-status-required ml-1">*</span>}
        </label>
        {textareaElement}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
