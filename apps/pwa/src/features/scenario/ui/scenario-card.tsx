import { MessageSquare, Scroll } from "lucide-react";
import { cn } from "@/shared/lib";
import {
  BaseCard,
  CardActionToolbar,
  type CardAction,
} from "@/features/common/ui";

interface ScenarioCardProps {
  title: string;
  imageUrl?: string | null;
  summary?: string;
  tags: string[];
  tokenCount?: number;
  firstMessages?: number;
  actions?: CardAction[];
  className?: string;
  isDisabled?: boolean;
  onClick?: () => void;
  showTypeIndicator?: boolean;
}

const PLACEHOLDER_IMAGE_URL = "/img/placeholder/scenario-placeholder.png";

const ScenarioCard = ({
  title,
  imageUrl,
  summary,
  tags,
  tokenCount = 0,
  firstMessages = 0,
  className,
  actions = [],
  isDisabled = false,
  onClick,
  showTypeIndicator = false,
}: ScenarioCardProps) => {
  return (
    <BaseCard
      className={cn("min-h-[340px]", className)}
      isDisabled={isDisabled}
      onClick={onClick}
    >
      {/* Image Area - Landscape ratio */}
      <div className="relative h-40 overflow-hidden bg-zinc-800">
        <img
          src={imageUrl || PLACEHOLDER_IMAGE_URL}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/10" />

        {/* Action Toolbar (Responsive) */}
        <CardActionToolbar actions={actions} />

        {/* Type Badge - Now conditional */}
        {showTypeIndicator && (
          <div className="absolute top-3 left-3 z-10">
            <div className="flex items-center gap-1.5 rounded border border-white/10 bg-black/50 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md">
              <Scroll size={12} className="text-purple-400" />
              SCENARIO
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex flex-grow flex-col p-4">
        <h3 className="mb-2 line-clamp-2 text-lg font-bold break-words text-zinc-100">
          {title}
        </h3>

        <p className="mb-4 line-clamp-3 flex-grow text-xs leading-relaxed break-words text-zinc-400">
          {summary || "No summary"}
        </p>

        {/* Tags */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {tags.length > 0 ? (
            <>
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
                  +{tags.length - 3}
                </span>
              )}
            </>
          ) : (
            <span className="text-[10px] text-zinc-600">No tags</span>
          )}
        </div>

        {/* Stats */}
        <div className="mt-auto flex items-center gap-4 border-t border-zinc-800 pt-3 text-xs text-zinc-500">
          <div className="flex items-center gap-1 text-purple-400/80">
            <MessageSquare size={12} /> {firstMessages} First messages
          </div>
          <div className="ml-auto flex items-center gap-1">
            {tokenCount} Tokens
          </div>
        </div>
      </div>
    </BaseCard>
  );
};

export default ScenarioCard;
