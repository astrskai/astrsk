import { Result } from "@/shared/core/result";
import { UseCase } from "@/shared/core/use-case";
import { UniqueEntityID } from "@/shared/domain";

import { Card } from "@/modules/card/domain";
import { LoadCardRepo, SaveCardRepo } from "@/modules/card/repos";

interface UpdateCardImagePromptRequest {
  cardId: string;
  imagePrompt: string;
}

type UpdateCardImagePromptResponse = Result<void>;

export class UpdateCardImagePrompt
  implements
    UseCase<UpdateCardImagePromptRequest, UpdateCardImagePromptResponse>
{
  private loadCardRepo: LoadCardRepo;
  private saveCardRepo: SaveCardRepo;

  constructor(loadCardRepo: LoadCardRepo, saveCardRepo: SaveCardRepo) {
    this.loadCardRepo = loadCardRepo;
    this.saveCardRepo = saveCardRepo;
  }

  async execute(
    request: UpdateCardImagePromptRequest,
  ): Promise<UpdateCardImagePromptResponse> {
    try {
      // Load card
      const cardOrError = await this.loadCardRepo.getCardById(
        new UniqueEntityID(request.cardId),
      );

      // Check if loading failed
      if (cardOrError.isFailure) {
        return Result.fail<void>(cardOrError.getError());
      }

      const card = cardOrError.getValue();

      // Check card exists
      if (!card) {
        return Result.fail<void>("Card not found");
      }

      // Update image prompt using the update method
      const updateResult = card.update({ imagePrompt: request.imagePrompt });
      if (updateResult.isFailure) {
        return Result.fail<void>(updateResult.getError());
      }

      // Save card
      const saveResult = await this.saveCardRepo.saveCard(card);
      if (saveResult.isFailure) {
        return Result.fail<void>(saveResult.getError());
      }

      return Result.ok<void>();
    } catch (error) {
      console.error("Error updating card image prompt:", error);
      return Result.fail<void>(`Failed to update card image prompt: ${error}`);
    }
  }
}
