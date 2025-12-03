import React, { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '../../lib/utils';

export interface CarouselProps {
  /** Carousel items */
  children?: React.ReactNode;
  /** Additional CSS classes for the container */
  className?: string;
  /** Gap between items in pixels */
  gap?: number;
  /** Whether to show navigation arrows */
  showArrows?: boolean;
  /** Whether to show dot indicators */
  showDots?: boolean;
  /** Number of items to scroll at once */
  scrollCount?: number;
  /** Accessible label for the carousel */
  'aria-label'?: string;
  /** Variant type: 'default' for card carousel, 'banner' for full-width banner slides */
  variant?: 'default' | 'banner';
  /** Whether to loop back to start/end when reaching boundaries */
  loop?: boolean;
}

// Style constants moved outside component to prevent recreation on each render
const ARROW_BUTTON_BASE_CLASSES = cn(
  'absolute top-1/2 z-10 -translate-y-1/2',
  'flex items-center justify-center',
  'transition-all duration-200',
  'disabled:opacity-0 disabled:pointer-events-none',
  'focus:outline-none focus:ring-2 focus:ring-zinc-500'
);

const ARROW_BUTTON_DEFAULT_CLASSES = cn(
  ARROW_BUTTON_BASE_CLASSES,
  'h-10 w-10 rounded-full',
  'bg-zinc-800 border border-zinc-700',
  'text-zinc-400 hover:text-white hover:bg-zinc-700'
);

const ARROW_BUTTON_BANNER_CLASSES = cn(
  ARROW_BUTTON_BASE_CLASSES,
  'h-12 w-12',
  'text-white/70 hover:text-white',
  'focus:ring-0',
  // Mobile: always visible, Desktop: show on hover
  'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
);

const SCROLL_CONTAINER_CLASSES = cn(
  'flex overflow-x-auto scroll-smooth',
  // Hide scrollbar
  'scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]',
  '[&::-webkit-scrollbar]:hidden',
  // Snap behavior
  'snap-x snap-mandatory'
);

const DOT_BASE_CLASSES = cn(
  'h-2 rounded-full transition-all duration-200',
  'focus:outline-none'
);

const DOT_DEFAULT_FOCUS_CLASSES = 'focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-900';

// Arrow positioning classes
const ARROW_LEFT_DEFAULT = 'left-0 -translate-x-4';
const ARROW_RIGHT_DEFAULT = 'right-0 translate-x-4';
// Banner: closer to edge on mobile, slightly inward on desktop
const ARROW_LEFT_BANNER = 'left-1 sm:left-2';
const ARROW_RIGHT_BANNER = 'right-1 sm:right-2';

// Icon size classes
const ICON_SIZE_DEFAULT = 'h-5 w-5';
const ICON_SIZE_BANNER = 'h-8 w-8';

/**
 * Arrow Icon Component (Internal)
 */
function ArrowIcon({ direction, className }: { direction: 'left' | 'right'; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {direction === 'left' ? (
        <polyline points="15 18 9 12 15 6" />
      ) : (
        <polyline points="9 18 15 12 9 6" />
      )}
    </svg>
  );
}

/**
 * Carousel Component
 *
 * A responsive carousel component that works on both desktop and mobile.
 * - Desktop: Shows navigation arrows, scrolls by scrollCount
 * - Mobile: Touch/swipe scrolling with momentum, optional dots
 *
 * @example
 * ```tsx
 * <Carousel showArrows showDots>
 *   <CharacterCard name="Alice" ... />
 *   <CharacterCard name="Bob" ... />
 *   <SessionCard title="Adventure" ... />
 * </Carousel>
 * ```
 */
export function Carousel({
  children,
  className,
  gap = 16,
  showArrows = true,
  showDots = false,
  scrollCount = 1,
  'aria-label': ariaLabel = 'Carousel',
  variant = 'default',
  loop = false,
}: CarouselProps) {
  const isBanner = variant === 'banner';
  const arrowClasses = isBanner ? ARROW_BUTTON_BANNER_CLASSES : ARROW_BUTTON_DEFAULT_CLASSES;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true); // Default to true until measured
  const [activeIndex, setActiveIndex] = useState(0);

  const childArray = React.Children.toArray(children);
  const itemCount = childArray.length;

  // Update scroll state
  const updateScrollState = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScroll = scrollWidth - clientWidth;

    setCanScrollLeft(scrollLeft > 1);
    setCanScrollRight(scrollLeft < maxScroll - 1);

    // Calculate active index based on scroll ratio (0 to 1)
    const items = container.children;
    if (items.length > 0) {
      // Use scroll ratio to determine active index
      // This ensures last dot is active when scrolled to the end
      const scrollRatio = maxScroll > 0 ? scrollLeft / maxScroll : 0;
      const newIndex = Math.round(scrollRatio * (items.length - 1));
      setActiveIndex(Math.min(Math.max(newIndex, 0), items.length - 1));
    }
  }, []);

  // Scroll to specific index (based on scroll ratio)
  const scrollToIndex = useCallback((index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const items = container.children;
    if (items.length <= 1) return;

    const { scrollWidth, clientWidth } = container;
    const maxScroll = scrollWidth - clientWidth;

    // Calculate target scroll based on ratio
    const ratio = index / (items.length - 1);
    const targetScroll = ratio * maxScroll;

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
  }, []);

  // Scroll by count
  const scroll = useCallback((direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const items = container.children;
    if (items.length === 0) return;

    const firstItem = items[0] as HTMLElement;
    const itemWidth = firstItem.offsetWidth + (isBanner ? 0 : gap);
    const scrollAmount = itemWidth * scrollCount;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScroll = scrollWidth - clientWidth;

    let newScrollLeft: number;

    let isLooping = false;

    if (direction === 'left') {
      if (loop && scrollLeft <= 1) {
        // At start, loop to end
        newScrollLeft = maxScroll;
        isLooping = true;
      } else {
        newScrollLeft = scrollLeft - scrollAmount;
      }
    } else {
      if (loop && scrollLeft >= maxScroll - 1) {
        // At end, loop to start
        newScrollLeft = 0;
        isLooping = true;
      } else {
        newScrollLeft = scrollLeft + scrollAmount;
      }
    }

    container.scrollTo({
      left: newScrollLeft,
      behavior: isLooping ? 'instant' : 'smooth',
    });
  }, [gap, scrollCount, loop, isBanner]);

  // Initialize and listen for scroll events
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    updateScrollState();

    const handleScroll = () => updateScrollState();
    container.addEventListener('scroll', handleScroll, { passive: true });

    // Handle resize
    const resizeObserver = new ResizeObserver(() => updateScrollState());
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [updateScrollState]);

  // Re-check when children change
  useEffect(() => {
    updateScrollState();
  }, [children, updateScrollState]);

  return (
    <div
      className={cn('relative w-full', isBanner && 'group', className)}
      role="region"
      aria-label={ariaLabel}
      aria-roledescription="carousel"
    >
      {/* Scroll Container */}
      <div
        ref={scrollContainerRef}
        className={SCROLL_CONTAINER_CLASSES}
        style={{ gap: isBanner ? 0 : `${gap}px` }}
        tabIndex={0}
        aria-live="polite"
      >
        {childArray.map((child, index) => (
          <div
            key={index}
            className={cn(
              'flex-shrink-0 snap-start',
              isBanner ? 'w-full' : 'w-[280px] sm:w-[300px] lg:w-[320px]'
            )}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${childArray.length}`}
          >
            {child}
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {showArrows && (
        <>
          <button
            type="button"
            onClick={() => scroll('left')}
            disabled={!loop && !canScrollLeft}
            className={cn(arrowClasses, isBanner ? ARROW_LEFT_BANNER : ARROW_LEFT_DEFAULT)}
            aria-label="Previous items"
          >
            <ArrowIcon direction="left" className={isBanner ? ICON_SIZE_BANNER : ICON_SIZE_DEFAULT} />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            disabled={!loop && !canScrollRight}
            className={cn(arrowClasses, isBanner ? ARROW_RIGHT_BANNER : ARROW_RIGHT_DEFAULT)}
            aria-label="Next items"
          >
            <ArrowIcon direction="right" className={isBanner ? ICON_SIZE_BANNER : ICON_SIZE_DEFAULT} />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {showDots && itemCount > 1 && (
        <div
          className={cn(
            'flex justify-center gap-2',
            isBanner
              ? 'absolute bottom-4 left-1/2 -translate-x-1/2 z-10'
              : 'mt-4'
          )}
          role="tablist"
          aria-label="Carousel navigation"
        >
          {Array.from({ length: itemCount }).map((_, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={index}
                type="button"
                onClick={() => scrollToIndex(index)}
                className={cn(
                  DOT_BASE_CLASSES,
                  !isBanner && DOT_DEFAULT_FOCUS_CLASSES,
                  isActive ? 'bg-white w-4' : 'bg-zinc-600 hover:bg-zinc-500 w-2',
                  isBanner && !isActive && 'bg-white/40 hover:bg-white/60'
                )}
                role="tab"
                aria-selected={isActive}
                aria-label={`Go to slide ${index + 1}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
