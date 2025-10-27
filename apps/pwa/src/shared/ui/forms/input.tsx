import { forwardRef } from "react";
import { cn } from "@/shared/lib";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  labelPosition?: "top" | "left";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, labelPosition = "top", className, required, ...props },
    ref,
  ) => {
    const inputElement = (
      <div className="relative w-full">
        <input
          ref={ref}
          required={required}
          className={cn(
            // Base styles
            "bg-background-surface-0 text-text-primary placeholder:text-text-placeholder w-full rounded-lg border px-4 py-3 text-base transition-colors focus:ring-2 focus:outline-none",
            // Border and focus styles
            error
              ? "border-status-destructive-light focus:border-status-destructive-light focus:ring-status-destructive-light/20"
              : "border-border-normal focus:border-primary-normal focus:ring-primary-normal/20",
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

    // If no label, return input only
    if (!label) {
      return inputElement;
    }

    // With label
    return (
      <div
        className={cn(
          "flex",
          labelPosition === "top"
            ? "flex-col gap-2"
            : "flex-row items-center gap-4",
        )}
      >
        <label className="text-text-body text-sm font-medium">
          {label}
          {required && <span className="text-status-required ml-1">*</span>}
        </label>
        {inputElement}
      </div>
    );
  },
);

Input.displayName = "Input";
