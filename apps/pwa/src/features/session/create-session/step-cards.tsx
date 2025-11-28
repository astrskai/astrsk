import { Check } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { z } from "zod";

import { UniqueEntityID } from "@/shared/domain";

import { useAppStore } from "@/shared/stores/app-store";
import { useCardUIStore } from "@/entities/card/stores/card-ui-store";
// import { NoCardsFound } from "@/features/card/card-list";
// import { TradingCard } from "@/features/card/ui/trading-card";
import { cn } from "@/shared/lib";
import {
  ScrollArea,
  ScrollBar,
  SearchInput,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui";
import { Card, CardType } from "@/entities/card/domain";
import { CardListItem, SessionProps } from "@/entities/session/domain";
import { useQuery } from "@tanstack/react-query";
import { cardQueries } from "@/entities/card/api/card-queries";

const StepCardsSchema = z.object({
  aiCharacterCardIds: z.string().array().min(1),
  userCharacterCardId: z.string().nullable(),
  plotCardId: z.string().nullable(),
});

type StepCardsSchemaType = z.infer<typeof StepCardsSchema>;

const CardItem = ({
  cardId,
  isActive,
  onClick,
  disabled,
  placeholder,
  className,
}: {
  cardId?: string;
  isActive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "relative aspect-154/230 w-full max-w-[154px] rounded-[8px]",
        !cardId && "bg-hover",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled}
    >
      {cardId ? (
        // TODO: TradingCard removed - implement replacement UI
        <div className="flex h-full w-full items-center justify-center bg-hover rounded-[8px]">
          <span className="text-text-subtle text-xs">Card Preview</span>
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-fg-subtle text-center text-[12px] leading-[15px] font-[500]">
            {placeholder}
          </div>
        </div>
      )}
      {isActive ? (
        <div className="inset-ring-primary-normal pointer-events-none absolute inset-0 rounded-[8px] inset-ring-2" />
      ) : (
        // Placeholder for size matching
        <div className="pointer-events-none absolute inset-0 rounded-[8px] inset-ring-2 inset-ring-transparent" />
      )}
    </div>
  );
};

// Card tab constants - no hardcoded strings
export const CardTabValue = {
  User: "user",
  AI: "ai",
  Plot: "plot",
} as const;

export type CardTab = (typeof CardTabValue)[keyof typeof CardTabValue];

