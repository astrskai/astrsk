import { useQuery } from "@tanstack/react-query";

import { cardQueries } from "@/entities/card/api/card-queries";
import { CardType } from "@/entities/card/domain";
import { SearchCardsSort } from "@/entities/card/repos";

interface UseLibraryCardsParams {
  keyword?: string;
  limit?: number;
  sort?: (typeof SearchCardsSort)[keyof typeof SearchCardsSort];
  type?: CardType[];
}

export const useCards = ({
  keyword = "",
  limit = 100,
  sort = SearchCardsSort.Latest,
  type = [],
}: UseLibraryCardsParams = {}) => {
  const { data } = useQuery(
    cardQueries.list({
      keyword,
      limit,
      sort,
      type,
    }),
  );

  // TODO: remove invalidate
  const invalidate = () => {};

  return [data, invalidate] as const;
};
