import { UniqueEntityID } from "@/shared/domain";
import { CardType } from "@/modules/card/domain";
import { CardListItem, SessionProps } from "@/modules/session/domain";

interface CombinedCardsFormValues {
  aiCharacterCardIds: string[];
  userCharacterCardId: string | null;
  plotCardId: string | null;
}

function convertCombinedCardsFormToSessionProps(
  values: CombinedCardsFormValues,
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

export { convertCombinedCardsFormToSessionProps };
export type { CombinedCardsFormValues };
