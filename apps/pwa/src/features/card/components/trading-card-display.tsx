import { PropsWithChildren, useEffect, useRef, useState } from "react";

import { cn } from "@/shared/lib";

import {
  Card as CardUI, MediaDisplay, Skeleton, SvgIcon,
  Typo3XLarge, TypoSmall,
} from "@/shared/ui";
import { Card, CardType, CharacterCard } from "@/modules/card/domain";

// Simple tag component for displaying card tags
const Tag = ({ name }: { name: string }) => {
  return (
    <div className="bg-muted flex items-center justify-center rounded-lg px-1.5 py-px">
      <div className="max-w-[75px] truncate text-center text-xs font-normal">
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
        "relative aspect-196/289 w-full cursor-pointer transition-opacity duration-300 ease-in-out",
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
  isVideo?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
}

const tagContainerWidth = 152;

export const TradingCardDisplay = ({
  card,
  imageUrl,
  isVideo = false,
  isLoading = false,
  onClick,
}: TradingCardDisplayProps) => {
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
        <CardUI className="bg-background-input border-secondary h-[289px] w-[196px] overflow-hidden rounded-xl border shadow-none">
          <Skeleton className="h-full w-full" />
        </CardUI>
      </CardWrapper>
    );
  }

  // Render card
  return (
    <CardWrapper>
      <div className="border-border-container flex h-[289px] w-[196px] flex-row overflow-hidden rounded-xl border">
        <div
          className={cn(
            "relative top-0 left-0 h-[289px] w-[164px] overflow-hidden",
          )}
          onClick={onClick}
        >
          <MediaDisplay
            width={164}
            height={289}
            src={imageUrl || null}
            fallbackSrc={
              card.props.type === CardType.Character
                ? "/img/placeholder/character-card-image.png"
                : "/img/placeholder/plot-card-image.png"
            }
            alt={card.props.title}
            className="h-full w-full object-cover"
            isVideo={isVideo}
            showControls={true}
            autoPlay={false}
            muted={true}
            loop={true}
            playOnHover={false}
            clickToToggle={false}
            playButtonSize="medium"
          />

          {card.props.tags && card.props.tags.length > 0 ? (
            <>
              <div className="absolute right-0 bottom-0 left-0 h-[117px] bg-gradient-to-b from-[#22222201] to-[#222222] to-95%" />
            </>
          ) : (
            <>
              <div className="absolute right-0 bottom-0 left-0 h-[88px] bg-gradient-to-b from-[#22222201] to-[#222222] to-95%" />
            </>
          )}

          <div className="absolute right-3 bottom-3 left-3 flex h-28 flex-col justify-end">
            <Typo3XLarge
              className={cn(
                "truncate pb-[8px] text-left font-[32px]",
                "font-pragati-narrow",
              )}
            >
              {card.props.type === CardType.Character
                ? (card as CharacterCard).props.name || card.props.title
                : card.props.title}
            </Typo3XLarge>

            {card.props.tags && card.props.tags.length > 0 && (
              <div className="text-text-secondary pb-[8px] text-left text-[9px] font-normal">
                {getTagString(card.props.tags || [])}
              </div>
            )}

            <div className="text-text-placeholder text-left text-[9px] font-normal">
              {card.props.tokenCount || 0} Tokens
            </div>
          </div>
        </div>
        <div
          className={cn("h-[289px] w-[32px] overflow-hidden")}
          onClick={onClick}
        >
          <div className="h-full w-full object-cover opacity-70 blur-lg">
            <MediaDisplay
              width={164}
              height={289}
              src={imageUrl || null}
              fallbackSrc={
                card.props.type === CardType.Character
                  ? "/img/placeholder/character-card-image.png"
                  : "/img/placeholder/plot-card-image.png"
              }
              alt={card.props.title}
              className="h-full w-full object-cover object-right"
              isVideo={isVideo}
              showControls={false}
              autoPlay={false}
              muted={true}
              loop={true}
              playOnHover={false}
              clickToToggle={false}
              playButtonSize="medium"
            />
          </div>
          <div className="absolute top-2 right-2.5">
            <div
              className={cn(
                "inline-flex h-3.5 w-3.5 items-center justify-center rounded-full",
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
          <div className={cn("absolute top-40 right-[-113px] w-[260px]")}>
            <div className="flex rotate-90 transform flex-row items-center space-x-2">
              <TypoSmall
                className={cn(
                  "font-nromal text-text-muted-title w-[250px] truncate text-left font-[12px]",
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
