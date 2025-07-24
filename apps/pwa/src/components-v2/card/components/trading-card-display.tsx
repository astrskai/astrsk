import { PropsWithChildren, useEffect, useRef, useState } from "react";

import { cn } from "@/shared/utils";

import { SvgIcon } from "@/components-v2/svg-icon";
import { Typo3XLarge, TypoSmall } from "@/components-v2/typo";
import { Card as CardUI } from "@/components-v2/ui/card";
import { Skeleton } from "@/components-v2/ui/skeleton";
import { Card, CardType, CharacterCard } from "@/modules/card/domain";

// Simple tag component for displaying card tags
const Tag = ({ name }: { name: string }) => {
  return (
    <div className="px-1.5 py-px bg-muted rounded-lg flex justify-center items-center">
      <div className="text-center text-xs font-normal truncate max-w-[75px]">
        {name}
      </div>
    </div>
  );
};

// Wrapper component that handles card sizing and animations
const CardWrapper = ({ children }: PropsWithChildren<{}>) => {
  // Aspect zoom
  const refWrapper = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number | null>(null);

  useEffect(() => {
    if (!refWrapper.current) {
      return;
    }
    let target: HTMLDivElement | null = refWrapper.current;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      if (width === 0 || target === null) {
        return;
      }
      const newZoom = width / 196;
      setZoom(newZoom);
      observer.unobserve(target);
      target = null;
    });
    observer.observe(target);
    return () => {
      target && observer.unobserve(target);
    };
  }, []);

  // Animation
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    setIsVisible(false);
    const timeout = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => {
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div
      ref={refWrapper}
      className={cn(
        "relative transition-opacity duration-300 w-full aspect-196/289 ease-in-out cursor-pointer",
        isVisible ? "opacity-100" : "opacity-0",
        zoom === null && "opacity-0",
      )}
    >
      <div style={{ zoom: zoom || 1 }}>{children}</div>
    </div>
  );
};

interface TradingCardDisplayProps {
  card: Card | null;
  imageUrl?: string | null;
  isLoading?: boolean;
  onClick?: () => void;
}

const tagContainerWidth = 152;

export const TradingCardDisplay = ({ card, imageUrl, isLoading = false, onClick }: TradingCardDisplayProps) => {
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

  // Loading state
  if (isLoading || !card) {
    return (
      <CardWrapper>
        <CardUI className="w-[196px] h-[289px] bg-background-input rounded-xl border border-secondary shadow-none overflow-hidden">
          <Skeleton className="h-full w-full" />
        </CardUI>
      </CardWrapper>
    );
  }

  // Render card
  return (
    <CardWrapper>
      <div className="w-[196px] h-[289px] flex flex-row rounded-xl border border-border-container overflow-hidden">
        <div
          className={cn(
            "w-[164px] h-[289px] left-0 top-0 relative overflow-hidden",
          )}
          onClick={onClick}
        >
          <img
            width={164}
            height={289}
            src={
              imageUrl ||
              (card.props.type === CardType.Character
                ? "/img/placeholder/character-card-image.png"
                : "/img/placeholder/plot-card-image.png")
            }
            alt={card.props.title}
            className="w-full h-full object-cover"
          />

          {card.props.tags && card.props.tags.length > 0 ? (
            <>
              <div className="absolute bottom-0 left-0 right-0 h-[117px] bg-gradient-to-b from-[#22222201] to-[#222222] to-95%" />
            </>
          ) : (
            <>
              <div className="absolute bottom-0 left-0 right-0 h-[88px] bg-gradient-to-b from-[#22222201] to-[#222222] to-95%" />
            </>
          )}

          <div className="absolute bottom-3 left-3 right-3 h-28 flex flex-col justify-end">
            <Typo3XLarge
              className={cn(
                "font-[32px] truncate pb-[8px] text-left",
                "font-pragati-narrow",
              )}
            >
              {card.props.type === CardType.Character
                ? (card as CharacterCard).props.name || card.props.title
                : card.props.title}
            </Typo3XLarge>

            {card.props.tags && card.props.tags.length > 0 && (
              <div className="text-[9px] font-normal text-text-secondary pb-[8px] text-left">
                {getTagString(card.props.tags || [])}
              </div>
            )}

            <div className="text-left text-[9px] font-normal text-text-placeholder">
              {card.props.tokenCount || 0} Tokens
            </div>
          </div>
        </div>
        <div
          className={cn("w-[32px] h-[289px] overflow-hidden")}
          onClick={onClick}
        >
          <div className="w-full h-full object-cover opacity-70 blur-lg">
            <img
              width={164}
              height={289}
              src={
                imageUrl ||
                (card.props.type === CardType.Character
                  ? "/img/placeholder/character-card-image.png"
                  : "/img/placeholder/plot-card-image.png")
              }
              alt={card.props.title}
              className="w-full h-full object-cover object-right"
            />
          </div>
          <div className="absolute top-2 right-2.5">
            <div
              className={cn(
                "w-3.5 h-3.5 rounded-full inline-flex items-center justify-center",
                card.props.type === CardType.Character
                  ? "bg-secondary-normal"
                  : "bg-primary-normal",
              )}
            >
              {card.props.type === CardType.Character ? (
                <SvgIcon name="character_icon" width={14} height={11} />
              ) : (
                <SvgIcon name="plot_icon" width={14} height={11} />
              )}
            </div>
          </div>
          <div className={cn("absolute w-[260px] top-40 right-[-113px]")}>
            <div className="transform rotate-90 flex flex-row items-center space-x-2">
              <TypoSmall
                className={cn(
                  "font-[12px] font-nromal w-[250px] text-text-muted-title truncate text-left",
                )}
              >
                {card.props.title}
              </TypoSmall>
            </div>
          </div>
        </div>
      </div>
    </CardWrapper>
  );
};

export default TradingCardDisplay;