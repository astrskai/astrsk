import { Changes, Result, UseCase, WithChanges } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/utils";

import { ApiConnection, ApiSource } from "@/modules/api/domain";
import {
  LoadApiConnectionRepo,
  SaveApiConnectionRepo,
} from "@/modules/api/repos";

export interface UpdateApiConnectionDto {
  id: UniqueEntityID;
  title?: string;
  source?: ApiSource;
  baseUrl?: string;
  apiKey?: string;
  modelUrls?: string[];
}

export class UpdateApiConnection
  implements UseCase<UpdateApiConnectionDto, Result<void>>, WithChanges
{
  public changes: Changes;

  constructor(
    private loadApiConnectionRepo: LoadApiConnectionRepo,
    private saveApiConnectionRepo: SaveApiConnectionRepo,
  ) {
    this.changes = new Changes();
  }

  async execute(request: UpdateApiConnectionDto): Promise<Result<void>> {
    // Get api connection
    let apiConnection: ApiConnection;
    try {
      apiConnection = (
        await this.loadApiConnectionRepo.getApiConnectionById(request.id)
      ).getValue();
    } catch (error) {
      return formatFail("Failed to load ApiConnection", error);
    }

    // Update api connection fields
    if (request.title) {
      this.changes.addChange(apiConnection.setTitle(request.title));
    }
    if (request.source) {
      this.changes.addChange(apiConnection.setSource(request.source));
    }
    if (request.baseUrl) {
      this.changes.addChange(apiConnection.setBaseUrl(request.baseUrl));
    }
    if (request.apiKey) {
      this.changes.addChange(apiConnection.setApiKey(request.apiKey));
    }
    if (request.modelUrls) {
      this.changes.addChange(apiConnection.setModelUrls(request.modelUrls));
    }

    // Save api connection
    if (this.changes.getCombinedChangesResult().isSuccess) {
      try {
        await this.saveApiConnectionRepo.saveApiConnection(apiConnection);
      } catch (error) {
        return formatFail("Failed to save ApiConnection", error);
      }
    }

    return Result.ok();
  }
}
