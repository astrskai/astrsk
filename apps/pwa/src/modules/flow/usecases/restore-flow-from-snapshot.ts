import { Result, UseCase } from "@/shared/core";
import { formatFail } from "@/shared/lib";

import { Flow } from "@/modules/flow/domain";
import { SaveFlowRepo } from "@/modules/flow/repos/save-flow-repo";
import { FlowDrizzleMapper } from "@/modules/flow/mappers/flow-drizzle-mapper";
import { SelectFlow } from "@/db/schema/flows";

export class RestoreFlowFromSnapshot implements UseCase<SelectFlow, Result<Flow>> {
  constructor(private saveFlowRepo: SaveFlowRepo) {}

  async execute(flowDbFormat: SelectFlow): Promise<Result<Flow>> {
    try {
      // Use FlowDrizzleMapper to convert database format to domain object
      // This handles all the complex object reconstruction properly
      const flow = FlowDrizzleMapper.toDomain(flowDbFormat);

      // Use the existing save functionality to restore the flow
      const restoredFlowResult = await this.saveFlowRepo.saveFlow(flow);
      return restoredFlowResult;
    } catch (error) {
      return formatFail("Failed to restore flow from snapshot", error);
    }
  }
}