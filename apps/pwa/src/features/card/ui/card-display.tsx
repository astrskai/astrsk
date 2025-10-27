import { Download } from "lucide-react";
// import { toast } from 'sonner';

import { CharacterCard } from "@/entities/card/domain/character-card";
import { IconCardTypeCharacter, IconCardTypePlot } from "@/shared/assets/icons";

// import { formatCompactNumber } from '@/lib/number';
// import { formatRelativeTime } from '@/lib/date';
import { cn } from "@/shared/lib";
import { CardType } from "@/entities/card/domain";
import { useAsset } from "@/shared/hooks/use-asset";
import { MediaDisplay } from "@/shared/ui";

const CONTAINER_TEXT_SIZES = {
  name: "@[200px]:text-2xl @[250px]:text-3xl @[300px]:text-4xl @[350px]:text-5xl @[400px]:text-6xl @[500px]:text-7xl",
  nameVertical:
    "@[200px]:text-lg @[250px]:text-xl @[300px]:text-2xl @[350px]:text-3xl @[400px]:text-4xl @[500px]:text-5xl",
  meta: "@[200px]:text-sm @[300px]:text-base @[400px]:text-xl @[500px]:text-2xl",
  icon: "@[200px]:h-6 @[200px]:w-6 @[300px]:h-8 @[300px]:w-8 @[400px]:h-10 @[400px]:w-10 @[500px]:h-12 @[500px]:w-12",
  spacing: {
    gap: "@[300px]:gap-3 @[400px]:gap-4 @[500px]:gap-6",
    padding:
      "@[300px]:px-3 @[300px]:py-4 @[400px]:px-4 @[400px]:py-6 @[500px]:px-6 @[500px]:py-8",
  },
  radius:
    "rounded-lg @[300px]:rounded-xl @[400px]:rounded-2xl @[500px]:rounded-3xl",
};

interface CardDisplayProps {
  card: CharacterCard;
  isSelected: boolean;
  showActions?: boolean;
  className?: string;
  onClick?: () => void;
}

const tagContainerWidth = 152;

/**
 * Card display component for showing character/plot cards
 * Supports both Character and Plot card types (differentiated by icon only)
 * Used in selection dialogs and card listings
 */
export default function CardDisplay({
  card,
  isSelected,
  showActions = false,
  className,
  onClick,
}: CardDisplayProps) {
  const [imageUrl, isVideo] = useAsset(card?.props.iconAssetId);
  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // toast.success('Downloading character:', {
    //   description: name,
    //   icon: null,
    // });
  };

  const estimateTextWidth = (text: string): number => {
    const avgCharWidth = 5;
    return text.length * avgCharWidth;
  };

  const getTagString = (tags: string[]) => {
    if (tags.length === 0) return "";

    const visibleTags: string[] = [];
    let totalWidth = 0;

    // Space for tag padding (px-1.5 = 12px) and spacing between tags
    const tagPadding = 6;
    const tagSpacing = 2;
    const reservedSpace = 4; // Space for "+N" text
    const maxWidth = tagContainerWidth - reservedSpace;

    // Calculate how many tags fit
    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i];
      const tagTextWidth = estimateTextWidth(tag);
      const tagTotalWidth =
        tagTextWidth + tagPadding + (i > 0 ? tagSpacing : 0);

      if (totalWidth + tagTotalWidth > maxWidth) {
        // This tag won't fit, break the loop
        const remainingCount = tags.length - i;
        if (remainingCount > 0) {
          return (
            visibleTags.join(" ") +
            (visibleTags.length > 0 ? " " : "") +
            "+" +
            remainingCount
          );
        }
        break;
      }

      totalWidth += tagTotalWidth;
      visibleTags.push(tag);
    }

    // All tags fit
    return visibleTags.join(" ");
  };

  return (
    <div className={cn("@container w-full")} onClick={onClick}>
      <article
        className={cn(
          "relative flex aspect-[4/6] w-full overflow-hidden",
          "transition-[transform,filter] duration-300 ease-out",
          "group-hover:brightness-105",
          "group-hover:drop-shadow-[0_8px_24px_rgba(0,0,0,0.4)]",
          CONTAINER_TEXT_SIZES.radius,
          className,
          isSelected && "border-text-primary border-2",
          onClick && "cursor-pointer",
        )}
      >
        <div className="absolute inset-0 overflow-hidden">
          <MediaDisplay
            src={imageUrl || null}
            fallbackSrc={
              card.props.type === CardType.Character
                ? "/img/placeholder/character-card-image.png"
                : "/img/placeholder/plot-card-image.png"
            }
            alt={card.props.title}
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
            isVideo={isVideo}
            showControls={false}
            autoPlay={false}
            muted={true}
            loop={true}
            playOnHover={true}
            clickToToggle={false}
          />
        </div>

        <div className="relative flex min-w-0 flex-1 flex-col justify-end">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {showActions && (
            <>
              <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="absolute top-2 left-2 flex -translate-y-4 gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <button
                  onClick={handleDownload}
                  aria-label={`Download ${card.props.title}`}
                  className="bg-brand-primary hover:bg-brand-primary-strong flex h-8 w-8 items-center justify-center rounded-full text-sm backdrop-blur-sm"
                >
                  <Download className="h-4" />
                </button>
                {/* <button
                  onClick={handleGoToAstrsk}
                  aria-label={`Open ${card.props.title} in astrsk`}
                  className="bg-brand-primary hover:bg-brand-primary-strong flex h-8 w-8 items-center justify-center rounded-full text-sm backdrop-blur-sm"
                >
                  <LogoAstrsk className="h-4" />
                </button> */}
              </div>
            </>
          )}

          <div
            className={cn(
              "relative flex min-w-0 flex-col gap-2 p-2",
              CONTAINER_TEXT_SIZES.spacing.gap,
              CONTAINER_TEXT_SIZES.spacing.padding,
            )}
          >
            <h3
              className={cn(
                "text-text-primary font-pragati-narrow line-clamp-2 text-xl font-bold",
                CONTAINER_TEXT_SIZES.name,
              )}
            >
              {card.props.name}
            </h3>
            <p
              className={cn(
                "text-text-secondary truncate text-[0.625rem]",
                CONTAINER_TEXT_SIZES.meta,
              )}
            >
              {card.props.tags &&
                card.props.tags.length > 0 &&
                getTagString(card.props.tags || [])}
            </p>
            <p
              className={cn(
                "text-text-secondary text-[0.625rem]",
                CONTAINER_TEXT_SIZES.meta,
              )}
            >
              {card.props.tokenCount || 0} Tokens
            </p>
          </div>
        </div>

        <div
          className={cn(
            "bg-background-surface-1/60 relative flex flex-col items-center gap-2 overflow-hidden rounded-tr-lg rounded-br-lg px-2 py-3 backdrop-blur-md",
            CONTAINER_TEXT_SIZES.spacing.padding,
          )}
        >
          <div
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full p-[6px]",
              CONTAINER_TEXT_SIZES.icon,
              card.props.type === CardType.Character
                ? "bg-purple-200"
                : "bg-blue-200",
            )}
          >
            {card.props.type === CardType.Character ? (
              <IconCardTypeCharacter className="h-5 w-5" />
            ) : (
              <IconCardTypePlot className="h-5 w-5" />
            )}
          </div>
          <div
            className={cn(
              "text-text-secondary text-sm [writing-mode:vertical-rl]",
              CONTAINER_TEXT_SIZES.nameVertical,
            )}
          >
            {card.props.title}
          </div>
        </div>
      </article>
    </div>
  );
}
