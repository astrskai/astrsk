import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import * as React from "react";

import { cn } from "@/shared/lib";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-button-background-primary text-button-foreground-primary shadow-[0px_1px_2px_0px_rgba(0,0,0,0.06)] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.10)] hover:bg-primary-strong hover:text-button-foreground-primary hover:shadow-[0px_1px_2px_0px_rgba(0,0,0,0.06)] hover:shadow-[0px_1px_3px_0px_rgba(0,0,0,0.10)] disabled:bg-button-foreground-disabled disabled:text-button-background-disabled disabled:opacity-50",
        destructive:
          "bg-status-error text-fg-default shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:bg-status-error/90 disabled:opacity-50",
        outline:
          "bg-transparent text-button-background-primary shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-button-background-primary hover:bg-surface-overlay hover:text-button-background-primary disabled:bg-transparent disabled:text-button-background-primary disabled:opacity-50",
        secondary:
          "bg-hover text-fg-default font-semibold shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-border-subtle hover:bg-black/20 hover:text-fg-default hover:outline-0 disabled:bg-surface disabled:opacity-50 disabled:outline-0",
        ghost:
          "bg-transparent text-button-background-primary hover:bg-surface-raised hover:text-primary-strong disabled:opacity-50",
        ghost_white:
          "text-fg-default hover:text-fg-subtle disabled:opacity-50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 rounded-full px-4 py-2 text-sm leading-tight",
        sm: "h-7 rounded-full px-3 py-2 text-xs font-normal leading-none",
        lg: "h-10 rounded-full px-4 py-2 text-sm font-medium leading-tight",
        icon: "w-8 h-8 rounded-full px-4 py-2",
        "icon-lg": "w-11 h-11 rounded-full px-4 py-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          loading && "opacity-50 cursor-not-allowed",
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
