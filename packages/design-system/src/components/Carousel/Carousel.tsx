import React, { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '../../lib/utils';

export interface CarouselProps {
  /** Carousel items */
  children?: React.ReactNode;
  /** Additional CSS classes for the container */
  className?: string;
  /** Gap between items in pixels */
  gap?: number;
  /** Whether to show navigation arrows (desktop only) */
  showArrows?: boolean;
  /** Whether to show dot indicators */
  showDots?: boolean;
  /** Number of items to scroll at once (desktop) */
  scrollCount?: number;
  /** Accessible label for the carousel */
  'aria-label'?: string;
}

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
}: CarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [itemCount, setItemCount] = useState(0);

  const childArray = React.Children.toArray(children);

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
      setItemCount(items.length);

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
    const itemWidth = firstItem.offsetWidth + gap;
    const scrollAmount = itemWidth * scrollCount;

    const newScrollLeft = direction === 'left'
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth',
    });
  }, [gap, scrollCount]);

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
      className={cn('relative w-full', className)}
      role="region"
      aria-label={ariaLabel}
      aria-roledescription="carousel"
    >
      {/* Scroll Container */}
      <div
        ref={scrollContainerRef}
        className={cn(
          'flex overflow-x-auto scroll-smooth',
          // Hide scrollbar
          'scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]',
          '[&::-webkit-scrollbar]:hidden',
          // Snap behavior for mobile
          'snap-x snap-mandatory lg:snap-none',
          // Padding for edge items
          'px-4 lg:px-0'
        )}
        style={{ gap: `${gap}px` }}
        tabIndex={0}
        aria-live="polite"
      >
        {childArray.map((child, index) => (
          <div
            key={index}
            className={cn(
              'flex-shrink-0 snap-start',
              // Ensure items have consistent width
              'w-[280px] sm:w-[300px] lg:w-[320px]'
            )}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${childArray.length}`}
          >
            {child}
          </div>
        ))}
      </div>

      {/* Navigation Arrows (Desktop only) */}
      {showArrows && (
        <>
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={cn(
              'absolute left-0 top-1/2 z-10 -translate-y-1/2 -translate-x-4',
              'hidden lg:flex items-center justify-center',
              'h-10 w-10 rounded-full',
              'bg-zinc-800 border border-zinc-700',
              'text-zinc-400 hover:text-white hover:bg-zinc-700',
              'transition-all duration-200',
              'disabled:opacity-0 disabled:pointer-events-none',
              'focus:outline-none focus:ring-2 focus:ring-zinc-500'
            )}
            aria-label="Previous items"
          >
            <ArrowIcon direction="left" className="h-5 w-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={cn(
              'absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-4',
              'hidden lg:flex items-center justify-center',
              'h-10 w-10 rounded-full',
              'bg-zinc-800 border border-zinc-700',
              'text-zinc-400 hover:text-white hover:bg-zinc-700',
              'transition-all duration-200',
              'disabled:opacity-0 disabled:pointer-events-none',
              'focus:outline-none focus:ring-2 focus:ring-zinc-500'
            )}
            aria-label="Next items"
          >
            <ArrowIcon direction="right" className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {showDots && itemCount > 1 && (
        <div
          className="flex justify-center gap-2 mt-4"
          role="tablist"
          aria-label="Carousel navigation"
        >
          {Array.from({ length: itemCount }).map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              className={cn(
                'h-2 w-2 rounded-full transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-900',
                index === activeIndex
                  ? 'bg-white w-4'
                  : 'bg-zinc-600 hover:bg-zinc-500'
              )}
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
