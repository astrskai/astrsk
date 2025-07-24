import { Result } from "@/shared/core/result";

import { Flow } from "@/modules/flow/domain/flow";

export interface SaveFlowRepo {
  saveFlow(flow: Flow): Promise<Result<Flow>>;
}
