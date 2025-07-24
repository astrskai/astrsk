import { useQuery } from "@tanstack/react-query";

import { cardQueries } from "@/app/queries/card-queries";
import { CardType } from "@/modules/card/domain";
import { SearchCardsSort } from "@/modules/card/repos";

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
