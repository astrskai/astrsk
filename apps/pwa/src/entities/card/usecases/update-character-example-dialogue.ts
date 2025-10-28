import { Result } from "@/shared/core";
import { UseCase } from "@/shared/core/use-case";
import { UniqueEntityID } from "@/shared/domain";
import { CharacterCard } from "@/entities/card/domain";
import { LoadCardRepo, SaveCardRepo } from "@/entities/card/repos";

interface UpdateCharacterExampleDialogueRequest {
  cardId: string;
  exampleDialogue: string;
}

type UpdateCharacterExampleDialogueResponse = Result<void>;

export class UpdateCharacterExampleDialogue
  implements UseCase<UpdateCharacterExampleDialogueRequest, UpdateCharacterExampleDialogueResponse>
{
  private loadCardRepo: LoadCardRepo;
  private saveCardRepo: SaveCardRepo;

  constructor(loadCardRepo: LoadCardRepo, saveCardRepo: SaveCardRepo) {
    this.loadCardRepo = loadCardRepo;
    this.saveCardRepo = saveCardRepo;
  }

  async execute(
    request: UpdateCharacterExampleDialogueRequest,
  ): Promise<UpdateCharacterExampleDialogueResponse> {
    try {
      if (this.saveCardRepo.updateCharacterExampleDialogue) {
        const result = await this.saveCardRepo.updateCharacterExampleDialogue(
          new UniqueEntityID(request.cardId),
          request.exampleDialogue
        );
        return result;
      }

      const cardOrError = await this.loadCardRepo.getCardById(new UniqueEntityID(request.cardId));

      if (cardOrError.isFailure) {
        return Result.fail<void>(cardOrError.getError());
      }

      const card = cardOrError.getValue();

      if (!card || !(card instanceof CharacterCard)) {
        return Result.fail<void>("Card not found or not a character card");
      }

      const updateResult = card.update({ exampleDialogue: request.exampleDialogue });
      if (updateResult.isFailure) {
        return Result.fail<void>(updateResult.getError());
      }

      const saveResult = await this.saveCardRepo.saveCard(card);
      if (saveResult.isFailure) {
        return Result.fail<void>(saveResult.getError());
      }

      return Result.ok<void>();
    } catch (error) {
      console.error("Error updating character example dialogue:", error);
      return Result.fail<void>(`Failed to update character example dialogue: ${error}`);
    }
  }
}