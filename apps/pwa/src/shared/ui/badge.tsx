import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@/shared/lib";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-background-container text-text-input-subtitle shadow-xs hover:bg-background-container/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/80",
        outline: "text-foreground",
        // Added editable variant
        editable:
          "border-transparent bg-background-container text-text-input-subtitle hover:bg-background-container/80 cursor-pointer",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  onDelete?: () => void; // Added onDelete prop
}

function Badge({
  className,
  variant,
  children,
  onDelete,
  ...props
}: BadgeProps) {
  const isEditable = variant === "editable";
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
      {isEditable && onDelete && (
        <button
          type="button" // Prevent form submission if badge is inside a form
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering potential parent onClick
            onDelete();
          }}
          className="ml-1.5 -mr-1 p-1 rounded-full inline-flex items-center justify-center text-text-input-subtitle hover:text-secondary-foreground hover:bg-secondary/60 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-1"
          aria-label="Remove badge"
        >
          <X className="min-w-[24px] min-h-[24px]" />
        </button>
      )}
    </div>
  );
}

export { Badge, badgeVariants };
