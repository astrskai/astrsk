import { httpClient } from "@/shared/infra";

import { DrizzleApiConnectionRepo } from "@/entities/api/repos/impl/drizzle-api-connection-repo";
import {
  DeleteApiConnection,
  GetApiConnection,
  ListApiConnection,
  ListApiModel,
  SaveApiConnection,
  UpdateApiConnection,
} from "@/entities/api/usecases";
import { CheckApiKey } from "@/entities/api/usecases/check-api-key";
// import { UpdateLocalSyncMetadata } from "@/entities/sync/usecases/update-local-sync-metadata";

export class ApiService {
  public static apiConnectionRepo: DrizzleApiConnectionRepo;

  public static checkApiKey: CheckApiKey;
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
