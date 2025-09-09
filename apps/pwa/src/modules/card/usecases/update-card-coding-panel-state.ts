import { Result } from "@/shared/core/result";
import { UseCase } from "@/shared/core/use-case";
import { UniqueEntityID } from "@/shared/domain";
import { LoadCardRepo, SaveCardRepo } from "../repos";

export interface UpdateCardCodingPanelStateRequest {
  cardId: UniqueEntityID;
  isCodingPanelOpen: boolean;
}

export class UpdateCardCodingPanelState
  implements UseCase<UpdateCardCodingPanelStateRequest, Promise<Result<void>>>
{
  private loadCardRepo: LoadCardRepo;
  private saveCardRepo: SaveCardRepo;

  constructor(loadCardRepo: LoadCardRepo, saveCardRepo: SaveCardRepo) {
    this.loadCardRepo = loadCardRepo;
    this.saveCardRepo = saveCardRepo;
  }

  async execute(request: UpdateCardCodingPanelStateRequest): Promise<Result<void>> {
    try {
      // Load the card
      const cardOrError = await this.loadCardRepo.getCardById(request.cardId);
      if (cardOrError.isFailure) {
        return Result.fail(cardOrError.getError());
      }

      const card = cardOrError.getValue();

      // Update the coding panel state
      const updateResult = card.update({
        isCodingPanelOpen: request.isCodingPanelOpen,
      });

      if (updateResult.isFailure) {
        return Result.fail(updateResult.getError());
      }

      // Save the updated card
      const saveResult = await this.saveCardRepo.saveCard(card);
      if (saveResult.isFailure) {
        return Result.fail(saveResult.getError());
      }

      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to update card coding panel state: ${error}`);
    }
  }
}