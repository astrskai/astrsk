import { forwardRef } from "react";
import { HelpCircle } from "lucide-react";
import { cn } from "@/shared/lib";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  labelPosition?: "top" | "left" | "inner";
  helpTooltip?: string;
  helperText?: string;
  caption?: string;
  isRequired?: boolean; // For display purposes only (shows * indicator)
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      labelPosition = "top",
      className,
      required,
      isRequired,
      helpTooltip,
      helperText,
      caption,
      ...props
    },
    ref,
  ) => {
    // Show * indicator if either required or isRequired is true
    const showRequiredIndicator = required || isRequired;
    // Inner label layout (floating label on border)
    if (labelPosition === "inner") {
      return (
        <div className="relative w-full">
          {/* Input field with consistent padding */}
          <input
            ref={ref}
            required={required}
            placeholder={props.placeholder || " "} // Space ensures label floats even when empty
            className={cn(
              // Base styles with consistent padding
              "text-text-primary placeholder:text-text-placeholder w-full rounded-lg border bg-gray-800 px-4 py-3 text-base transition-all outline-none",
              // Focus styles
              "focus:ring-2 focus:ring-offset-0",
              // Border and ring colors
              error
                ? "border-status-destructive-light focus:border-status-destructive-light focus:ring-status-destructive-light/20"
                : "border-border-normal focus:border-primary-normal focus:ring-primary-normal/20",
              // Disabled styles
              "disabled:cursor-not-allowed disabled:opacity-50",
              className,
            )}
            {...props}
          />

          {/* Floating label on border */}
          {label && (
            <label
              className={cn(
                // Positioning: absolute positioned on top border
                "absolute left-3 top-0 -translate-y-1/2",
                // Visual styles
                "bg-gray-800 px-1 text-xs font-medium transition-all rounded-sm",
                // Text color
                error
                  ? "text-status-destructive-light"
                  : "text-text-secondary",
                // Pointer events to allow clicking through to input
                "pointer-events-none",
              )}
            >
              <span className="flex items-center gap-1.5">
                <span>
                  {label}
                  {showRequiredIndicator && (
                    <span className="text-status-required ml-1">*</span>
                  )}
                </span>
                {helpTooltip && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="text-text-secondary hover:text-text-primary pointer-events-auto h-3.5 w-3.5 cursor-help transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{helpTooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </span>
            </label>
          )}

          {/* Error message */}
          {error && (
            <p className="text-status-destructive-light mt-1 text-xs">
              {error}
            </p>
          )}
          {/* Helper text */}
          {!error && helperText && (
            <p className="text-text-secondary mt-1 text-xs">{helperText}</p>
          )}
          {/* Caption */}
          {caption && (
            <p className="text-text-secondary mt-1 pl-2 text-xs">{caption}</p>
          )}
        </div>
      );
    }

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
        {/* Helper text */}
        {!error && helperText && (
          <p className="text-text-secondary mt-1 text-xs">{helperText}</p>
        )}
        {/* Caption */}
        {caption && (
          <p className="text-text-secondary mt-1 pl-2 text-xs">{caption}</p>
        )}
      </div>
    );

    // If no label, return input only
    if (!label) {
      return inputElement;
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
        <label className="text-text-body flex items-center gap-1.5 text-sm font-medium">
          <span>
            {label}
            {showRequiredIndicator && (
              <span className="text-status-required ml-1">*</span>
            )}
          </span>
          {helpTooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="text-text-secondary hover:text-text-primary h-4 w-4 cursor-help transition-colors" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{helpTooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </label>
        {inputElement}
      </div>
    );
  },
);

Input.displayName = "Input";
