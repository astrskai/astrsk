import { Result } from "@/shared/core/result";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";

import { ApiSource } from "@/modules/api/domain";
import { Flow, TaskType } from "@/modules/flow/domain/flow";

export type SearchFlowQuery = {
  // Pagination
  limit?: number;
  offset?: number;

  // Search
  keyword?: string;
  taskType?: TaskType;
};

export interface LoadFlowRepo {
  getFlowById(id: UniqueEntityID): Promise<Result<Flow>>;
  searchFlow(query: SearchFlowQuery): Promise<Result<Flow[]>>;
  canUseFlowName(name: string): Promise<Result<boolean>>;
  listFlowByProvider(provider: ApiSource): Promise<Result<Flow[]>>;
}
