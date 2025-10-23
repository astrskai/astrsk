import { Menu } from "lucide-react";
import { Button } from "../../components-v2/ui/button";
import { cn } from "@/shared/lib";
import { ReactNode } from "react";

interface TopNavigationProps {
  title: string;
  onMenuClick?: () => void;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  className?: string;
  titleClassName?: string;
  transparent?: boolean;
  transparencyLevel?: number; // 0-100, defaults to 50
}

export function TopNavigation({
  title,
  onMenuClick,
  leftAction,
  rightAction,
  className,
  titleClassName,
  transparent = false,
  transparencyLevel = 50,
}: TopNavigationProps) {
  const getBackgroundClass = () => {
    if (transparent) {
      return `bg-background-surface-2/${transparencyLevel} backdrop-blur-[20px]`;
    }
    return "bg-background-surface-2";
  };

  return (
    <div
      className={cn(
        "safe-area-top relative flex h-[46px] shrink-0 items-center px-[8px]",
        getBackgroundClass(),
        className,
      )}
    >
      {/* Left side - Menu button or custom action */}
      <div className="flex items-center">
        {leftAction ||
          (onMenuClick && (
            <Button
              variant="ghost_white"
              size="icon"
              className="text-text-primary hover:text-text-primary/80 h-[40px] w-[40px] p-0"
              onClick={onMenuClick}
            >
              <Menu className="min-h-6 min-w-6" />
            </Button>
          ))}
      </div>

      {/* Center - Title */}
      <div className="pointer-events-none absolute inset-x-0 inset-y-0 flex items-center justify-center">
        <span
          className={cn(
            "text-text-primary max-w-[60%] truncate text-[17px] font-semibold",
            titleClassName,
          )}
        >
          {title}
        </span>
      </div>

      {/* Right side - Custom action or spacer */}
      {rightAction ? (
        <div className="ml-auto flex items-center">{rightAction}</div>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
}
