import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/components-v2/lib/utils";

const buttonPillVariants = cva(
  "rounded-lg shadow-[0px_1px_8px_0px_rgba(117,117,117,1.00)] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] outline outline-1 outline-offset-[-1px] outline-border-light inline-flex justify-center items-center transition-all",
  {
    variants: {
      variant: {
        default: "bg-background-surface-4 hover:bg-background-surface-5",
      },
      size: {
        default: "px-3 py-2 gap-2",
        lg: "px-6 py-3 gap-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const iconVariants = cva("relative overflow-hidden", {
  variants: {
    size: {
      default: "w-4 h-4",
      lg: "w-6 h-6",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

const iconInnerVariants = cva("absolute", {
  variants: {
    size: {
      default:
        "w-3.5 h-3 left-[1.33px] top-[2px] outline outline-[1.33px] outline-offset-[-0.67px]",
      lg: "w-5 h-4 left-[2px] top-[3px] outline outline-2 outline-offset-[-1px]",
    },
    variant: {
      default: "outline-text-primary",
      active: "outline-text-contrast-text",
    },
  },
  defaultVariants: {
    size: "default",
    variant: "default",
  },
});

const textVariants = cva("text-center font-semibold", {
  variants: {
    size: {
      default: "text-xs",
      lg: "text-base leading-relaxed",
    },
    variant: {
      default: "text-text-primary",
      active: "text-text-contrast-text",
    },
  },
  defaultVariants: {
    size: "default",
    variant: "default",
  },
});

export interface ButtonPillProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonPillVariants> {
  icon?: React.ReactNode;
  iconClassName?: string;
  active?: boolean;
  onDoubleClick?: () => void;
}

const ButtonPill = React.forwardRef<HTMLButtonElement, ButtonPillProps>(
  (
    {
      className,
      variant,
      size,
      icon,
      iconClassName,
      active,
      onDoubleClick,
      children,
      ...props
    },
    ref,
  ) => {
    const [isPressed, setIsPressed] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);
    const isActive = active || isPressed;

    return (
      <button
        className={cn(
          buttonPillVariants({ variant, size }),
          isActive &&
            "bg-background-surface-light shadow-[0px_1px_12px_0px_rgba(117,117,117,1.00)]",
          isActive && isHovered && "opacity-70",
          className,
        )}
        ref={ref}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => {
          setIsPressed(false);
          setIsHovered(false);
        }}
        onMouseEnter={() => setIsHovered(true)}
        // onDoubleClick={onDoubleClick}
        {...props}
      >
        {icon && (
          <div className={iconVariants({ size })}>
            {React.cloneElement(icon as React.ReactElement, {
              className: cn(
                size === "lg"
                  ? "min-w-5 min-h-4"
                  : "max-w-3.5 max-h-3 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
                isActive ? "text-text-contrast-text" : "text-text-primary",
                "stroke-2",
              ),
            })}
          </div>
        )}
        <span
          className={textVariants({
            size,
            variant: isActive ? "active" : "default",
          })}
        >
          {children}
        </span>
      </button>
    );
  },
);
ButtonPill.displayName = "ButtonPill";

export { ButtonPill, buttonPillVariants };
