import { Result } from "@/shared/core";

import { Agent } from "@/modules/agent/domain";

export interface SaveAgentRepo {
  saveAgent(agent: Agent): Promise<Result<Agent>>;
}
