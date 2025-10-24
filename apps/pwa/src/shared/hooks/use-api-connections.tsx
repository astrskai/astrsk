import { useQuery } from "@tanstack/react-query";

import { apiConnectionQueries } from "@/app/queries/api-connection-queries";

export const useApiConnections = ({
  keyword = "",
  limit = 100,
}: {
  keyword?: string;
  limit?: number;
}) => {
  const { data } = useQuery(
    apiConnectionQueries.list({
      keyword,
      limit,
    }),
  );

  return [data] as const;
};
