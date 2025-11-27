import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/shared/lib";

export interface SimpleDropdownMenuItem {
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

interface SimpleDropdownMenuProps {
  trigger: React.ReactNode;
  items: SimpleDropdownMenuItem[];
  align?: "start" | "center" | "end";
  className?: string;
}

/**
 * Simple custom dropdown menu without Radix UI
 * Fixes event bubbling issues with card onClick handlers
 */
export function SimpleDropdownMenu({
  trigger,
  items,
  align = "end",
  className,
}: SimpleDropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleItemClick =
    (item: SimpleDropdownMenuItem) => (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!item.disabled && item.onClick) {
        item.onClick();
        setIsOpen(false);
      }
    };

  const alignClass = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0",
  }[align];

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger */}
      <div onClick={handleTriggerClick}>{trigger}</div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            "absolute top-full z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border border-zinc-700 bg-zinc-800/90 p-1 shadow-lg backdrop-blur-lg",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2",
            alignClass,
            className,
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item, index) => (
            <div
              key={index}
              onClick={handleItemClick(item)}
              className={cn(
                "relative flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm text-zinc-200 transition-colors outline-none select-none",
                "hover:bg-zinc-700 hover:text-zinc-50",
                "focus:bg-zinc-700 focus:text-zinc-50",
                item.disabled && "pointer-events-none opacity-50",
              )}
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
