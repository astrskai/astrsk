import React, { useMemo, useRef, useEffect, useState } from "react";
import { cn } from "@/shared/lib";

interface FieldBadgesProps {
  fields: Array<{ id: string; name: string }>;
  maxRows?: number;
  className?: string;
  badgeClassName?: string;
}

/**
 * Component to display field names as badges with automatic overflow handling
 * Shows badges up to maxRows (default 3) and adds a "+N" badge for remaining items
 */
export function FieldBadges({
  fields,
  maxRows = 3,
  className,
  badgeClassName,
}: FieldBadgesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(fields.length);
  const [isCalculating, setIsCalculating] = useState(true);

  // Calculate how many badges fit in the specified number of rows
  useEffect(() => {
    if (!containerRef.current || fields.length === 0) {
      setIsCalculating(false);
      return;
    }

    const calculateVisibleBadges = () => {
      const container = containerRef.current;
      if (!container) return;

      // Get computed styles
      const styles = window.getComputedStyle(container);
      const gap = parseFloat(styles.gap) || 4; // Default 4px gap
      const lineHeight = 32; // Approximate height of one badge row (including gap)
      const maxHeight = lineHeight * maxRows;

      // Temporarily show all badges to measure
      const badges = container.querySelectorAll("[data-badge]");
      let currentRowTop = 0;
      let rowCount = 1;
      let lastVisibleIndex = badges.length - 1;

      badges.forEach((badge, index) => {
        const rect = badge.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const relativeTop = rect.top - containerRect.top;

        // Check if this badge starts a new row
        if (index > 0 && Math.abs(relativeTop - currentRowTop) > 5) {
          rowCount++;
          currentRowTop = relativeTop;
        }

        // If we've exceeded max rows, mark this as the cutoff point
        if (rowCount > maxRows) {
          lastVisibleIndex = index - 1;
          return;
        }
      });

      // Account for the space needed for the "+N" badge
      if (lastVisibleIndex < fields.length - 1) {
        // We need to show fewer badges to make room for the "+N" indicator
        setVisibleCount(Math.max(1, lastVisibleIndex));
      } else {
        setVisibleCount(fields.length);
      }

      setIsCalculating(false);
    };

    // Use a small delay to ensure DOM is rendered
    const timeoutId = setTimeout(calculateVisibleBadges, 50);

    // Recalculate on window resize
    const handleResize = () => {
      setIsCalculating(true);
      calculateVisibleBadges();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, [fields, maxRows]);

  const { displayedFields, remainingCount } = useMemo(() => {
    if (isCalculating) {
      // While calculating, show all to measure
      return {
        displayedFields: fields,
        remainingCount: 0,
      };
    }

    const displayed = fields.slice(0, visibleCount);
    const remaining = fields.length - visibleCount;

    return {
      displayedFields: displayed,
      remainingCount: remaining,
    };
  }, [fields, visibleCount, isCalculating]);

  if (fields.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "inline-flex flex-wrap content-start items-start justify-start gap-1",
        isCalculating && "invisible", // Hide while calculating to prevent flicker
        className,
      )}
    >
      {displayedFields.map((field) => (
        <div
          key={field.id}
          data-badge="true"
          className={cn(
            "bg-button-chips flex max-w-60 items-center justify-center gap-2.5 rounded-lg p-2",
            badgeClassName,
          )}
        >
          <div className="text-text-subtle flex-1 justify-start text-sm leading-tight font-medium">
            {field.name}
          </div>
        </div>
      ))}
      {!isCalculating && remainingCount > 0 && (
        <div
          className={cn(
            "bg-button-chips flex max-w-60 items-center justify-center gap-2.5 rounded-lg p-2",
            badgeClassName,
          )}
        >
          <div className="text-text-subtle flex-1 justify-start text-sm leading-tight font-medium">
            +{remainingCount}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Simple version without automatic row calculation
 * Just shows first N badges and +remainder
 */
export function SimpleFieldBadges({
  fields,
  maxVisible = 8,
  className,
  badgeClassName,
}: {
  fields: Array<{ id: string; name: string }>;
  maxVisible?: number;
  className?: string;
  badgeClassName?: string;
}) {
  const displayedFields = fields.slice(0, maxVisible);
  const remainingCount = Math.max(0, fields.length - maxVisible);

  if (fields.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "inline-flex flex-wrap content-start items-start justify-start gap-1",
        className,
      )}
    >
      {displayedFields.map((field) => (
        <div
          key={field.id}
          className={cn(
            "bg-button-chips flex max-w-60 items-center justify-center gap-2.5 rounded-lg p-2",
            badgeClassName,
          )}
        >
          <div className="text-text-subtle flex-1 justify-start text-sm leading-tight font-medium">
            {field.name}
          </div>
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            "bg-button-chips flex max-w-60 items-center justify-center gap-2.5 rounded-lg p-2",
            badgeClassName,
          )}
        >
          <div className="text-text-subtle flex-1 justify-start text-sm leading-tight font-medium">
            +{remainingCount}
          </div>
        </div>
      )}
    </div>
  );
}
