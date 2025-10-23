import { UseCase } from "@/shared/core";
import { Result } from "@/shared/core";
import { ReadyState } from "@/entities/flow/domain/flow";

type UpdateFlowValidationRequest = {
  flowId: string;
  readyState: ReadyState;
  validationIssues: any[]; // ValidationIssue type from flow domain
};

export class UpdateFlowValidation implements UseCase<UpdateFlowValidationRequest, Promise<Result<void>>> {
  constructor(private flowRepo: any) {}

  async execute(request: UpdateFlowValidationRequest): Promise<Result<void>> {
    const { flowId, readyState, validationIssues } = request;

    // Use targeted update to only update validation-related fields
    // This avoids race conditions where other fields might be overwritten
    const updateResult = await this.flowRepo.updateFlowValidation(flowId, readyState, validationIssues);
    
    if (updateResult.isFailure) {
      return Result.fail<void>(updateResult.getError());
    }

    return Result.ok<void>();
  }
}