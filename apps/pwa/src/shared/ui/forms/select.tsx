import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib";

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  helperText?: string;
  selectSize?: "sm" | "md" | "lg";
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      options,
      value,
      onChange,
      className,
      required,
      helperText,
      selectSize = "md",
      ...props
    },
    ref,
  ) => {
    // Find the selected option to display its icon
    const selectedOption = options.find((opt) => opt.value === String(value));
    const SelectedIcon = selectedOption?.icon;

    // Size-based styles for icon and chevron
    const iconSize = {
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
    }[selectSize];

    const iconLeftPosition = {
      sm: "left-2.5",
      md: "left-3",
      lg: "left-4",
    }[selectSize];

    const iconRightPosition = {
      sm: "right-2.5",
      md: "right-3",
      lg: "right-4",
    }[selectSize];

    const selectElement = (
      <div className={cn("relative", className)}>
        <div className="relative">
          {/* Icon for selected option */}
          {SelectedIcon && (
            <SelectedIcon
              className={cn(
                "pointer-events-none absolute top-1/2 -translate-y-1/2 text-gray-50",
                iconSize,
                iconLeftPosition,
              )}
            />
          )}
          <select
            ref={ref}
            value={value}
            onChange={onChange}
            required={required}
            className={cn(
              // Base styles
              "w-full appearance-none rounded-lg border bg-gray-800 text-gray-50 transition-colors focus:ring-2 focus:outline-none",
              // Size styles
              {
                "py-1.5 text-sm": selectSize === "sm",
                "py-3 text-base": selectSize === "md",
                "py-4 text-lg": selectSize === "lg",
              },
              // Left padding adjustment for icon
              SelectedIcon
                ? {
                    "pr-8 pl-8": selectSize === "sm",
                    "pr-10 pl-10": selectSize === "md",
                    "pr-12 pl-12": selectSize === "lg",
                  }
                : {
                    "pr-8 pl-3": selectSize === "sm",
                    "pr-10 pl-4": selectSize === "md",
                    "pr-12 pl-5": selectSize === "lg",
                  },
              // Border and focus styles
              error
                ? "border-status-destructive-light focus:border-status-destructive-light focus:ring-status-destructive-light/20"
                : "focus:border-primary-normal focus:ring-primary-normal/20 border-gray-500",
              // Disabled styles
              "disabled:cursor-not-allowed disabled:opacity-50",
              // Placeholder styles
              !value && "text-text-placeholder",
            )}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {/* Chevron icon */}
          <ChevronDown
            className={cn(
              "pointer-events-none absolute top-1/2 -translate-y-1/2 text-gray-50",
              iconSize,
              iconRightPosition,
            )}
          />
        </div>
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

    // If no label, return select only
    if (!label) {
      return selectElement;
    }

    // With label
    return (
      <div className="flex flex-col gap-2">
        <label className="text-text-body flex items-center gap-1.5 text-sm font-medium">
          <span>
            {label}
            {required && <span className="text-status-required ml-1">*</span>}
          </span>
        </label>
        {selectElement}
      </div>
    );
  },
);

Select.displayName = "Select";
