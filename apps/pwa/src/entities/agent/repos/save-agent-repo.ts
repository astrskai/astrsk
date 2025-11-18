import { Result } from "@/shared/core";

import { Transaction } from "@/db/transaction";
import { Agent } from "@/entities/agent/domain";

export interface SaveAgentRepo {
  saveAgent(agent: Agent, tx?: Transaction): Promise<Result<Agent>>;
}
