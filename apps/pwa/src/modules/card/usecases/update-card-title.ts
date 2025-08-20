import { Result } from "@/shared/core";
import { UseCase } from "@/shared/core/use-case";
import { UniqueEntityID } from "@/shared/domain";
import { Card } from "@/modules/card/domain";
import { LoadCardRepo, SaveCardRepo } from "@/modules/card/repos";

interface UpdateCardTitleRequest {
  cardId: string;
  title: string;
}

type UpdateCardTitleResponse = Result<void>;

export class UpdateCardTitle
  implements UseCase<UpdateCardTitleRequest, UpdateCardTitleResponse>
{
  private loadCardRepo: LoadCardRepo;
  private saveCardRepo: SaveCardRepo;

  constructor(loadCardRepo: LoadCardRepo, saveCardRepo: SaveCardRepo) {
    this.loadCardRepo = loadCardRepo;
    this.saveCardRepo = saveCardRepo;
  }

  async execute(
    request: UpdateCardTitleRequest,
  ): Promise<UpdateCardTitleResponse> {
    try {
      const result = await this.saveCardRepo.updateCardTitle!(
        new UniqueEntityID(request.cardId),
        request.title
      );
      return result;
    } catch (error) {
      console.error("Error updating card title:", error);
      return Result.fail<void>(`Failed to update card title: ${error}`);
    }
  }
}