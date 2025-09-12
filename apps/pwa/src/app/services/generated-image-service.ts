import { DeleteAsset } from "@/modules/asset/usecases/delete-asset";
import { SaveFileToAsset } from "@/modules/asset/usecases/save-file-to-asset";
import { DrizzleGeneratedImageRepo } from "@/modules/generated-image/repos/impl/drizzle-generated-image-repo";
import { DeleteGeneratedImage } from "@/modules/generated-image/usecases/delete-generated-image";
import { GetGeneratedImage } from "@/modules/generated-image/usecases/get-generated-image";
import { ListGeneratedImages } from "@/modules/generated-image/usecases/list-generated-images";
import { SaveGeneratedImage } from "@/modules/generated-image/usecases/save-generated-image";
import { SaveFileToGeneratedImage } from "@/modules/generated-image/usecases/save-file-to-generated-image";
import { SaveGeneratedImageFromAsset } from "@/modules/generated-image/usecases/save-generated-image-from-asset";

export class GeneratedImageService {
  public static generatedImageRepo: DrizzleGeneratedImageRepo;

  public static deleteGeneratedImage: DeleteGeneratedImage;
  public static getGeneratedImage: GetGeneratedImage;
  public static listGeneratedImages: ListGeneratedImages;
  public static saveGeneratedImage: SaveGeneratedImage;
  public static saveFileToGeneratedImage: SaveFileToGeneratedImage;
  public static saveGeneratedImageFromAsset: SaveGeneratedImageFromAsset;

  public static init(
    saveFileToAsset: SaveFileToAsset,
    deleteAsset: DeleteAsset,
  ) {
    this.generatedImageRepo = new DrizzleGeneratedImageRepo();

    this.getGeneratedImage = new GetGeneratedImage(this.generatedImageRepo);
    this.listGeneratedImages = new ListGeneratedImages(this.generatedImageRepo);
    this.saveGeneratedImage = new SaveGeneratedImage(this.generatedImageRepo);
    this.deleteGeneratedImage = new DeleteGeneratedImage(
      this.generatedImageRepo,
      deleteAsset,
      this.getGeneratedImage,
    );
    this.saveFileToGeneratedImage = new SaveFileToGeneratedImage(
      saveFileToAsset,
      this.saveGeneratedImage,
      this.generatedImageRepo,
    );
    this.saveGeneratedImageFromAsset = new SaveGeneratedImageFromAsset(
      this.saveGeneratedImage,
    );
  }
}