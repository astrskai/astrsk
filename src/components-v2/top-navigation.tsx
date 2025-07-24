import { Menu } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "./lib/utils";
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
        "relative flex items-center h-[46px] px-[8px] shrink-0 safe-area-top",
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
              className="h-[40px] w-[40px] p-0 text-text-primary hover:text-text-primary/80"
              onClick={onMenuClick}
            >
              <Menu className="min-h-6 min-w-6" />
            </Button>
          ))}
      </div>

      {/* Center - Title */}
      <div className="absolute inset-x-0 inset-y-0 flex justify-center items-center pointer-events-none">
        <span
          className={cn(
            "font-semibold text-[17px] truncate max-w-[60%] text-text-primary",
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
