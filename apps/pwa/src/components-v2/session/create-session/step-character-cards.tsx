import { useCallback, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { z } from "zod";

import { useCards } from "@/app/hooks/use-cards";
import { Page, useAppStore } from "@/app/stores/app-store";
import { NoCardsFound } from "@/components-v2/card/card-list";
import { TradingCard } from "@/components-v2/card/components/trading-card";
import { cn } from "@/components-v2/lib/utils";
import { SearchInput } from "@/components-v2/search-input";
import { TypoSmall } from "@/components-v2/typo";
import { ScrollArea } from "@/components-v2/ui/scroll-area";
import { Card, CardType } from "@/modules/card/domain";

const StepCharacterCardsSchema = z.object({
  aiCharacterCardIds: z.string().array().min(1),
});

type StepCharacterCardsSchemaType = z.infer<typeof StepCharacterCardsSchema>;

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
        "relative w-full rounded-[8px] cursor-pointer",
        !cardId && "bg-background-input aspect-154/230",
        disabled && "opacity-50 pointer-events-none",
      )}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled}
    >
      {cardId ? (
        <TradingCard cardId={cardId} />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <TypoSmall className="text-center text-background-dialog px-4">
            {placeholder}
          </TypoSmall>
        </div>
      )}
      {isActive ? (
        <div className="absolute inset-0 rounded-[8px] inset-ring-2 inset-ring-primary-normal pointer-events-none" />
      ) : (
        <div className="absolute inset-0 rounded-[8px] inset-ring-2 inset-ring-transparent pointer-events-none" />
      )}
    </div>
  );
};

const StepCharacterCards = ({ isEdit = false }: { isEdit?: boolean }) => {
  const { watch, setValue, trigger } = useFormContext<
    StepCharacterCardsSchemaType & { userCharacterCardId?: string | null }
  >();
  const aiCharacterCardIds = watch("aiCharacterCardIds") || [];
  const userCharacterCardId = watch("userCharacterCardId");

  // Card pool
  const [keyword, setKeyword] = useState<string>("");
  const [characterCards] = useCards({
    type: [CardType.Character],
    keyword: keyword,
  });
  const { setActivePage, setCardEditOpen } = useAppStore();
  // Handle card click
  const handleCardClick = useCallback(
    (cardId: string) => {
      if (aiCharacterCardIds.includes(cardId)) {
        setValue(
          "aiCharacterCardIds",
          aiCharacterCardIds.filter((id) => id !== cardId),
        );
      } else {
        setValue("aiCharacterCardIds", [...aiCharacterCardIds, cardId]);
        // Remove from user character if it was selected as user
        if (userCharacterCardId === cardId) {
          setValue("userCharacterCardId", null);
        }
      }
      trigger();
    },
    [aiCharacterCardIds, userCharacterCardId, setValue, trigger],
  );

  return (
    <div className="w-full max-w-[600px] mx-auto px-4 pb-6 flex flex-col h-full">
      {/* Header */}
      {!isEdit && (
        <div className="text-left mb-4">
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            AI character cards
            <span className="text-status-required">(Minimum 1)*</span>
          </h2>
          <p className="text-text-body text-sm font-medium leading-tight">
            Choose one or more AI characters to add to your session.
          </p>
        </div>
      )}

      {/* Selected cards display */}
      {/* <div className="mb-6">
        <div className="p-4 rounded-lg border border-border-container bg-background-card">
          <div className="flex flex-wrap gap-2 min-h-[120px]">
            {aiCharacterCardIds.length > 0 ? (
              aiCharacterCardIds.map((cardId) => (
                <div key={cardId} className="relative w-20 cursor-pointer" onClick={() => handleCardClick(cardId)}>
                  <TradingCard cardId={cardId} />
                  <div className="absolute inset-0 rounded-[8px] inset-ring-2 inset-ring-primary-normal pointer-events-none" />
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center w-full h-[120px] text-text-input-subtitle text-center">
                <TypoSmall>Select at least one AI character to continue</TypoSmall>
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
      <div className="flex-1 flex flex-col min-h-0">
        {!characterCards ? (
          // Loading state
          <div className="flex items-center justify-center flex-1">
            <div className="text-text-secondary">Loading cards...</div>
          </div>
        ) : characterCards.length === 0 ? (
          <div className="flex flex-col items-start justify-start flex-1">
            {/* <NoCardsFound
              cardType={CardType.Character}
              onCreate={() => {
                // setActivePage(Page.Cards);
                // setCardEditOpen(CardType.Character);
              }}
              variant="edit"
            /> */}
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 gap-4 pb-4">
              {characterCards.map((card: Card) => {
                const cardId = card.id.toString();
                const isDisabled = userCharacterCardId === cardId;
                return (
                  <CardItem
                    key={cardId}
                    cardId={cardId}
                    isActive={aiCharacterCardIds.includes(cardId)}
                    disabled={isDisabled}
                    onClick={() => handleCardClick(cardId)}
                  />
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export { StepCharacterCards, StepCharacterCardsSchema };
export type { StepCharacterCardsSchemaType };
