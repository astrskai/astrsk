import { Plus } from "lucide-react";
import { cn } from "@/shared/lib";

interface NewPlotCardProps {
  onClick: () => void;
  className?: string;
}

/**
 * New Plot Card - placeholder card for creating a new plot
 * Displays a "+" icon with "Create Plot" label
 */
export function NewPlotCard({ onClick, className }: NewPlotCardProps) {
  return (
    <div className={cn("@container w-full", className)} onClick={onClick}>
      <article
        className={cn(
          "border-border hover:border-primary group relative flex aspect-[4/6] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed bg-background-surface-1 transition-all duration-300 hover:bg-background-surface-2",
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110">
            <Plus size={32} strokeWidth={2} />
          </div>
          <p className="text-text-secondary text-sm font-medium group-hover:text-text-primary transition-colors">
            Create Plot
          </p>
        </div>
      </article>
    </div>
  );
}
