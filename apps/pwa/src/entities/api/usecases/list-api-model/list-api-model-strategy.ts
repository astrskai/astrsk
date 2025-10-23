import { Result } from "@/shared/core/result";

import { ApiConnection, ApiModel } from "@/entities/api/domain";

export interface ListApiModelStrategy {
  listApiModel(apiConnection: ApiConnection): Promise<Result<ApiModel[]>>;
}
