import { Result, UseCase } from "@/shared/core";
import { DrizzleFlowRepo } from "@/entities/flow/repos/impl/drizzle-flow-repo";
import { DataStoreSchema } from "@/entities/flow/domain/flow";

interface UpdateDataStoreSchemaRequest {
  flowId: string;
  schema: DataStoreSchema;
}

export class UpdateDataStoreSchema implements UseCase<UpdateDataStoreSchemaRequest, Result<void>> {
  private repo = new DrizzleFlowRepo();

  async execute({ flowId, schema }: UpdateDataStoreSchemaRequest): Promise<Result<void>> {
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