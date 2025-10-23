import { cn } from "@/shared/lib";
import { CheckboxMobile } from "@/shared/ui";
import { TradingCard } from "@/features/card/components/trading-card";
import { Card, CardType } from "@/entities/card/domain";

interface CardGridMobileProps {
  cards: Card[];
  type: CardType;
  isSelectionMode: boolean;
  selectedCards: Set<string>;
  onToggleSelection: (cardId: string) => void;
  onCardClick: (cardId: string, type: CardType) => void;
}

export function CardGridMobile({
  cards,
  type,
  isSelectionMode,
  selectedCards,
  onToggleSelection,
  onCardClick,
}: CardGridMobileProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => (
        <div key={card.id.toString()} className="relative">
          {isSelectionMode && (
            <div className="absolute top-2 left-2 z-10">
              <CheckboxMobile
                checked={selectedCards.has(card.id.toString())}
                onCheckedChange={() => onToggleSelection(card.id.toString())}
                className="h-5 w-5 bg-white/80"
              />
            </div>
          )}
          <button
            onClick={() => {
              if (isSelectionMode) {
                onToggleSelection(card.id.toString());
              } else {
                onCardClick(card.id.toString(), type);
              }
            }}
            className={cn(
              "w-full rounded-xl relative",
              selectedCards.has(card.id.toString()) &&
                "ring-2 ring-button-background-primary",
            )}
          >
            <TradingCard cardId={card.id.toString()} />
            {selectedCards.has(card.id.toString()) && (
              <div className="absolute inset-0 bg-button-background-primary/50 rounded-xl" />
            )}
          </button>
        </div>
      ))}
    </div>
  );
}