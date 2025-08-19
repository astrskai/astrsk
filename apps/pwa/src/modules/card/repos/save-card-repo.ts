import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { Transaction } from "@/db/transaction";
import { Card } from "@/modules/card/domain";

export interface SaveCardRepo {
  saveCard(card: Card, tx?: Transaction): Promise<Result<Card>>;
  updateCardTitle?(cardId: UniqueEntityID, title: string): Promise<Result<void>>;
  updateCardSummary?(cardId: UniqueEntityID, summary: string): Promise<Result<void>>;
  updateCardVersion?(cardId: UniqueEntityID, version: string): Promise<Result<void>>;
  updateCardConceptualOrigin?(cardId: UniqueEntityID, conceptualOrigin: string): Promise<Result<void>>;
  updateCardCreator?(cardId: UniqueEntityID, creator: string): Promise<Result<void>>;
  updateCardTags?(cardId: UniqueEntityID, tags: string[]): Promise<Result<void>>;
  updateCardLorebook?(cardId: UniqueEntityID, lorebook: any[]): Promise<Result<void>>;
  updateCardScenarios?(cardId: UniqueEntityID, scenarios: any[]): Promise<Result<void>>;
  updateCharacterName?(cardId: UniqueEntityID, name: string): Promise<Result<void>>;
  updateCharacterDescription?(cardId: UniqueEntityID, description: string): Promise<Result<void>>;
  updateCharacterExampleDialogue?(cardId: UniqueEntityID, exampleDialogue: string): Promise<Result<void>>;
  updatePlotDescription?(cardId: UniqueEntityID, description: string): Promise<Result<void>>;
}
