import { Result } from "@/shared/core";
import { UseCase } from "@/shared/core/use-case";
import { UniqueEntityID } from "@/shared/domain";
import { SaveCardRepo } from "@/entities/card/repos";

interface UpdateCardIconAssetRequest {
  cardId: string;
  iconAssetId: string | null;
}

type UpdateCardIconAssetResponse = Result<void>;

export class UpdateCardIconAsset
  implements UseCase<UpdateCardIconAssetRequest, UpdateCardIconAssetResponse>
{
  private saveCardRepo: SaveCardRepo;

  constructor(saveCardRepo: SaveCardRepo) {
    this.saveCardRepo = saveCardRepo;
  }

  async execute(
    request: UpdateCardIconAssetRequest,
  ): Promise<UpdateCardIconAssetResponse> {
    try {
      const result = await this.saveCardRepo.updateCardIconAssetId!(
        new UniqueEntityID(request.cardId),
        request.iconAssetId ? new UniqueEntityID(request.iconAssetId) : null
      );
      return result;
    } catch (error) {
      console.error("Error updating card icon asset:", error);
      return Result.fail<void>(`Failed to update card icon asset: ${error}`);
    }
  }
}