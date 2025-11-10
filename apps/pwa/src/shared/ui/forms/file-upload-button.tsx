import { Pen } from "lucide-react";
import { useId } from "react";
import { cn } from "@/shared/lib";

interface FileUploadButtonProps {
  /**
   * Accepted file types (e.g., ".jpg,.png,.webp")
   */
  accept?: string;
  /**
   * Callback when file is selected
   */
  onChange: (file: File) => void;
  /**
   * Button text (ignored if iconOnly is true)
   */
  children?: React.ReactNode;
  /**
   * Button variant
   */
  variant?: "default" | "secondary" | "ghost" | "destructive" | "outline";
  /**
   * Button size
   */
  size?: "sm" | "md" | "lg";
  /**
   * Icon-only mode (shows Pen icon instead of text)
   */
  iconOnly?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Disabled state
   */
  disabled?: boolean;
}

/**
 * File Upload Button Component
 *
 * A styled button that triggers file upload using native HTML label + input pattern.
 * This avoids the need for useRef and provides better accessibility.
 *
 * @example
 * ```tsx
 * <FileUploadButton
 *   accept=".jpg,.png,.webp"
 *   onChange={(file) => handleFileUpload(file)}
 *   size="lg"
 * >
 *   Upload Image
 * </FileUploadButton>
 * ```
 */
export function FileUploadButton({
  accept,
  onChange,
  children,
  variant = "default",
  size = "md",
  iconOnly = false,
  className,
  disabled = false,
}: FileUploadButtonProps) {
  const inputId = useId();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    onChange(file);

    // Reset input value to allow selecting the same file again
    event.target.value = "";
  };

  return (
    <>
      <label
        htmlFor={inputId}
        className={cn(
          // Base styles
          "focus:ring-primary/50 inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-medium transition-colors focus:ring-1 focus:outline-none",
          // Icon-only mode or text mode
          iconOnly
            ? {
                "border-2 border-gray-100 bg-gray-700 p-2 hover:bg-gray-500":
                  size === "sm",
                "border-2 border-gray-700 bg-gray-700 p-2.5 hover:bg-gray-500":
                  size === "md",
                "border-2 border-gray-700 bg-gray-700 p-3 hover:bg-gray-500":
                  size === "lg",
              }
            : {
                "px-3 py-1.5 text-xs": size === "sm",
                "px-4 py-2 text-sm": size === "md",
                "px-6 py-3 text-base": size === "lg",
              },
          // Variant styles (only applied when not icon-only)
          !iconOnly && {
            "bg-button-background-primary hover:bg-primary-strong text-button-foreground-primary":
              variant === "default",
            "bg-background-surface-4 text-text-primary hover:bg-background-surface-3":
              variant === "secondary",
            "text-button-background-primary hover:bg-background-surface-2 hover:text-primary-strong bg-transparent":
              variant === "ghost",
            "bg-status-destructive text-text-primary hover:bg-status-destructive/90":
              variant === "destructive",
            "border-button-background-primary text-button-background-primary hover:bg-button-background-primary hover:text-button-foreground-primary border-1 bg-transparent":
              variant === "outline",
          },
          // Disabled state
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
        aria-disabled={disabled}
      >
        {iconOnly ? (
          <Pen size={12} strokeWidth={2.5} className="text-gray-100" />
        ) : (
          children
        )}
      </label>
      <input
        id={inputId}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
      />
    </>
  );
}
