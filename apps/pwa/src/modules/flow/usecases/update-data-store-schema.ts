import { Result, UseCase } from "@/shared/core";
import { DrizzleFlowRepo } from "@/modules/flow/repos/impl/drizzle-flow-repo";
import { DataStoreSchema } from "@/modules/flow/domain/flow";

interface UpdateDataStoreSchemaDTO {
  flowId: string;
  schema: DataStoreSchema;
}

export class UpdateDataStoreSchema implements UseCase<UpdateDataStoreSchemaDTO, Result<void>> {
  private repo = new DrizzleFlowRepo();

  async execute({ flowId, schema }: UpdateDataStoreSchemaDTO): Promise<Result<void>> {
    try {
      return await this.repo.updateDataStoreSchema(flowId, schema);
    } catch (error) {
      return Result.fail(
        `Failed to update data store schema: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}