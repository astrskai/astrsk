import { type ReactNode } from "react";
import { cn } from "@/shared/lib";

interface ResourceLinkProps {
  onClick?: () => void;
  children: ReactNode;
  isActive?: boolean;
  className?: string;
}

export const ResourceLink = ({
  onClick,
  children,
  isActive = true,
  className,
}: ResourceLinkProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-12 w-full items-center justify-center rounded-lg px-4 font-semibold text-white transition-colors",
        "bg-surface-raised hover:bg-surface-raised/80",
        className
      )}
    >
      {children}
    </button>
  );
};
