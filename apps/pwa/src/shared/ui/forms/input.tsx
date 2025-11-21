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

// Shared style constants
const STYLES = {
  input: {
    base: "text-text-primary placeholder:text-text-placeholder w-full rounded-lg border bg-gray-800 px-4 py-3 text-base outline-none",
    focus: "focus:ring-2 focus:ring-offset-0",
    transition: "transition-all",
    disabled: "disabled:cursor-not-allowed disabled:opacity-50",
  },
  border: {
    error:
      "border-status-destructive-light focus:border-status-destructive-light focus:ring-status-destructive-light/20",
    normal: "border-gray-500 focus:border-primary-normal focus:ring-primary-normal/20",
  },
  label: {
    floating: "absolute top-0 left-3 -translate-y-1/2 rounded-sm bg-gray-800 px-1 text-xs font-medium transition-all pointer-events-none",
    standard: "text-text-body flex items-center gap-1.5 text-sm font-medium",
  },
  text: {
    error: "text-status-destructive-light",
    secondary: "text-text-secondary",
    required: "text-status-required ml-1",
    small: "mt-1 text-xs",
    caption: "mt-1 pl-2 text-xs",
  },
  helpIcon: {
    base: "cursor-help transition-colors pointer-events-auto",
    size: "h-3.5 w-3.5",
    sizeStandard: "h-4 w-4",
    colors: "text-text-secondary hover:text-text-primary",
  },
} as const;

// Sub-components
const RequiredIndicator = () => (
  <span className={STYLES.text.required}>*</span>
);

const HelpTooltipIcon = ({
  tooltip,
  size = "standard",
}: {
  tooltip: string;
  size?: "small" | "standard";
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle
          className={cn(
            STYLES.helpIcon.base,
            STYLES.helpIcon.colors,
            size === "small" ? STYLES.helpIcon.size : STYLES.helpIcon.sizeStandard,
          )}
        />
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const FeedbackMessages = ({
  error,
  helperText,
  caption,
}: {
  error?: string;
  helperText?: string;
  caption?: string;
}) => (
  <>
    {error && (
      <p className={cn(STYLES.text.error, STYLES.text.small)}>{error}</p>
    )}
    {!error && helperText && (
      <p className={cn(STYLES.text.secondary, STYLES.text.small)}>{helperText}</p>
    )}
    {caption && (
      <p className={cn(STYLES.text.secondary, STYLES.text.caption)}>{caption}</p>
    )}
  </>
);

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
    const showRequiredIndicator = required || isRequired;

    // Shared input classes
    const inputClasses = cn(
      STYLES.input.base,
      STYLES.input.focus,
      STYLES.input.transition,
      STYLES.input.disabled,
      error ? STYLES.border.error : STYLES.border.normal,
      className,
    );

    // Inner label layout (floating label on border)
    if (label && labelPosition === "inner") {
      return (
        <div className="relative w-full">
          <input
            ref={ref}
            required={required}
            placeholder={props.placeholder || " "}
            className={inputClasses}
            {...props}
          />

          {/* Floating label on border */}
          <label
            className={cn(
              STYLES.label.floating,
              error ? STYLES.text.error : STYLES.text.secondary,
            )}
          >
            <span className="flex items-center gap-1.5">
              <span>
                {label}
                {showRequiredIndicator && <RequiredIndicator />}
              </span>
              {helpTooltip && <HelpTooltipIcon tooltip={helpTooltip} size="small" />}
            </span>
          </label>

          <FeedbackMessages error={error} helperText={helperText} caption={caption} />
        </div>
      );
    }

    // Input element with feedback (no label or top/left label)
    const inputElement = (
      <div className="relative w-full">
        <input ref={ref} required={required} className={inputClasses} {...props} />
        <FeedbackMessages error={error} helperText={helperText} caption={caption} />
      </div>
    );

    // No label - return input only
    if (!label) {
      return inputElement;
    }

    // With label (top or left)
    return (
      <div
        className={cn(
          "flex",
          labelPosition === "top" ? "flex-col gap-2" : "flex-row items-center gap-4",
        )}
      >
        <label className={STYLES.label.standard}>
          <span>
            {label}
            {showRequiredIndicator && <RequiredIndicator />}
          </span>
          {helpTooltip && <HelpTooltipIcon tooltip={helpTooltip} />}
        </label>
        {inputElement}
      </div>
    );
  },
);

Input.displayName = "Input";
