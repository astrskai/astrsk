import { forwardRef } from "react";
import { cn } from "@/shared/lib";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "ghost" | "destructive" | "outline" | "accent" | "link";
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
        aria-busy={loading}
        aria-live={loading ? "polite" : undefined}
        className={cn(
          // Base styles
          "inline-flex cursor-pointer items-center justify-center rounded-lg font-medium transition-colors focus:ring-1 focus:ring-brand-500/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
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
            "border border-brand-600 bg-brand-600 text-white hover:bg-brand-500 hover:border-brand-500":
              variant === "default",
            "border border-zinc-700 bg-zinc-900 text-neutral-100 hover:bg-zinc-800":
              variant === "secondary",
            "bg-transparent text-brand-500 hover:bg-neutral-800 hover:text-brand-400":
              variant === "ghost",
            "bg-status-error text-white hover:bg-status-error/90":
              variant === "destructive",
            "border border-brand-500 bg-transparent text-brand-500 hover:bg-brand-500 hover:text-white":
              variant === "outline",
            "border border-brand-400 bg-brand-500 text-white hover:bg-brand-400 hover:border-brand-300":
              variant === "accent",
            "bg-transparent text-brand-500 underline-offset-4 hover:underline":
              variant === "link",
          },
          className,
        )}
        {...props}
      >
        {displayIcon}
        {children}
        {loading && <span className="sr-only">Loading</span>}
      </button>
    );
  },
);

Button.displayName = "Button";
