import React from "react";
import { cn } from "@/shared/lib";

export interface PopoverMenuItem {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  colorClass: string;
  onClick?: () => void;
}

interface SimplePopoverMenuProps {
  trigger: React.ReactNode;
  items: PopoverMenuItem[];
  title?: string;
  position?: "dropdown" | "flyout";
  align?: "start" | "end";
  className?: string;
}

/**
 * Simple popover menu component without external libraries
 * Triggers on hover using CSS group-hover
 */
export function SimplePopoverMenu({
  trigger,
  items,
  title = "Menu",
  position = "dropdown",
  align = "start",
  className,
}: SimplePopoverMenuProps) {
  const positionClasses = {
    dropdown:
      align === "start"
        ? "top-14 left-4 right-4 origin-top"
        : "top-14 right-4 left-4 origin-top",
    flyout: "top-2 left-16 ml-2 w-48 origin-top-left",
  };

  return (
    <div className={cn("group relative z-50", className)}>
      {/* Trigger */}
      {trigger}

      {/* Popover Menu */}
      <div
        className={cn(
          "invisible absolute z-50 flex flex-col gap-1 rounded-xl border border-zinc-800 bg-zinc-950 p-2 opacity-0 shadow-2xl transition-all duration-200 pointer-events-none group-hover:visible group-hover:opacity-100 group-hover:pointer-events-auto",
          positionClasses[position]
        )}
      >
        {/* Title */}
        {title && (
          <div className="px-2 py-1.5 text-[10px] font-bold tracking-wider text-zinc-600 uppercase">
            {title}
          </div>
        )}

        {/* Menu Items */}
        {items.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className="group/item flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:text-white"
          >
            <item.icon
              className={cn(
                "h-4 w-4 transition-colors",
                "text-zinc-500 group-hover/item:text-current"
              )}
            />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
