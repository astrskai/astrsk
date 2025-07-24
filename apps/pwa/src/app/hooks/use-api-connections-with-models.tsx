import { useQuery } from "@tanstack/react-query";

import { apiConnectionQueries } from "@/app/queries/api-connection-queries";
import { ApiConnection } from "@/modules/api/domain";
import { ApiModel } from "@/modules/api/domain/api-model";

export interface ApiConnectionWithModels {
  apiConnection: ApiConnection;
  models: ApiModel[];
}

export const useApiConnectionsWithModels = () => {
  const { data } = useQuery(apiConnectionQueries.listWithModels());

  // TODO: remove invalidate
  const invalidate = () => {};

  return [data, invalidate] as const;
};
