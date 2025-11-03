import { Plus } from "lucide-react";
import { cn } from "@/shared/lib";

interface NewCharacterProps {
  onClick: () => void;
  className?: string;
}

/**
 * New Character Card - placeholder card for creating a new character
 * Displays a "+" icon with "Create Character" label
 */
export function NewCharacter({ onClick, className }: NewCharacterProps) {
  return (
    <div className={cn("@container w-full", className)} onClick={onClick}>
      <article
        className={cn(
          "border-border hover:border-primary group bg-background-surface-1 hover:bg-background-surface-2 relative flex aspect-[4/6] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-all duration-300",
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110">
            <Plus size={32} strokeWidth={2} />
          </div>

          <div className="flex flex-col items-center gap-1">
            <h3 className="text-text-primary group-hover:text-primary text-lg font-semibold transition-colors">
              New Character
            </h3>
            <p className="text-text-secondary text-sm">
              Create a new character
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
