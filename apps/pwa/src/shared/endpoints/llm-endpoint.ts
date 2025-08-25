import { ApiModel } from "@/modules/api/domain";

export interface LlmEndpoint {
  // TODO: move logic to usecase
  getAvailableModelList(): Promise<ApiModel[]>;
}
