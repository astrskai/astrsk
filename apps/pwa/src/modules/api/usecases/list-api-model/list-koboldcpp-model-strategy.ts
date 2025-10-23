import { Result } from "@/shared/core/result";
import { KoboldCPPEndpoint } from "@/shared/endpoints/koboldcpp";
import { HttpClient } from "@/shared/infra";
import { formatFail } from "@/shared/lib";

import { ApiConnection, ApiModel } from "@/modules/api/domain";
import { ListApiModelStrategy } from "@/modules/api/usecases/list-api-model/list-api-model-strategy";

export class ListKoboldModelStrategy implements ListApiModelStrategy {
  constructor(private httpClient: HttpClient) {}

  async listApiModel(
    apiConnection: ApiConnection,
  ): Promise<Result<ApiModel[]>> {
    try {
      const endpoint = new KoboldCPPEndpoint(
        this.httpClient,
        "",
        apiConnection.props.baseUrl,
      );

      let modelList = await endpoint.getAvailableModelList();
      if (modelList.length === 0) {
        // Add a default model if no models were found
        const defaultModel = ApiModel.create({
          id: "Default Model",
          name: "Default Model",
        }).getValue();
        modelList = [defaultModel];
      }

      // if (apiConnection.modelUrls) {
      //   modelList = [
      //     ...modelList,
      //     ...apiConnection.modelUrls.map((url) =>
      //       ApiModel.create({ id: url, name: url }).getValue()
      //     ),
      //   ];
      // }

      return Result.ok(modelList);
    } catch (error) {
      return formatFail("Failed to list Kobold model", error);
    }
  }
}
