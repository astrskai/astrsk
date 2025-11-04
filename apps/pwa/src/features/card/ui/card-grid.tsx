import { useEffect, useRef, useState } from "react";

import { TradingCard } from "@/features/card/ui/trading-card";
import { ScrollArea } from "@/shared/ui";

interface CardGridProps {
  cards: string[];
  onCardClick?: (id: string) => void;
  maxColumns?: number; // Optional prop to override max columns (5 for characters, 4 for plots)
}

// Constants for card dimensions and spacing
const CARD_WIDTH = 215; // Width of each card in pixels
const CARD_HEIGHT = 330; // Height of each card in pixels
const CARD_GAP = 16; // Gap between cards in pixels
const MIN_COLUMNS = 1;
const DEFAULT_MAX_COLUMNS = 5; // Default max columns (for character grid)

const CardGrid: React.FC<CardGridProps> = ({
  cards,
  onCardClick,
  maxColumns = DEFAULT_MAX_COLUMNS, // Default to 5 columns (character grid), can be overridden to 4 for plot grid
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // const [columns, setColumns] = useState(3); // Default column count
  // const [cardSpacing, setCardSpacing] = useState(0); // Dynamic spacing between cards

  // Calculate optimal column count based on container width
  // useEffect(() => {
  //   const calculateLayout = () => {
  //     if (!containerRef.current) return;

  //     const containerWidth = containerRef.current.clientWidth;
  //     const availableWidth = containerWidth - 32; // 16px padding on each side

  //     // Calculate how many cards can fit
  //     const totalCardWidth = CARD_WIDTH;
  //     let calculatedColumns = Math.floor(availableWidth / totalCardWidth);

  //     // Enforce min and max limits
  //     calculatedColumns = Math.max(
  //       MIN_COLUMNS,
  //       Math.min(maxColumns, calculatedColumns),
  //     );

  //     // Calculate spacing based on available width and number of columns
  //     const totalCardsWidth = calculatedColumns * CARD_WIDTH;
  //     const remainingSpace = availableWidth - totalCardsWidth;
  //     let spacing = 0;

  //     if (calculatedColumns > 1) {
  //       // Calculate space-around equivalent spacing
  //       spacing = remainingSpace / (calculatedColumns * 2); // space-around puts space on both sides
  //     }
  //     setColumns(calculatedColumns);
  //     setCardSpacing(spacing);
  //   };

  //   // Observer for container width changes
  //   const resizeObserver = new ResizeObserver(calculateLayout);

  //   if (containerRef.current) {
  //     resizeObserver.observe(containerRef.current);
  //   }

  //   window.addEventListener("resize", calculateLayout);
  //   calculateLayout();

  //   return () => {
  //     if (containerRef.current) {
  //       resizeObserver.unobserve(containerRef.current);
  //     }
  //     window.removeEventListener("resize", calculateLayout);
  //   };
  // }, [maxColumns]);

  return (
    <div ref={containerRef} className="h-[calc(100%-12rem)] flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-4">
          <div
            className="flex flex-wrap gap-[24px]"
            // style={{
            //   display: "grid",
            //   gridTemplateColumns: `repeat(${columns}, ${CARD_WIDTH}px)`,
            //   rowGap: `${CARD_GAP}px`,
            //   columnGap: "0px",
            //   justifyContent: "space-around",
            //   minHeight: "min-content"
            // }}
          >
            {cards.map((cardId) => (
              <div
                key={cardId}
                style={{
                  width: `${CARD_WIDTH}px`,
                  height: `${CARD_HEIGHT}px`,
                }}
              >
                <div className="w-full max-w-[215px] aspect-215/330">
                  <TradingCard cardId={cardId} onClick={onCardClick} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default CardGrid;
