import { Result } from "@/shared/core";
import { UseCase } from "@/shared/core/use-case";
import { UniqueEntityID } from "@/shared/domain";
import { Card } from "@/modules/card/domain";
import { LoadCardRepo, SaveCardRepo } from "@/modules/card/repos";

interface UpdateCardConceptualOriginRequest {
  cardId: string;
  conceptualOrigin: string;
}

type UpdateCardConceptualOriginResponse = Result<void>;

export class UpdateCardConceptualOrigin
  implements UseCase<UpdateCardConceptualOriginRequest, UpdateCardConceptualOriginResponse>
{
  private loadCardRepo: LoadCardRepo;
  private saveCardRepo: SaveCardRepo;

  constructor(loadCardRepo: LoadCardRepo, saveCardRepo: SaveCardRepo) {
    this.loadCardRepo = loadCardRepo;
    this.saveCardRepo = saveCardRepo;
  }

  async execute(
    request: UpdateCardConceptualOriginRequest,
  ): Promise<UpdateCardConceptualOriginResponse> {
    try {
      if (this.saveCardRepo.updateCardConceptualOrigin) {
        const result = await this.saveCardRepo.updateCardConceptualOrigin(
          new UniqueEntityID(request.cardId),
          request.conceptualOrigin
        );
        return result;
      }

      const cardOrError = await this.loadCardRepo.getCardById(new UniqueEntityID(request.cardId));

      if (cardOrError.isFailure) {
        return Result.fail<void>(cardOrError.getError());
      }

      const card = cardOrError.getValue();

      if (!card) {
        return Result.fail<void>("Card not found");
      }

      const updateResult = card.update({ conceptualOrigin: request.conceptualOrigin });
      if (updateResult.isFailure) {
        return Result.fail<void>(updateResult.getError());
      }

      const saveResult = await this.saveCardRepo.saveCard(card);
      if (saveResult.isFailure) {
        return Result.fail<void>(saveResult.getError());
      }

      return Result.ok<void>();
    } catch (error) {
      console.error("Error updating card conceptual origin:", error);
      return Result.fail<void>(`Failed to update card conceptual origin: ${error}`);
    }
  }
}