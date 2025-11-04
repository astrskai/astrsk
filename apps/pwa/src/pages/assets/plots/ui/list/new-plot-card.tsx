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
          "group bg-black-alternate hover:bg-background-surface-2 relative flex aspect-[4/6] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-700 transition-all duration-300 hover:border-gray-100",
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="text-primary flex h-16 w-16 items-center justify-center rounded-full border border-gray-500 bg-gray-800 transition-transform duration-300 group-hover:scale-110">
            <Plus size={32} />
          </div>

          <div className="flex flex-col items-center gap-1">
            <h3 className="group-hover:text-primary text-lg font-semibold text-white transition-colors">
              New Plot
            </h3>
            <p className="text-sm text-gray-200">Create a new plot</p>
          </div>
        </div>
      </article>
    </div>
  );
}
