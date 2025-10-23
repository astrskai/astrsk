import { Result, UseCase } from "@/shared/core";
import { DrizzleFlowRepo } from "@/entities/flow/repos/impl/drizzle-flow-repo";

interface UpdateResponseTemplateRequest {
  flowId: string;
  responseTemplate: string;
}

export class UpdateResponseTemplate implements UseCase<UpdateResponseTemplateRequest, Result<void>> {
  private repo = new DrizzleFlowRepo();

  async execute({ flowId, responseTemplate }: UpdateResponseTemplateRequest): Promise<Result<void>> {
    try {
      return await this.repo.updateResponseTemplate(flowId, responseTemplate);
    } catch (error) {
      return Result.fail(
        `Failed to update response template: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}