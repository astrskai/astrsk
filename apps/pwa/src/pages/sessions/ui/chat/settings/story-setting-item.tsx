import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib";
import type { ComponentType, SVGProps } from "react";

interface StorySettingItemProps {
  icon: LucideIcon | ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  onClick?: () => void;
  disabled?: boolean;
}

export default function StorySettingItem({
  icon: Icon,
  title,
  onClick,
  disabled = false,
}: StorySettingItemProps) {
  return (
    <div
      className={cn(
        "group flex h-[64px] cursor-pointer overflow-hidden rounded-lg border border-border-subtle hover:border-fg-subtle",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={disabled ? undefined : onClick}
    >
      <div className="relative flex w-[25%] items-center justify-center bg-surface-raised">
        <Icon className="h-6 w-6 text-fg-muted" />
      </div>
      <div className="flex w-[75%] items-center justify-between gap-2 p-4">
        <h3 className="line-clamp-2 text-base font-semibold text-ellipsis text-fg-default">
          {title}
        </h3>

        <ChevronRight className="h-5 w-5 flex-shrink-0 text-fg-muted" />
      </div>
    </div>
  );
}
