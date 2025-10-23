import { useCallback, useState } from "react";
import { useFormContext } from "react-hook-form";
import { z } from "zod";

import { useCards } from "@/app/hooks/use-cards";
import { Page, useAppStore } from "@/app/stores/app-store";
import { NoCardsFound } from "@/features/card/card-list";
import { TradingCard } from "@/features/card/components/trading-card";
import { cn } from "@/shared/lib";
import { SearchInput } from "@/components/ui/search-input";
import { TypoBase, TypoSmall, TypoXLarge } from "@/components/ui/typo";
import { ScrollArea, ScrollBar } from "@/shared/ui/scroll-area";
import { Card, CardType } from "@/modules/card/domain";

// Re-export schema from the shared step
export { StepPlotCardSchema } from "@/features/session/create-session/step-plot-card";
export type StepPlotCardSchemaType = z.infer<
  typeof import("@/features/session/create-session/step-plot-card").StepPlotCardSchema
>;

// Mobile Card Item
const CardItemMobile = ({
  cardId,
  isActive,
  onClick,
  disabled,
  placeholder,
}: {
  cardId?: string;
  isActive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  placeholder?: string;
}) => {
  return (
    <div
      className={cn(
        "relative w-full cursor-pointer rounded-[8px]",
        !cardId && "bg-background-input aspect-154/230",
        disabled && "pointer-events-none opacity-50",
      )}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled}
    >
      {cardId ? (
        <TradingCard cardId={cardId} />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <TypoSmall className="text-background-dialog px-4 text-center">
            {placeholder}
          </TypoSmall>
        </div>
      )}
      {isActive ? (
        <div className="inset-ring-primary-normal pointer-events-none absolute inset-0 rounded-[8px] inset-ring-2" />
      ) : (
        <div className="pointer-events-none absolute inset-0 rounded-[8px] inset-ring-2 inset-ring-transparent" />
      )}
    </div>
  );
};

// Mobile Step Plot Card Component
export const StepPlotCardMobile = ({
  isEdit = false,
}: {
  isEdit?: boolean;
}) => {
  const { watch, setValue, trigger } = useFormContext<StepPlotCardSchemaType>();
  const plotCardId = watch("plotCardId");

  // Card pool
  const [keyword, setKeyword] = useState<string>("");
  const [plotCards] = useCards({
    type: [CardType.Plot],
    keyword: keyword,
  });
  const { setActivePage, setCardEditOpen } = useAppStore();

  // Handle card click
  const handleCardClick = useCallback(
    (cardId: string) => {
      if (plotCardId === cardId) {
        setValue("plotCardId", null);
      } else {
        setValue("plotCardId", cardId);
      }
      trigger();
    },
    [plotCardId, setValue, trigger],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-1 flex-col gap-[24px] overflow-hidden p-[16px] pb-0">
        {/* Header */}
        {!isEdit && (
          <div className="flex flex-col gap-[8px]">
            <TypoXLarge className="text-text-primary font-semibold">
              Plot card
            </TypoXLarge>
            <p className="text-text-body text-sm leading-tight font-medium">
              Pick a plot to frame your session. The chosen card will define the
              background context and provide a list of first messages to choose
              from.
            </p>
          </div>
        )}

        {/* Search */}
        <div className="flex flex-col gap-[16px]">
          <div className="flex-shrink-0">
            <SearchInput
              variant="mobile"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search plots"
            />
          </div>

          {/* Available cards */}
          <div className="flex-1 overflow-hidden">
            {!plotCards ? (
              // Loading state
              <div className="flex h-full items-center justify-center">
                <TypoBase className="text-muted-foreground">
                  Loading cards...
                </TypoBase>
              </div>
            ) : plotCards.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <TypoBase className="text-muted-foreground mb-2">
                    {keyword
                      ? `No results for '${keyword}'`
                      : "No plot cards available"}
                  </TypoBase>
                  <TypoSmall className="text-muted-foreground">
                    {keyword
                      ? "Try a different search term"
                      : "Create plot cards first"}
                  </TypoSmall>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="p-[2px]">
                  <div className="grid grid-cols-2 gap-[8px]">
                    {plotCards.map((card: Card) => (
                      <CardItemMobile
                        key={card.id.toString()}
                        cardId={card.id.toString()}
                        isActive={plotCardId === card.id.toString()}
                        onClick={() => handleCardClick(card.id.toString())}
                      />
                    ))}
                  </div>
                </div>
                <ScrollBar orientation="vertical" className="w-0" />
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
