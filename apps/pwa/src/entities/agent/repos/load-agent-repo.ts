import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";

import { Agent, ApiType } from "@/entities/agent/domain";

export type SearchAgentQuery = {
  // Pagination
  limit?: number;
  offset?: number;

  // Search
  keyword?: string;
  targetApiType?: ApiType;
  targetModel?: string;
};

export interface LoadAgentRepo {
  getAgentById(id: UniqueEntityID): Promise<Result<Agent>>;
  searchAgents(query: SearchAgentQuery): Promise<Result<Agent[]>>;
  canUseAgentName(name: string): Promise<Result<boolean>>;
}
