import { useCallback, useState } from "react";
import { useFormContext } from "react-hook-form";
import { z } from "zod";

import { useCards } from "@/app/hooks/use-cards";
import { Page, useAppStore } from "@/app/stores/app-store";
import { NoCardsFound } from "@/features/card/card-list";
import { TradingCard } from "@/features/card/components/trading-card";
import { cn } from "@/shared/lib";
import { ScrollArea, SearchInput, TypoSmall } from "@/shared/ui";
import { Card, CardType } from "@/modules/card/domain";

const StepPlotCardSchema = z.object({
  plotCardId: z.string().nullable(),
});

type StepPlotCardSchemaType = z.infer<typeof StepPlotCardSchema>;

const CardItem = ({
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

const StepPlotCard = ({ isEdit = false }: { isEdit?: boolean }) => {
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
    <div className="mx-auto flex h-full w-full max-w-[600px] flex-col px-4 pb-6">
      {/* Header */}
      {!isEdit && (
        <div className="mb-4 text-left">
          <h2 className="text-text-primary mb-2 text-xl font-semibold">
            Plot card
          </h2>
          <p className="text-text-body text-sm leading-tight font-medium">
            Pick a plot to frame your session. The chosen card will define the
            background context and provide a list of first messages to choose
            from.
          </p>
        </div>
      )}

      {/* Selected card display */}
      {/* <div className="mb-6">
        <div className="p-4 rounded-lg border border-border-container bg-background-card">
          <div className="flex justify-center min-h-[120px] items-center">
            {plotCardId ? (
              <div className="relative w-20 cursor-pointer" onClick={() => handleCardClick(plotCardId)}>
                <TradingCard cardId={plotCardId} />
                <div className="absolute inset-0 rounded-[8px] inset-ring-2 inset-ring-primary-normal pointer-events-none" />
              </div>
            ) : (
              <div className="flex items-center justify-center w-full h-[120px] text-text-input-subtitle text-center">
                <TypoSmall>No plot selected. You can skip this step or choose a plot below.</TypoSmall>
              </div>
            )}
          </div>
        </div>
      </div> */}

      {/* Search */}
      <div className="mb-[12px]">
        <SearchInput
          variant="mobile"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search"
        />
      </div>

      {/* Available cards */}
      <div className="flex min-h-0 flex-1 flex-col">
        {!plotCards ? (
          // Loading state
          <div className="flex flex-1 items-center justify-center">
            <div className="text-text-secondary">Loading cards...</div>
          </div>
        ) : plotCards.length === 0 ? (
          <div className="flex flex-1 flex-col items-start justify-start">
            {/* <NoCardsFound
              cardType={CardType.Plot}
              onCreate={() => {
                // setActivePage(Page.Cards);
                // setCardEditOpen(CardType.Plot);
              }}
              variant="edit"
            /> */}
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 gap-4 pb-4">
              {plotCards.map((card: Card) => (
                <CardItem
                  key={card.id.toString()}
                  cardId={card.id.toString()}
                  isActive={plotCardId === card.id.toString()}
                  onClick={() => handleCardClick(card.id.toString())}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export { StepPlotCard, StepPlotCardSchema };
export type { StepPlotCardSchemaType };
