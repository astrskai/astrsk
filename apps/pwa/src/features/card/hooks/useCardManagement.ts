import { useState, useCallback, useMemo } from "react";

import { useCards } from "@/app/hooks/use-cards";
import { useCardsStore } from "@/app/stores/cards-store";
import { Card, CardType, FilterCardType } from "@/entities/card/domain";
import { SearchCardsSort } from "@/entities/card/repos";

/**
 * Hook to manage card listing, filtering, and searching functionality
 * @returns Card management functions and state
 */
export const useCardManagement = () => {
  // Card List state from the store
  const sortsByType = useCardsStore.use.sortsByType();
  const setSortByType = useCardsStore.use.setSortByType();
  const keywordsByType = useCardsStore.use.keywordsByType();
  const setKeywordByType = useCardsStore.use.setKeywordByType();
  const type = useCardsStore.use.type();
  const setKeyword = useCardsStore.use.setKeyword();
  const [typeString, setTypeString] = useState<string>("all");

  // const [cards, invalidateCards] = useCards({
  //   limit: 100,
  //   sort: sortsByType[CardType.Character],
  //   type: [CardType.Character, CardType.Plot],
  //   keyword: keywordsByType[CardType.Character],
  // });

  // Derive character and plot cards from the cards array
  const [characterCards, invalidateCharacterCards] = useCards({
    limit: 100,
    sort: sortsByType[CardType.Character],
    type: [CardType.Character],
    keyword: keywordsByType[CardType.Character],
  });

  const [plotCards, invalidatePlotCards] = useCards({
    limit: 100,
    sort: sortsByType[CardType.Plot],
    type: [CardType.Plot],
    keyword: keywordsByType[CardType.Plot],
  });

  const handleInvalidation = () => {
    invalidateCharacterCards();
    invalidatePlotCards();
  };
  /**
   * Handle sort order changes
   */
  const handleSort = useCallback(
    (type: CardType, sortOrder: SearchCardsSort) => {
      setSortByType(type, sortOrder);
    },
    [setSortByType],
  );

  /**
   * Handle keyword/search changes
   */
  const handleSearchByType = useCallback(
    (type: CardType, searchText: string) => {
      setKeywordByType(type, searchText);
    },
    [setKeywordByType],
  );

  /**
   * Clear the search field
   */
  const clearSearch = useCallback(() => {
    setKeyword("");
  }, [setKeyword]);

  return {
    // State
    characterCards,
    plotCards,
    sortsByType,
    keywordsByType,
    type,
    typeString,

    // Actions
    handleInvalidation,
    invalidateCharacterCards,
    invalidatePlotCards,
    handleSort,
    handleSearchByType,
    clearSearch,
  };
};

export default useCardManagement;
