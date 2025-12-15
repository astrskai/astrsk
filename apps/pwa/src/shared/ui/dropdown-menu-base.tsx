import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/shared/lib";

export interface DropdownMenuItemConfig {
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

interface DropdownMenuBaseProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger: React.ReactNode;
  items: DropdownMenuItemConfig[];
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  className?: string;
}

const DropdownMenuBase = ({
  open,
  onOpenChange,
  trigger,
  items,
  side = "bottom",
  align = "start",
  sideOffset = 4,
  className,
}: DropdownMenuBaseProps) => {
  return (
    <DropdownMenu.Root open={open} onOpenChange={onOpenChange}>
      <DropdownMenu.Trigger
        asChild
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {trigger}
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side={side}
          align={align}
          sideOffset={sideOffset}
          className={cn(
            "z-50 min-w-[8rem] overflow-hidden rounded-md border border-border-subtle bg-surface p-1 shadow-lg backdrop-blur-lg",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
            "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            "focus:outline-none",
            className,
          )}
        >
          {items.map((item, index) => (
            <DropdownMenu.Item
              key={index}
              onClick={item.onClick}
              disabled={item.disabled}
              className={cn(
                "relative flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm text-fg-default transition-colors outline-none select-none",
                "hover:bg-surface-raised hover:text-fg-default",
                "focus:bg-surface-raised focus:text-fg-default",
                "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                item.className,
              )}
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default DropdownMenuBase;
