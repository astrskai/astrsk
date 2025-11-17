import { zodResolver } from "@hookform/resolvers/zod";
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useForm } from "react-hook-form";

import { UniqueEntityID } from "@/shared/domain";

import { useAppStore } from "@/shared/stores/app-store";
import { useCardUIStore } from "@/entities/card/stores/card-ui-store";
import { NoCardsFound } from "@/features/card/card-list";
import { TradingCard } from "@/features/card/ui/trading-card";
import { CustomSheet } from "./custom-sheet";
import { cn } from "@/shared/lib";
import {
  CardItem,
  CardTab,
  CardTabValue,
  convertCardsFormToSessionProps,
  StepCardsSchema,
  StepCardsSchemaType,
} from "@/features/session/create-session/step-cards";
import {
  CarouselItem,
  SearchInput,
  SvgIcon,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/ui";
import { Card, CardType } from "@/entities/card/domain/card";
import { SessionProps } from "@/entities/session/domain/session";
import { useQuery } from "@tanstack/react-query";
import { cardQueries } from "@/entities/card/api/card-queries";

const CardListItem = ({
  cardId,
  label,
  separator,
}: {
  cardId?: UniqueEntityID;
  label?: string;
  separator?: boolean;
}) => {
  return (
    <CarouselItem
      className={cn(
        "relative basis-1/5 py-[24px] pl-[24px] lg:basis-1/6",
        separator && "mr-[25px]",
      )}
    >
      <div className="flex min-w-[154px] flex-col items-center justify-start gap-[8px]">
        {cardId && <TradingCard cardId={cardId?.toString()} />}
        {label && (
          <div className="text-text-input-subtitle text-[16px] leading-[19px] font-[500]">
            {label}
          </div>
        )}
      </div>
      {separator && (
        <div className="bg-border-container absolute top-[49px] -right-[30px] h-[160px] w-[1px]" />
      )}
    </CarouselItem>
  );
};

const EmptyCard = ({
  description,
  label,
  separator,
}: {
  description?: React.ReactNode;
  label?: string;
  separator?: boolean;
}) => {
  return (
    <CarouselItem
      className={cn(
        "relative basis-1/6 py-[24px] pl-[24px]",
        separator && "mr-[36px]",
      )}
    >
      <div className="flex flex-col items-center justify-start gap-[8px]">
        <div
          className={cn(
            "grid h-[230px] w-[154px] place-content-center rounded-[8px]",
            "bg-background-input",
          )}
        >
          <div className="text-background-dialog flex flex-col items-center gap-[13px] text-center">
            <div className="text-[12px] leading-[15px] font-[500]">
              {description}
            </div>
          </div>
        </div>
        {label && (
          <div className="text-text-input-subtitle text-[16px] leading-[19px] font-[500]">
            {label}
          </div>
        )}
      </div>
      {separator && (
        <div className="bg-border-container absolute top-[49px] -right-[30px] h-[160px] w-[1px]" />
      )}
    </CarouselItem>
  );
};

const EditCards = ({
  defaultValue,
  onSave,
  trigger: triggerNode,
  refInitCardTab,
}: {
  defaultValue: {
    userCharacterCardId: UniqueEntityID | null;
    aiCharacterCardIds: UniqueEntityID[];
    plotCardId: UniqueEntityID | null;
  };
  onSave: (newValue: Partial<SessionProps>) => Promise<void>;
  trigger?: React.ReactNode;
  refInitCardTab: MutableRefObject<CardTab>;
}) => {
  // Use form
  const { watch, setValue, trigger, getValues, reset } =
    useForm<StepCardsSchemaType>({
      resolver: zodResolver(StepCardsSchema),
    });
  const userCharacterCardId = watch("userCharacterCardId");
  const aiCharacterCardIds = watch("aiCharacterCardIds");
  const plotCardId = watch("plotCardId");

  // Card pool
  const [activeTab, setActiveTab] = useState<CardTab>("ai");
  const [activeCardIdMap, setActiveCardIdMap] = useState<Map<string, boolean>>(
    new Map(),
  );
  const [disabledCardIdMap, setDisabledCardIdMap] = useState<
    Map<string, boolean>
  >(new Map());
  const [keyword, setKeyword] = useState<string>("");
  const { data: characterCards } = useQuery(
    cardQueries.list({
      type: [CardType.Character],
      keyword: keyword,
    }),
  );
  const { data: plotCards } = useQuery(
    cardQueries.list({
      type: [CardType.Plot, CardType.Scenario],
      keyword: keyword,
    }),
  );

  const { activePage, setActivePage } = useAppStore();
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

  // Handle card click with auto-save
  const handleCardClick = useCallback(
    async (cardId: string) => {
      let newValues: Partial<StepCardsSchemaType> = {};

      switch (activeTab) {
        case CardTabValue.User:
          if (userCharacterCardId === cardId) {
            setValue("userCharacterCardId", null);
            newValues.userCharacterCardId = null;
          } else {
            setValue("userCharacterCardId", cardId);
            newValues.userCharacterCardId = cardId;
            if (aiCharacterCardIds?.includes(cardId)) {
              const newAiCardIds = aiCharacterCardIds.filter(
                (id) => id !== cardId,
              );
              setValue("aiCharacterCardIds", newAiCardIds);
              newValues.aiCharacterCardIds = newAiCardIds;
            }
          }
          break;
        case CardTabValue.AI:
          if (aiCharacterCardIds?.includes(cardId)) {
            const newAiCardIds = aiCharacterCardIds.filter(
              (id) => id !== cardId,
            );
            setValue("aiCharacterCardIds", newAiCardIds);
            newValues.aiCharacterCardIds = newAiCardIds;
          } else {
            const newAiCardIds = [...(aiCharacterCardIds ?? []), cardId];
            setValue("aiCharacterCardIds", newAiCardIds);
            newValues.aiCharacterCardIds = newAiCardIds;
            if (userCharacterCardId === cardId) {
              setValue("userCharacterCardId", null);
              newValues.userCharacterCardId = null;
            }
          }
          break;
        case CardTabValue.Plot:
          if (plotCardId === cardId) {
            setValue("plotCardId", null);
            newValues.plotCardId = null;
          } else {
            setValue("plotCardId", cardId);
            newValues.plotCardId = cardId;
          }
          break;
      }

      trigger();

      // Auto-save the changes
      const formValues = { ...getValues(), ...newValues };
      await onSave({
        ...convertCardsFormToSessionProps(formValues),
      });
    },
    [
      activeTab,
      userCharacterCardId,
      aiCharacterCardIds,
      plotCardId,
      setValue,
      trigger,
      getValues,
      onSave,
    ],
  );

  // Handle save
  const handleSave = useCallback(async () => {
    const formValues = getValues();
    await onSave({
      ...convertCardsFormToSessionProps(formValues),
    });
  }, [getValues, onSave]);

  // Validate form values
  const isValid = useMemo(() => {
    const validationStepCards = StepCardsSchema.safeParse({
      userCharacterCardId,
      aiCharacterCardIds,
      plotCardId,
    });
    return validationStepCards.success;
  }, [aiCharacterCardIds, plotCardId, userCharacterCardId]);

  return (
    <CustomSheet
      title="Cards"
      trigger={triggerNode ?? <SvgIcon name="edit" size={24} />}
      onOpenChange={(open) => {
        if (open) {
          reset({
            userCharacterCardId:
              defaultValue.userCharacterCardId?.toString() ?? null,
            aiCharacterCardIds: defaultValue.aiCharacterCardIds.map((id) =>
              id.toString(),
            ),
            plotCardId: defaultValue.plotCardId?.toString() ?? null,
          });
          setActiveTab(refInitCardTab.current);
          refInitCardTab.current = CardTabValue.AI;
        }
      }}
      fill
    >
      <Tabs
        defaultValue={CardTabValue.AI}
        className="w-full px-8 py-4"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as CardTab)}
      >
        <TabsList
          variant="dark-mobile"
          className="mb-4 grid w-full grid-cols-3"
        >
          <TabsTrigger value={CardTabValue.AI}>AI characters</TabsTrigger>
          <TabsTrigger value={CardTabValue.User}>User character</TabsTrigger>
          <TabsTrigger value={CardTabValue.Plot}>Plot</TabsTrigger>
        </TabsList>
        <TabsContent value={CardTabValue.AI}>
          <div className="bg-background-surface-2 flex flex-row flex-wrap justify-center gap-4 rounded-[16px] px-[24px] py-[16px]">
            {aiCharacterCardIds &&
              aiCharacterCardIds.map((cardId) => (
                <CardItem
                  key={cardId}
                  cardId={cardId}
                  isActive={activeCardIdMap.get(cardId)}
                  onClick={() => handleCardClick(cardId)}
                />
              ))}
            <CardItem />
          </div>
        </TabsContent>
        <TabsContent value={CardTabValue.User}>
          <div className="bg-background-surface-2 flex flex-row justify-center gap-4 rounded-[16px] px-[24px] py-[16px]">
            {userCharacterCardId ? (
              <CardItem
                cardId={userCharacterCardId}
                isActive
                onClick={() => handleCardClick(userCharacterCardId)}
              />
            ) : (
              <CardItem />
            )}
          </div>
        </TabsContent>
        <TabsContent value={CardTabValue.Plot}>
          <div className="bg-background-surface-2 flex flex-row justify-center gap-4 rounded-[16px] px-[24px] py-[16px]">
            {plotCardId ? (
              <CardItem
                cardId={plotCardId}
                isActive={activeCardIdMap.get(plotCardId)}
                onClick={() => handleCardClick(plotCardId)}
              />
            ) : (
              <CardItem />
            )}
          </div>
        </TabsContent>
      </Tabs>
      <div className="px-8 py-2">
        <SearchInput
          value={keyword}
          className="w-full"
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>
      <div className="px-8 py-4">
        {activeTab === CardTabValue.Plot
          ? plotCards?.length === 0 && (
              <div className="items-top flex w-full flex-col">
                <NoCardsFound
                  cardType={CardType.Plot}
                  onCreate={() => {
                    setCardEditOpen(CardType.Plot);
                  }}
                  variant="edit"
                />
              </div>
            )
          : characterCards?.length === 0 && (
              <div className="items-top flex w-full flex-col">
                <NoCardsFound
                  cardType={CardType.Character}
                  onCreate={() => {
                    setCardEditOpen(CardType.Character);
                  }}
                  variant="edit"
                />
              </div>
            )}
        <div className="grid grid-cols-4 gap-[24px]">
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
      </div>
    </CustomSheet>
  );
};

export { CardListItem, EditCards, EmptyCard };
