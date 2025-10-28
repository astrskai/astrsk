import { forwardRef } from "react";
import { cn } from "@/shared/lib";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  labelPosition?: "top" | "left";
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { label, error, labelPosition = "top", className, required, ...props },
    ref,
  ) => {
    const textareaElement = (
      <div className="relative w-full">
        <textarea
          ref={ref}
          required={required}
          className={cn(
            // Base styles
            "bg-background-surface-4 text-text-primary placeholder:text-text-placeholder resize-vertical min-h-[120px] w-full rounded-lg border px-4 py-3 text-base transition-colors focus:ring-2 focus:outline-none",
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
        <label className="text-text-primary text-sm font-medium">
          {label}
          {required && <span className="text-status-required ml-1">*</span>}
        </label>
        {textareaElement}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
