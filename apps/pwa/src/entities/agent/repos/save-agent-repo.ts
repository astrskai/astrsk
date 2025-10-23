import { Result } from "@/shared/core";

import { Agent } from "@/entities/agent/domain";

export interface SaveAgentRepo {
  saveAgent(agent: Agent): Promise<Result<Agent>>;
}
