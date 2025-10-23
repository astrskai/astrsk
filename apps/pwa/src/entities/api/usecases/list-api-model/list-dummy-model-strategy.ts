import { Result } from "@/shared/core/result";

import { ApiConnection, ApiModel } from "@/entities/api/domain";
import { ListApiModelStrategy } from "@/entities/api/usecases/list-api-model/list-api-model-strategy";

export class ListDummyModelStrategy implements ListApiModelStrategy {
  constructor() {}

  async listApiModel(
    apiConnection: ApiConnection,
  ): Promise<Result<ApiModel[]>> {
    // Return a list of dummy models
    return Result.ok([
      ApiModel.create({
        id: "Dummy Model",
        name: "Dummy Model",
      }).getValue(),
    ]);
  }
}
