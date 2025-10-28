import { Plus } from "lucide-react";
import { cn } from "@/shared/lib";

interface NewSessionCardProps {
  onClick: () => void;
  className?: string;
}

/**
 * New Session card - triggers create session dialog
 * Displays a plus icon and "New Session" text in the center
 */
export function NewSessionCard({ onClick, className }: NewSessionCardProps) {
  return (
    <div
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-2xl",
        "bg-background-surface-1 border-border border-2 border-dashed",
        "hover:border-primary hover:bg-background-surface-2 transition-all",
        "flex h-[300px] max-w-[340px] flex-col items-center justify-center",
        className,
      )}
      onClick={onClick}
    >
      {/* Content: Plus icon + Text */}
      <div className="flex flex-col items-center gap-4">
        {/* Plus Icon */}
        <div className="bg-background-surface-3 group-hover:bg-primary/20 flex h-16 w-16 items-center justify-center rounded-full transition-colors">
          <Plus
            size={32}
            className="text-text-secondary group-hover:text-primary transition-colors"
          />
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-1">
          <h3 className="text-text-primary group-hover:text-primary text-lg font-semibold transition-colors">
            New Session
          </h3>
          <p className="text-text-secondary text-sm">Create a new session</p>
        </div>
      </div>
    </div>
  );
}
