import { DeleteAsset } from "@/entities/asset/usecases/delete-asset";
import { SaveFileToAsset } from "@/entities/asset/usecases/save-file-to-asset";
import { DrizzleBackgroundRepo } from "@/entities/background/repos/impl/drizzle-background-repo";
import { DeleteBackground } from "@/entities/background/usecases/delete-background";
import { GetBackground } from "@/entities/background/usecases/get-background";
import { ListBackground } from "@/entities/background/usecases/list-background";
import { SaveBackground } from "@/entities/background/usecases/save-background";
import { SaveFileToBackground } from "@/entities/background/usecases/save-file-to-background";
// import { UpdateLocalSyncMetadata } from "@/entities/sync/usecases/update-local-sync-metadata";

export class BackgroundService {
  public static backgroundRepo: DrizzleBackgroundRepo;

  public static deleteBackground: DeleteBackground;
  public static getBackground: GetBackground;
  public static listBackground: ListBackground;
  public static saveBackground: SaveBackground;
  public static saveFileToBackground: SaveFileToBackground;

  public static init(
    saveFileToAsset: SaveFileToAsset,
    deleteAsset: DeleteAsset,
    // updateLocalSyncMetadata: UpdateLocalSyncMetadata,
  ) {
    this.backgroundRepo = new DrizzleBackgroundRepo();

    this.deleteBackground = new DeleteBackground(
      this.backgroundRepo,
      deleteAsset,
    );
    this.getBackground = new GetBackground(this.backgroundRepo);
    this.listBackground = new ListBackground(this.backgroundRepo);
    this.saveBackground = new SaveBackground(this.backgroundRepo);
    this.saveFileToBackground = new SaveFileToBackground(
      saveFileToAsset,
      this.saveBackground,
    );
  }
}
