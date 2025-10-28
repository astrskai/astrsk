import { Result } from "@/shared/core";
import { UseCase } from "@/shared/core/use-case";
import { UniqueEntityID } from "@/shared/domain";
import { Card } from "@/entities/card/domain";
import { LoadCardRepo, SaveCardRepo } from "@/entities/card/repos";

interface UpdateCardTagsRequest {
  cardId: string;
  tags: string[];
}

type UpdateCardTagsResponse = Result<void>;

export class UpdateCardTags
  implements UseCase<UpdateCardTagsRequest, UpdateCardTagsResponse>
{
  private loadCardRepo: LoadCardRepo;
  private saveCardRepo: SaveCardRepo;

  constructor(loadCardRepo: LoadCardRepo, saveCardRepo: SaveCardRepo) {
    this.loadCardRepo = loadCardRepo;
    this.saveCardRepo = saveCardRepo;
  }

  async execute(
    request: UpdateCardTagsRequest,
  ): Promise<UpdateCardTagsResponse> {
    try {
      if (this.saveCardRepo.updateCardTags) {
        const result = await this.saveCardRepo.updateCardTags(
          new UniqueEntityID(request.cardId),
          request.tags
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

      const updateResult = card.update({ tags: request.tags });
      if (updateResult.isFailure) {
        return Result.fail<void>(updateResult.getError());
      }

      const saveResult = await this.saveCardRepo.saveCard(card);
      if (saveResult.isFailure) {
        return Result.fail<void>(saveResult.getError());
      }

      return Result.ok<void>();
    } catch (error) {
      console.error("Error updating card tags:", error);
      return Result.fail<void>(`Failed to update card tags: ${error}`);
    }
  }
}