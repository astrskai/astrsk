/**
 * [CLEANUP-TODO] UNUSED COMPONENT
 * Last checked: 2025-10-22
 * Usage: None (except stories)
 * Action: Review for deletion
 */

import * as TooltipPrimitive from "@/components-v2/ui/tooltip";

const Tooltip = ({
  children,
  content,
  side = "top",
  align = "center",
  delay,
  sideOffset,
}: {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delay?: number;
  sideOffset?: number;
}) => {
  return (
    <TooltipPrimitive.TooltipProvider>
      <TooltipPrimitive.Tooltip delayDuration={delay}>
        <TooltipPrimitive.TooltipTrigger asChild>
          {children}
        </TooltipPrimitive.TooltipTrigger>
        <TooltipPrimitive.TooltipContent
          side={side}
          align={align}
          sideOffset={sideOffset}
        >
          {content}
        </TooltipPrimitive.TooltipContent>
      </TooltipPrimitive.Tooltip>
    </TooltipPrimitive.TooltipProvider>
  );
};

export { Tooltip };
