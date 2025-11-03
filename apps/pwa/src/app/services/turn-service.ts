// import { UpdateLocalSyncMetadata } from "@/entities/sync/usecases/update-local-sync-metadata";
import { DrizzleTurnRepo } from "@/entities/turn/repos/impl/drizzle-turn-repo";
import { GetTurn } from "@/entities/turn/usecases/get-turn";
import { TranslateTurn } from "@/entities/turn/usecases/translate-turn";
import { UpdateTurn } from "@/entities/turn/usecases/update-turn";
import { CreatePlaceholderTurn } from "@/entities/turn/usecases/create-placeholder-turn";
import { UpdatePlaceholderWithAsset } from "@/entities/turn/usecases/update-placeholder-with-asset";
import { RemovePlaceholderTurn } from "@/entities/turn/usecases/remove-placeholder-turn";
import { DrizzleSessionRepo } from "@/entities/session/repos/impl/drizzle-session-repo";
import { UniqueEntityID } from "@/shared/domain";
import { Result } from "@/shared/core";
import { GeneratedImageService } from "./generated-image-service";
import { AssetService } from "./asset-service";
import { queryClient } from "@/shared/api/query-client";
import { generatedImageKeys } from "@/entities/generated-image/api/query-factory";

export class TurnService {
  public static turnRepo: DrizzleTurnRepo;
  public static getTurn: GetTurn;
  public static translateTurn: TranslateTurn;
  public static updateTurn: UpdateTurn;
  public static createPlaceholderTurn: CreatePlaceholderTurn;
  public static updatePlaceholderWithAsset: UpdatePlaceholderWithAsset;
  public static removePlaceholderTurn: RemovePlaceholderTurn;

  public static init() {
    this.turnRepo = new DrizzleTurnRepo();
    const sessionRepo = new DrizzleSessionRepo();

    this.getTurn = new GetTurn(this.turnRepo);
    this.translateTurn = new TranslateTurn(this.turnRepo, this.turnRepo);
    this.updateTurn = new UpdateTurn(this.turnRepo, this.turnRepo);

    // Placeholder turn use cases
    this.createPlaceholderTurn = new CreatePlaceholderTurn(
      this.turnRepo,
      sessionRepo,
      sessionRepo,
      this.turnRepo,
    );
    this.updatePlaceholderWithAsset = new UpdatePlaceholderWithAsset(
      this.turnRepo,
      this.turnRepo,
    );
    this.removePlaceholderTurn = new RemovePlaceholderTurn(
      this.turnRepo,
      this.turnRepo,
      sessionRepo,
      sessionRepo,
    );
  }

  /**
   * Delete a placeholder turn and all associated assets
   * This handles the full cleanup: GeneratedImage record, assets, and turn
   */
  public static async deletePlaceholderTurnWithAssets(
    sessionId: UniqueEntityID,
    placeholderTurnId: UniqueEntityID,
  ): Promise<Result<void>> {
    try {
      // First, get the turn to check for associated assets
      const turnResult = await this.getTurn.execute(placeholderTurnId);
      if (turnResult.isFailure) {
        console.error(
          "Failed to get turn for deletion:",
          turnResult.getError(),
        );
        // Continue with deletion anyway
      }

      const turn = turnResult.getValue();
      const selectedOption = turn?.options?.[turn.selectedOptionIndex || 0];
      const assetId = selectedOption?.assetId
        ? new UniqueEntityID(selectedOption.assetId)
        : undefined;

      // If there's an asset, handle GeneratedImage and asset cleanup
      if (assetId) {
        // First, delete the GeneratedImage record using the more efficient method
        const deleteImageResult =
          await GeneratedImageService.deleteByAssetId(assetId);

        if (deleteImageResult.isSuccess) {
          // Invalidate the generatedImages query cache to update the UI
          await queryClient.invalidateQueries({
            queryKey: generatedImageKeys.all,
          });
        } else {
          console.error(
            "Failed to delete GeneratedImage:",
            deleteImageResult.getError(),
          );
        }

        // Finally, delete the main asset
        const deleteAssetResult = await AssetService.deleteAsset.execute({
          assetId: assetId,
        });
        if (deleteAssetResult.isFailure) {
          console.error(
            "Failed to delete main asset:",
            deleteAssetResult.getError(),
          );
        }
      }

      // Now delete the placeholder turn itself
      const deleteResult = await this.removePlaceholderTurn.execute({
        sessionId,
        placeholderTurnId,
      });

      return deleteResult;
    } catch (error) {
      console.error("Error in deletePlaceholderTurnWithAssets:", error);
      return Result.fail(
        `Failed to delete placeholder turn with assets: ${error}`,
      );
    }
  }

  /**
   * Helper to check if a turn is a placeholder (delegates to use case)
   */
  public static isPlaceholderTurn = CreatePlaceholderTurn.isPlaceholderTurn;

  /**
   * Helper to get placeholder type (delegates to use case)
   */
  public static getPlaceholderType = CreatePlaceholderTurn.getPlaceholderType;
}