const StepCards = () => {
  const { watch, setValue, trigger } = useFormContext<StepCardsSchemaType>();
  const userCharacterCardId = watch("userCharacterCardId");
  const aiCharacterCardIds = watch("aiCharacterCardIds") ?? [];
  const plotCardId = watch("plotCardId");

  // Card pool
  const [keyword, setKeyword] = useState<string>("");
  const [activeTab, setActiveTab] = useState<CardTab>(CardTabValue.AI);
  const [showAiCardError, setShowAiCardError] = useState<boolean>(false);
  const [activeCardIdMap, setActiveCardIdMap] = useState<Map<string, boolean>>(
    new Map(),
  );
  const [disabledCardIdMap, setDisabledCardIdMap] = useState<
    Map<string, boolean>
  >(new Map());
  const { data: characterCards } = useQuery(
    cardQueries.list({
      type: [CardType.Character],
      keyword: keyword,
    }),
  );
  const { data: plotCards } = useQuery(
    cardQueries.list({
      type: [CardType.Plot],
      keyword: keyword,
    }),
  );
  const { setActivePage } = useAppStore();
  const { setCardEditOpen } = useCardUIStore();

  // Refresh active and disabled cards
  const refreshCardStates = useCallback(() => {
    if (
      typeof aiCharacterCardIds === "undefined" ||
      typeof userCharacterCardId === "undefined"
    ) {
      return;
    }
    const newActiveCardIdMap = new Map<string, boolean>();
    const newDisabledCardIdMap = new Map<string, boolean>();
    if (activeTab === CardTabValue.User) {
      userCharacterCardId && newActiveCardIdMap.set(userCharacterCardId, true);
      for (const aiCharacterCardId of aiCharacterCardIds) {
        newDisabledCardIdMap.set(aiCharacterCardId, true);
      }
    } else if (activeTab === CardTabValue.AI) {
      for (const aiCharacterCardId of aiCharacterCardIds) {
        newActiveCardIdMap.set(aiCharacterCardId, true);
      }
      userCharacterCardId &&
        newDisabledCardIdMap.set(userCharacterCardId, true);
    } else if (activeTab === CardTabValue.Plot && plotCardId) {
      newActiveCardIdMap.set(plotCardId, true);
    }
    setActiveCardIdMap(newActiveCardIdMap);
    setDisabledCardIdMap(newDisabledCardIdMap);
  }, [activeTab, aiCharacterCardIds, plotCardId, userCharacterCardId]);
  useEffect(() => {
    refreshCardStates();
  }, [
    activeTab,
    aiCharacterCardIds,
    plotCardId,
    userCharacterCardId,
    refreshCardStates,
  ]);

  // Handle card click
  const handleCardClick = (cardId: string) => {
    switch (activeTab) {
      case CardTabValue.User:
        if (userCharacterCardId === cardId) {
          setValue("userCharacterCardId", null);
        } else {
          setValue("userCharacterCardId", cardId);
          if (aiCharacterCardIds.includes(cardId)) {
            setValue(
              "aiCharacterCardIds",
              aiCharacterCardIds.filter((id) => id !== cardId),
            );
          }
        }
        break;
      case CardTabValue.AI:
        if (aiCharacterCardIds.includes(cardId)) {
          setValue(
            "aiCharacterCardIds",
            aiCharacterCardIds.filter((id) => id !== cardId),
          );
        } else {
          setValue("aiCharacterCardIds", [...aiCharacterCardIds, cardId]);
          if (userCharacterCardId === cardId) {
            setValue("userCharacterCardId", null);
          }
          // Clear error state when an AI character is selected
          setShowAiCardError(false);
        }
        break;
      case CardTabValue.Plot:
        if (plotCardId === cardId) {
          setValue("plotCardId", null);
        } else {
          setValue("plotCardId", cardId);
        }
        break;
    }
    trigger();
  };

  return (
    <div className="flex min-h-[600px] w-full flex-row items-start justify-center gap-8 px-[40px]">
      <div className="min-h-[600px] w-1/2 max-w-[744px] min-w-[440px]">
        <Accordion
          type="single"
          defaultValue={CardTabValue.AI}
          value={activeTab}
          onValueChange={(newValue) => {
            // Check if trying to switch away from AI tab without selecting any AI character
            if (newValue !== CardTabValue.AI && aiCharacterCardIds.length === 0) {
              setShowAiCardError(true);
              // Don't switch tabs if no AI character is selected
              return;
            }
            setActiveTab(newValue as CardTab);
            setShowAiCardError(false);
          }}
        >
          <AccordionItem value={CardTabValue.AI} className="mb-[16px] border-b-0">
            <AccordionTrigger className="py-0 hover:no-underline">
              <div
                className={cn(
                  "bg-surface-overlay w-full rounded-[16px] p-[24px]",
                  activeTab === CardTabValue.AI
                    ? "inset-ring-primary-normal inset-ring-2"
                    : "hover:bg-hover cursor-pointer",
                )}
              >
                <div className="flex flex-row items-center gap-[12px]">
                  <div className="text-text-primary text-[20px] leading-[32px] font-[500]">
                    1. AI character cards{" "}
                    <span className="text-status-required">(Minimum 1)*</span>
                  </div>
                  {aiCharacterCardIds.length > 0 && (
                    <Check size={24} className="text-status-required" />
                  )}
                </div>
                <AccordionContent className="py-0">
                  <div className="flex h-[calc(100vh-610px)] min-h-[320px] flex-col items-start">
                    <div className="text-text-input-subtitle my-[16px] text-[16px] leading-[24px] font-[400]">
                      Choose one or more AI characters to add to your session.
                    </div>
                    <ScrollArea className="w-full flex-1 overflow-y-auto">
                      <div className="flex w-full flex-wrap justify-start gap-[24px] pr-2">
                        {aiCharacterCardIds.map((cardId) => (
                          <CardItem
                            key={cardId}
                            cardId={cardId}
                            onClick={() => handleCardClick(cardId)}
                          />
                        ))}
                        <CardItem
                          placeholder="Add at least one AI character to continue"
                          className={cn(
                            showAiCardError &&
                              aiCharacterCardIds.length === 0 &&
                              "inset-ring-status-error inset-ring-2",
                          )}
                        />
                      </div>
                      <ScrollBar orientation="vertical" />
                    </ScrollArea>
                  </div>
                </AccordionContent>
              </div>
            </AccordionTrigger>
          </AccordionItem>
          <AccordionItem value={CardTabValue.User} className="mb-[16px] border-b-0">
            <AccordionTrigger className="py-0 hover:no-underline">
              <div
                className={cn(
                  "bg-surface-overlay w-full rounded-[16px] p-[24px]",
                  activeTab === CardTabValue.User
                    ? "inset-ring-primary-normal inset-ring-2"
                    : "hover:bg-hover cursor-pointer",
                )}
              >
                <div className="flex flex-row items-center gap-[12px]">
                  <div className="text-text-primary text-[20px] leading-[32px] font-[500]">
                    2. User character card
                  </div>
                  {userCharacterCardId && (
                    <Check size={24} className="text-status-optional" />
                  )}
                </div>

                <AccordionContent className="py-0">
                  <div className="flex h-[calc(100vh-610px)] min-h-[320px] flex-col items-start">
                    <div className="text-text-input-subtitle my-[16px] text-[16px] leading-[24px] font-[400]">
                      Choose your character role for this session.
                    </div>
                    <ScrollArea className="w-full flex-1 overflow-y-auto">
                      <div className="flex w-full flex-wrap justify-start gap-[24px] pr-2">
                        {userCharacterCardId ? (
                          <CardItem
                            cardId={userCharacterCardId}
                            onClick={() => handleCardClick(userCharacterCardId)}
                          />
                        ) : (
                          <CardItem placeholder="Add yourself into the scene" />
                        )}
                      </div>
                      <ScrollBar orientation="vertical" />
                    </ScrollArea>
                  </div>
                </AccordionContent>
              </div>
            </AccordionTrigger>
          </AccordionItem>
          <AccordionItem value={CardTabValue.Plot} className="mb-[16px] border-b-0">
            <AccordionTrigger className="py-0 hover:no-underline">
              <div
                className={cn(
                  "bg-surface-overlay w-full rounded-[16px] p-[24px]",
                  activeTab === CardTabValue.Plot
                    ? "inset-ring-primary-normal inset-ring-2"
                    : "hover:bg-hover cursor-pointer",
                )}
              >
                <div className="flex flex-row items-center gap-[12px]">
                  <div className="text-text-primary text-[20px] leading-[32px] font-[500]">
                    3. Plot card
                  </div>
                  {plotCardId && (
                    <Check size={24} className="text-status-optional" />
                  )}
                </div>
                <AccordionContent className="py-0">
                  <div className="flex h-[calc(100vh-610px)] min-h-[320px] flex-col items-start">
                    <div className="text-text-input-subtitle my-[16px] text-[16px] leading-[24px] font-[400]">
                      Pick a plot to frame your session. The chosen card will
                      define the background context and provide a list of first
                      messages to choose from.
                    </div>
                    <ScrollArea className="w-full flex-1 overflow-y-auto">
                      <div className="flex w-full flex-row justify-start pr-2">
                        {plotCardId ? (
                          <CardItem
                            cardId={plotCardId}
                            onClick={() => handleCardClick(plotCardId)}
                          />
                        ) : (
                          <CardItem placeholder="Add a plot card" />
                        )}
                      </div>
                      <ScrollBar orientation="vertical" />
                    </ScrollArea>
                  </div>
                </AccordionContent>
              </div>
            </AccordionTrigger>
          </AccordionItem>
        </Accordion>
      </div>
      <div className="h-[calc(100vh-340px)] min-h-[600px] w-1/2 max-w-[746px] min-w-[440px]">
        <div className="bg-surface-overlay flex h-full flex-col gap-[24px] rounded-[24px] p-[24px]">
          <div className="flex flex-col gap-[8px]">
            <div className="text-text-primary text-[20px] leading-[32px] font-[500]">
              {activeTab === CardTabValue.Plot ? "Plot" : "Character"} cards
            </div>
            {/* <div className="font-[400] text-[16px] leading-[19px] text-text-input-subtitle">
            Select characters by dragging cards into place
          </div> */}
          </div>
          <SearchInput
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <ScrollArea className="flex-1 pr-2">
            {/* TODO: NoCardsFound removed - implement replacement empty state */}
            <div className="flex flex-wrap justify-start gap-[24px]">
              {(activeTab === CardTabValue.Plot ? plotCards : characterCards)?.map(
                (card: Card) => (
                  <CardItem
                    key={card.id.toString()}
                    cardId={card.id.toString()}
                    isActive={activeCardIdMap.get(card.id.toString())}
                    disabled={disabledCardIdMap.get(card.id.toString())}
                    onClick={() => handleCardClick(card.id.toString())}
                  />
                ),
              )}
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

function convertCardsFormToSessionProps(
  values: StepCardsSchemaType,
): Partial<SessionProps> {
  // Make all cards
  const allCards: CardListItem[] = [];
  if (values.userCharacterCardId) {
    allCards.push({
      id: new UniqueEntityID(values.userCharacterCardId),
      type: CardType.Character,
      enabled: true,
    });
  }
  if (values.aiCharacterCardIds) {
    for (const cardId of values.aiCharacterCardIds) {
      allCards.push({
        id: new UniqueEntityID(cardId),
        type: CardType.Character,
        enabled: true,
      });
    }
  }
  if (values.plotCardId) {
    allCards.push({
      id: new UniqueEntityID(values.plotCardId),
      type: CardType.Plot,
      enabled: true,
    });
  }

  return {
    allCards: allCards,
    userCharacterCardId: values?.userCharacterCardId
      ? new UniqueEntityID(values.userCharacterCardId)
      : undefined,
  };
}

export { CardItem, convertCardsFormToSessionProps, StepCards, StepCardsSchema };
export type { StepCardsSchemaType };
