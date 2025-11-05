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
}

export function CreateItemCard({
  title,
  description,
  onClick,
  className,
}: CreateItemCardProps) {
  return (
    <article
      className={cn(
        "group/create-item-card bg-black-alternate relative flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-700 transition-all duration-300 hover:border-gray-100 hover:bg-gray-900",
        className,
      )}
      onClick={onClick ?? undefined}
    >
      <div className="flex flex-col items-center gap-3">
        {/* Plus Icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gray-500 bg-gray-800 transition-transform duration-300 group-hover/create-item-card:scale-105">
          <Plus size={32} />
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-2">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {description && (
            <p className="text-sm text-gray-200">{description}</p>
          )}
        </div>
      </div>
    </article>
  );
}
