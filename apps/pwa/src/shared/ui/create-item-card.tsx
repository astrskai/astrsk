import { Plus } from "lucide-react";
import { cn } from "@/shared/lib";

interface CreateItemCardProps {
  /** Title text (e.g., "New Character", "New Session") */
  title: string;
  /** Description text (e.g., "Create a new character") */
  description?: string;
  /** Click handler */
  onClick?: () => void;
  /** Optional additional className */
  className?: string;
  /** Variant for different card styles */
  variant?: "square" | "flexible";
}

export function CreateItemCard({
  title,
  description,
  onClick,
  className,
  variant = "flexible",
}: CreateItemCardProps) {
  return (
    <article
      className={cn(
        "group/create-item-card bg-black-alternate relative flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-zinc-700 transition-all duration-300 hover:border-zinc-500 hover:bg-zinc-800/50",
        variant === "square" && "aspect-[1/1]",
        variant === "flexible" && "h-full min-h-[200px]",
        className,
      )}
      onClick={onClick ?? undefined}
    >
      <div className="flex flex-col items-center gap-3">
        {/* Plus Icon */}
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-600 bg-zinc-800 transition-all duration-300 group-hover/create-item-card:scale-110 group-hover/create-item-card:border-zinc-400">
          <Plus className="h-6 w-6" />
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-1">
          <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
          {description && (
            <p className="text-sm text-zinc-400">{description}</p>
          )}
        </div>
      </div>
    </article>
  );
}
