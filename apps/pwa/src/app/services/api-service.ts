import { httpClient } from "@/shared/infra";

import { DrizzleApiConnectionRepo } from "@/modules/api/repos/impl/drizzle-api-connection-repo";
import {
  CheckApiModel,
  DeleteApiConnection,
  GetApiConnection,
  ListApiConnection,
  ListApiModel,
  SaveApiConnection,
  UpdateApiConnection,
} from "@/modules/api/usecases";
import { CheckApiKey } from "@/modules/api/usecases/check-api-key";
// import { UpdateLocalSyncMetadata } from "@/modules/sync/usecases/update-local-sync-metadata";

export class ApiService {
  public static apiConnectionRepo: DrizzleApiConnectionRepo;

  public static checkApiKey: CheckApiKey;
  public static checkApiModel: CheckApiModel;
  public static deleteApiConnection: DeleteApiConnection;
  public static getApiConnection: GetApiConnection;
  public static listApiConnection: ListApiConnection;
  public static listApiModel: ListApiModel;
  public static saveApiConnection: SaveApiConnection;
  public static updateApiConnection: UpdateApiConnection;

  private constructor() {}

  public static init() {
    this.apiConnectionRepo = new DrizzleApiConnectionRepo();

    this.checkApiKey = new CheckApiKey(httpClient);
    this.checkApiModel = new CheckApiModel(httpClient, this.apiConnectionRepo);
    this.deleteApiConnection = new DeleteApiConnection(this.apiConnectionRepo);
    this.getApiConnection = new GetApiConnection(this.apiConnectionRepo);
    this.listApiConnection = new ListApiConnection(this.apiConnectionRepo);
    this.listApiModel = new ListApiModel(httpClient, this.apiConnectionRepo);
    this.saveApiConnection = new SaveApiConnection(this.apiConnectionRepo);
    this.updateApiConnection = new UpdateApiConnection(
      this.apiConnectionRepo,
      this.apiConnectionRepo,
    );
  }
}
