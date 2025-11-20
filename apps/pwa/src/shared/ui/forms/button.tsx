import { forwardRef } from "react";
import { cn } from "@/shared/lib";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "ghost" | "destructive" | "outline";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  loading?: boolean;
  children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "default",
      size = "md",
      icon,
      loading = false,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    // Icon-only button: no children, only icon
    const isIconOnly = icon && !children;

    // Show loading spinner or icon
    const displayIcon = loading ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : (
      icon
    );

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          // Base styles
          "focus:ring-primary/50 inline-flex cursor-pointer items-center justify-center rounded-full font-medium transition-colors focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          // Gap only when both icon and children exist
          !isIconOnly && "gap-2",
          // Size styles - different for icon-only vs with text
          isIconOnly
            ? {
                "h-8 w-8 p-0": size === "sm",
                "h-10 w-10 p-0": size === "md",
                "h-12 w-12 p-0": size === "lg",
              }
            : {
                "px-3 py-1.5 text-xs": size === "sm",
                "px-4 py-2 text-sm": size === "md",
                "px-6 py-3 text-base": size === "lg",
              },
          // Variant styles
          {
            "bg-button-background-primary hover:bg-primary-strong text-button-foreground-primary":
              variant === "default",
            "border border-gray-500 bg-gray-800 text-gray-50 hover:bg-gray-700":
              variant === "secondary",
            "text-button-background-primary hover:bg-background-surface-2 hover:text-primary-strong bg-transparent":
              variant === "ghost",
            "bg-status-destructive text-text-primary hover:bg-status-destructive/90":
              variant === "destructive",
            "border-button-background-primary text-button-background-primary hover:bg-button-background-primary hover:text-button-foreground-primary border-1 bg-transparent":
              variant === "outline",
          },
          className,
        )}
        {...props}
      >
        {displayIcon}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
