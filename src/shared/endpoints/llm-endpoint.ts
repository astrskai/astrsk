import { ApiModel } from "@/modules/api/domain";

export interface LlmEndpoint {
  // TODO: replace any to specific type or use generics
  makeRequest(props: any): Promise<any>;
  checkConnection(props: any): Promise<boolean>;
  getAvailableModelList(): Promise<ApiModel[]>;
}
