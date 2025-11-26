import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib";
import { SubscribeBadge } from "@/shared/ui";

const buttonPillVariants = cva(
  "relative rounded-lg shadow-[0px_1px_8px_0px_rgba(117,117,117,1.00)] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] outline outline-1 outline-offset-[-1px] outline-border-muted inline-flex justify-center items-center transition-all",
  {
    variants: {
      variant: {
        default: "bg-hover hover:bg-active",
        gradient: "relative",
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
      default: "outline-fg-default",
      active: "outline-fg-on-emphasis",
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
      default: "text-fg-default",
      active: "text-fg-on-emphasis",
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
  isSubscribeBadge?: boolean;
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
      isSubscribeBadge,
      children,
      ...props
    },
    ref,
  ) => {
    const [isPressed, setIsPressed] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);
    const isActive = active || isPressed;

    if (variant === "gradient") {
      return (
        <button
          className={cn(
            "outline-status-required relative inline-flex w-28 items-center justify-center rounded-lg shadow-[0px_0px_10px_0px_rgba(181,158,255,0.50)] shadow-[0px_1px_8px_0px_rgba(117,117,117,1.00)] outline outline-2 outline-offset-[-2px] transition-all",
            size === "default" ? "gap-2 px-3 py-2" : "gap-2 px-6 py-3",
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
          {...props}
        >
          {isSubscribeBadge && <SubscribeBadge />}

          {/* Background gradient layer */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500" />

          {/* Foreground content layer */}
          <div
            className={cn(
              "bg-hover px relative flex items-center justify-center gap-2 rounded-[6px]",
              "absolute inset-[2px]",
              isActive && "bg-emphasis",
              isActive && isHovered && "opacity-70",
            )}
          >
            {icon && (
              <div className={iconVariants({ size })}>
                {React.cloneElement(icon as React.ReactElement, {
                  className: cn(
                    size === "lg"
                      ? "min-w-5 min-h-4"
                      : "max-w-4 max-h-5 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
                    isActive ? "text-fg-on-emphasis" : "text-fg-default",
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
          </div>
        </button>
      );
    }

    return (
      <button
        className={cn(
          buttonPillVariants({ variant, size }),
          isActive &&
            "bg-emphasis shadow-[0px_1px_12px_0px_rgba(117,117,117,1.00)]",
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
        {isSubscribeBadge && <SubscribeBadge />}

        {icon && (
          <div className={iconVariants({ size })}>
            {React.cloneElement(icon as React.ReactElement, {
              className: cn(
                size === "lg"
                  ? "min-w-5 min-h-4"
                  : "max-w-3.5 max-h-3 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
                isActive ? "text-fg-on-emphasis" : "text-fg-default",
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
