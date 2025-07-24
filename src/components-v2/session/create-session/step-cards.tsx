import { Check } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { z } from "zod";

import { UniqueEntityID } from "@/shared/domain";

import { useCards } from "@/app/hooks/use-cards";
import { Page, useAppStore } from "@/app/stores/app-store";
import { NoCardsFound } from "@/components-v2/card/card-list";
import { TradingCard } from "@/components-v2/card/components/trading-card";
import { cn } from "@/components-v2/lib/utils";
import { SearchInput } from "@/components-v2/search-input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components-v2/ui/accordion";
import { ScrollArea, ScrollBar } from "@/components-v2/ui/scroll-area";
import { CardType } from "@/modules/card/domain";
import { CardListItem, SessionProps } from "@/modules/session/domain";
import { useQuery } from "@tanstack/react-query";
import { cardQueries } from "@/app/queries/card-queries";

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
        "relative w-full max-w-[154px] aspect-154/230 rounded-[8px]",
        !cardId && "bg-background-surface-4",
        disabled && "opacity-50 pointer-events-none",
        className,
      )}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled}
    >
      {cardId ? (
        <TradingCard cardId={cardId} />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-center font-[500] text-[12px] leading-[15px] text-background-surface-5">
            {placeholder}
          </div>
        </div>
      )}
      {isActive ? (
        <div className="absolute inset-0 rounded-[8px] inset-ring-2 inset-ring-primary-normal pointer-events-none" />
      ) : (
        // Placeholder for size matching
        <div className="absolute inset-0 rounded-[8px] inset-ring-2 inset-ring-transparent pointer-events-none" />
      )}
    </div>
  );
};

type CardTab = "user" | "ai" | "plot";

