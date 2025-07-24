import { DrizzleAssetRepo } from "@/modules/asset/repos/impl/drizzle-asset-repo";
import { CloneAsset } from "@/modules/asset/usecases/clone-asset";
import { DeleteAsset } from "@/modules/asset/usecases/delete-asset";
import { GetAsset } from "@/modules/asset/usecases/get-asset";
import { SaveFileToAsset } from "@/modules/asset/usecases/save-file-to-asset";
// import { UpdateLocalSyncMetadata } from "@/modules/sync/usecases/update-local-sync-metadata";

export class AssetService {
  public static assetRepo: DrizzleAssetRepo;

  public static deleteAsset: DeleteAsset;
  public static getAsset: GetAsset;
  public static saveFileToAsset: SaveFileToAsset;
  public static cloneAsset: CloneAsset;

  private constructor() {}

  public static init() {
    this.assetRepo = new DrizzleAssetRepo();

    this.deleteAsset = new DeleteAsset(this.assetRepo);
    this.getAsset = new GetAsset(this.assetRepo);
    this.saveFileToAsset = new SaveFileToAsset(this.assetRepo);
    this.cloneAsset = new CloneAsset(this.assetRepo, this.assetRepo);
  }
}
