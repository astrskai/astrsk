import { Result, UseCase } from "@/shared/core";
import { formatFail } from "@/shared/lib";

import { IfNode } from "@/modules/if-node/domain";
import { SaveIfNodeRepo } from "@/modules/if-node/repos/save-if-node-repo";
import { IfNodeDrizzleMapper } from "@/modules/if-node/mappers/if-node-drizzle-mapper";
import { SelectIfNode } from "@/db/schema/if-nodes";

export class RestoreIfNodeFromSnapshot implements UseCase<SelectIfNode, Result<IfNode>> {
  constructor(private saveIfNodeRepo: SaveIfNodeRepo) {}

  async execute(ifNodeDbFormat: SelectIfNode): Promise<Result<IfNode>> {
    try {
      // Use IfNodeDrizzleMapper to convert database format to domain object
      // This handles all the complex object reconstruction properly
      const ifNode = IfNodeDrizzleMapper.toDomain(ifNodeDbFormat);

      // Use the existing save functionality to restore the if-node
      const restoredIfNodeResult = await this.saveIfNodeRepo.saveIfNode(ifNode);
      return restoredIfNodeResult;
    } catch (error) {
      return formatFail("Failed to restore if-node from snapshot", error);
    }
  }
}