const StepCards = () => {
  const { watch, setValue, trigger } = useFormContext<StepCardsSchemaType>();
  const userCharacterCardId = watch("userCharacterCardId");
  const aiCharacterCardIds = watch("aiCharacterCardIds");
  const plotCardId = watch("plotCardId");

  // Card pool
  const [keyword, setKeyword] = useState<string>("");
  const [activeTab, setActiveTab] = useState<CardTab>("ai");
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
  const { setActivePage, setCardEditOpen } = useAppStore();

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
    if (activeTab === "user") {
      userCharacterCardId && newActiveCardIdMap.set(userCharacterCardId, true);
      for (const aiCharacterCardId of aiCharacterCardIds) {
        newDisabledCardIdMap.set(aiCharacterCardId, true);
      }
    } else if (activeTab === "ai") {
      for (const aiCharacterCardId of aiCharacterCardIds) {
        newActiveCardIdMap.set(aiCharacterCardId, true);
      }
      userCharacterCardId &&
        newDisabledCardIdMap.set(userCharacterCardId, true);
    } else if (activeTab === "plot" && plotCardId) {
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
      case "user":
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
      case "ai":
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
      case "plot":
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
    <div className="w-full flex flex-row gap-8 items-start justify-center px-[40px] min-h-[600px]">
      <div className="w-1/2 min-w-[440px] max-w-[744px] min-h-[600px]">
        <Accordion
          type="single"
          defaultValue="ai"
          value={activeTab}
          onValueChange={(newValue) => {
            // Check if trying to switch away from AI tab without selecting any AI character
            if (newValue !== "ai" && aiCharacterCardIds.length === 0) {
              setShowAiCardError(true);
              // Don't switch tabs if no AI character is selected
              return;
            }
            setActiveTab(newValue as CardTab);
            setShowAiCardError(false);
          }}
        >
          <AccordionItem value="ai" className="border-b-0 mb-[16px]">
            <AccordionTrigger className="py-0 hover:no-underline">
              <div
                className={cn(
                  "w-full p-[24px] bg-background-surface-3 rounded-[16px]",
                  activeTab === "ai"
                    ? "inset-ring-2 inset-ring-primary-normal"
                    : "hover:bg-background-surface-4 cursor-pointer",
                )}
              >
                <div className="flex flex-row gap-[12px] items-center">
                  <div className="font-[500] text-[20px] leading-[32px] text-text-primary">
                    1. AI character cards{" "}
                    <span className="text-status-required">(Minimum 1)*</span>
                  </div>
                  {aiCharacterCardIds.length > 0 && (
                    <Check size={24} className="text-status-required" />
                  )}
                </div>
                <AccordionContent className="py-0">
                  <div className="flex flex-col items-start h-[calc(100vh-610px)] min-h-[320px]">
                    <div className="my-[16px] font-[400] text-[16px] leading-[24px] text-text-input-subtitle">
                      Choose one or more AI characters to add to your session.
                    </div>
                    <ScrollArea className="w-full flex-1 overflow-y-auto">
                      <div className="flex flex-wrap gap-[24px] w-full justify-start pr-2">
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
                              "inset-ring-2 inset-ring-status-destructive-light",
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
          <AccordionItem value="user" className="border-b-0 mb-[16px]">
            <AccordionTrigger className="py-0 hover:no-underline">
              <div
                className={cn(
                  "w-full p-[24px] bg-background-surface-3 rounded-[16px]",
                  activeTab === "user"
                    ? "inset-ring-2 inset-ring-primary-normal"
                    : "hover:bg-background-surface-4 cursor-pointer",
                )}
              >
                <div className="flex flex-row gap-[12px] items-center">
                  <div className="font-[500] text-[20px] leading-[32px] text-text-primary">
                    2. User character card
                  </div>
                  {userCharacterCardId && (
                    <Check size={24} className="text-status-optional" />
                  )}
                </div>

                <AccordionContent className="py-0">
                  <div className="flex flex-col items-start h-[calc(100vh-610px)] min-h-[320px]">
                    <div className="my-[16px] font-[400] text-[16px] leading-[24px] text-text-input-subtitle">
                      Choose your character role for this session.
                    </div>
                    <ScrollArea className="w-full flex-1 overflow-y-auto">
                      <div className="w-full flex flex-wrap gap-[24px] justify-start pr-2">
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
          <AccordionItem value="plot" className="border-b-0 mb-[16px]">
            <AccordionTrigger className="py-0 hover:no-underline ">
              <div
                className={cn(
                  "w-full p-[24px] bg-background-surface-3 rounded-[16px]",
                  activeTab === "plot"
                    ? "inset-ring-2 inset-ring-primary-normal"
                    : "hover:bg-background-surface-4 cursor-pointer",
                )}
              >
                <div className="flex flex-row gap-[12px] items-center">
                  <div className="font-[500] text-[20px] leading-[32px] text-text-primary">
                    3. Plot card
                  </div>
                  {plotCardId && (
                    <Check size={24} className="text-status-optional" />
                  )}
                </div>
                <AccordionContent className="py-0">
                  <div className="flex flex-col items-start h-[calc(100vh-610px)] min-h-[320px]">
                    <div className="my-[16px] font-[400] text-[16px] leading-[24px] text-text-input-subtitle">
                      Pick a plot to frame your session. The chosen card will
                      define the background context and provide a list of first
                      messages to choose from.
                    </div>
                    <ScrollArea className="w-full flex-1 overflow-y-auto">
                      <div className="w-full flex flex-row justify-start pr-2">
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
      <div className="w-1/2 min-w-[440px] max-w-[746px] h-[calc(100vh-340px)] min-h-[600px]">
        <div className="p-[24px] rounded-[24px] bg-background-surface-3 flex flex-col gap-[24px] h-full">
          <div className="flex flex-col gap-[8px]">
            <div className="font-[500] text-[20px] leading-[32px] text-text-primary">
              {activeTab === "plot" ? "Plot" : "Character"} cards
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
            {activeTab === "plot"
              ? plotCards?.length === 0 && (
                  <div className="flex flex-col items-top w-full">
                    <NoCardsFound
                      cardType={CardType.Plot}
                      onCreate={() => {
                        setActivePage(Page.Cards);
                        setCardEditOpen(CardType.Plot);
                      }}
                      variant="edit"
                    />
                  </div>
                )
              : characterCards?.length === 0 && (
                  <div className="flex flex-col items-top w-full">
                    <NoCardsFound
                      cardType={CardType.Character}
                      onCreate={() => {
                        setActivePage(Page.Cards);
                        setCardEditOpen(CardType.Character);
                      }}
                      variant="edit"
                    />
                  </div>
                )}
            <div className="flex flex-wrap gap-[24px] justify-start">
              {(activeTab === "plot" ? plotCards : characterCards)?.map(
                (card) => (
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
export type { CardTab, StepCardsSchemaType };
