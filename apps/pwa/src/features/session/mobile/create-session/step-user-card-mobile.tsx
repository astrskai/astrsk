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
export { StepUserCardSchema } from "@/features/session/create-session/step-user-card";
export type StepUserCardSchemaType = z.infer<
  typeof import("@/features/session/create-session/step-user-card").StepUserCardSchema
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

// Mobile Step User Card Component
export const StepUserCardMobile = ({
  isEdit = false,
}: {
  isEdit?: boolean;
}) => {
  const { watch, setValue, trigger } = useFormContext<
    StepUserCardSchemaType & { aiCharacterCardIds?: string[] }
  >();
  const userCharacterCardId = watch("userCharacterCardId");
  const aiCharacterCardIds = watch("aiCharacterCardIds") || [];

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
      if (userCharacterCardId === cardId) {
        setValue("userCharacterCardId", null);
      } else {
        setValue("userCharacterCardId", cardId);
        // Remove from AI characters if it was selected as AI
        if (aiCharacterCardIds.includes(cardId)) {
          setValue(
            "aiCharacterCardIds",
            aiCharacterCardIds.filter((id) => id !== cardId),
          );
        }
      }
      trigger();
    },
    [userCharacterCardId, aiCharacterCardIds, setValue, trigger],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-1 flex-col gap-[24px] overflow-hidden p-[16px] pb-0">
        {/* Header */}
        {!isEdit && (
          <div className="flex flex-col gap-[8px]">
            <TypoXLarge className="text-text-primary font-semibold">
              User character card
            </TypoXLarge>
            <p className="text-text-body text-sm leading-tight font-medium">
              Choose your character role for this session.
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
              placeholder="Search characters"
            />
          </div>

          {/* Available cards */}
          <div className="flex-1 overflow-hidden">
            {!characterCards ? (
              // Loading state
              <div className="flex h-full items-center justify-center">
                <TypoBase className="text-muted-foreground">
                  Loading cards...
                </TypoBase>
              </div>
            ) : characterCards.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <TypoBase className="text-muted-foreground mb-2">
                    {keyword
                      ? `No results for '${keyword}'`
                      : "No character cards available"}
                  </TypoBase>
                  <TypoSmall className="text-muted-foreground">
                    {keyword
                      ? "Try a different search term"
                      : "Create character cards first"}
                  </TypoSmall>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="p-[2px]">
                  <div className="grid grid-cols-2 gap-[8px]">
                    {characterCards.map((card: Card) => {
                      const cardId = card.id.toString();
                      const isDisabled = aiCharacterCardIds.includes(cardId);
                      return (
                        <CardItemMobile
                          key={cardId}
                          cardId={cardId}
                          isActive={userCharacterCardId === cardId}
                          disabled={isDisabled}
                          onClick={() => handleCardClick(cardId)}
                        />
                      );
                    })}
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
