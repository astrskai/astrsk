import { useQuery } from "@tanstack/react-query";

import { apiConnectionQueries } from "@/app/queries/api-connection-queries";
import { queryClient } from "@/app/queries/query-client";
import { ApiConnection } from "@/modules/api/domain";
import { ApiModel } from "@/modules/api/domain/api-model";

export interface ApiConnectionWithModels {
  apiConnection: ApiConnection;
  models: ApiModel[];
}

export const useApiConnectionsWithModels = () => {
  const { data } = useQuery(apiConnectionQueries.listWithModels());

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: apiConnectionQueries.withModels(),
    });
  };

  return [data, invalidate] as const;
};
