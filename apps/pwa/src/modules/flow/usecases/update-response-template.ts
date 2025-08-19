import { Result, UseCase } from "@/shared/core";
import { DrizzleFlowRepo } from "@/modules/flow/repos/impl/drizzle-flow-repo";

interface UpdateResponseTemplateRequest {
  flowId: string;
  template: string;
}

export class UpdateResponseTemplate implements UseCase<UpdateResponseTemplateRequest, Result<void>> {
  private repo = new DrizzleFlowRepo();

  async execute({ flowId, template }: UpdateResponseTemplateRequest): Promise<Result<void>> {
    try {
      return await this.repo.updateResponseTemplate(flowId, template);
    } catch (error) {
      return Result.fail(
        `Failed to update response template: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}