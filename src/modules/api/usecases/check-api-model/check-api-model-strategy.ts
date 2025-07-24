import { Result } from "@/shared/core";

import { ApiConnection } from "@/modules/api/domain";
import { ModelStatus } from "@/modules/api/usecases";

export interface CheckApiModelStrategy {
  checkApiModel(
    apiConnection: ApiConnection,
    modelId: string,
  ): Promise<Result<ModelStatus>>;
}
