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
   * Button text
   */
  children: React.ReactNode;
  /**
   * Button variant
   */
  variant?: "default" | "secondary" | "ghost" | "destructive" | "outline";
  /**
   * Button size
   */
  size?: "sm" | "md" | "lg";
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
          "focus:ring-primary/50 inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-medium transition-colors focus:outline-none focus:ring-1",
          // Size styles
          {
            "px-3 py-1.5 text-xs": size === "sm",
            "px-4 py-2 text-sm": size === "md",
            "px-6 py-3 text-base": size === "lg",
          },
          // Variant styles
          {
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
        {children}
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
