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
          "group bg-black-alternate hover:bg-background-surface-2 relative flex h-full min-h-[200px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-700 p-6 transition-all duration-300 hover:border-gray-100",
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="text-primary flex h-16 w-16 items-center justify-center rounded-full border border-gray-500 bg-gray-800 transition-transform duration-300 group-hover:scale-110">
            <Plus size={32} />
          </div>
          {/* Text */}
          <div className="flex flex-col items-center gap-1">
            <h3 className="group-hover:text-primary text-lg font-semibold text-white transition-colors">
              New Flow
            </h3>
            <p className="text-sm text-gray-200">Create a new flow</p>
          </div>
        </div>
      </div>
    </div>
  );
}
