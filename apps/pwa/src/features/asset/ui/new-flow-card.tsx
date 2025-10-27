import { Plus } from "lucide-react";
import { cn } from "@/shared/lib";

interface NewFlowCardProps {
  onClick: () => void;
  className?: string;
}

/**
 * New Flow Card - placeholder card for creating a new flow
 * Displays a "+" icon with "Create Flow" label
 */
export function NewFlowCard({ onClick, className }: NewFlowCardProps) {
  return (
    <div className={cn("w-full", className)} onClick={onClick}>
      <div
        className={cn(
          "border-border hover:border-primary group relative flex h-full min-h-[200px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-background-surface-1 p-6 transition-all duration-300 hover:bg-background-surface-2",
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110">
            <Plus size={32} strokeWidth={2} />
          </div>
          <p className="text-text-secondary text-sm font-medium group-hover:text-text-primary transition-colors">
            Create Flow
          </p>
        </div>
      </div>
    </div>
  );
}
