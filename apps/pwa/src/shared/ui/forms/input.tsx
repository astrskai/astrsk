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
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      labelPosition = "top",
      className,
      required,
      helpTooltip,
      helperText,
      ...props
    },
    ref,
  ) => {
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
            <input
              ref={ref}
              required={required}
              className={cn(
                "text-text-primary placeholder:text-text-placeholder bg-transparent text-base transition-colors outline-none",
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
          {/* Helper text */}
          {!error && helperText && (
            <p className="text-text-secondary mt-1 text-xs">{helperText}</p>
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
            {required && <span className="text-status-required ml-1">*</span>}
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
