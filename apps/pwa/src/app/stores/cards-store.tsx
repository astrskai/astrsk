import { UseFormGetValues, UseFormTrigger } from "react-hook-form";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

import { createSelectors } from "@/shared/utils/zustand-utils";

import { CardFormValues } from "@/features/card/types/card-form";
import { Card, CardType } from "@/modules/card/domain";
import { SearchCardsSort } from "@/modules/card/repos";

interface CardsState {
  // Card List
  sort: SearchCardsSort;
  setSort: (sort: SearchCardsSort) => void;
  type: CardType[];
  setType: (type: CardType[]) => void;
  keyword: string;
  setKeyword: (keyword: string) => void;

  // Card List
  sortsByType: Record<CardType, SearchCardsSort>;
  setSortByType: (type: CardType, sort: SearchCardsSort) => void;
  keywordsByType: Record<CardType, string>;
  setKeywordByType: (type: CardType, keyword: string) => void;

  // Edit Card
  isOpenEditCardDialog: boolean;
  setIsOpenEditCardDialog: (isOpen: boolean) => void;
  selectedCard: Card | null;
  selectCard: (card: Card | null) => void;
  getFormValues: UseFormGetValues<CardFormValues> | null;
  setGetFormValues: (
    getValues: UseFormGetValues<CardFormValues> | null,
  ) => void;
  isFormDirty: boolean;
  setIsFormDirty: (isDirty: boolean) => void;
  onSave: (() => Promise<boolean>) | null;
  setOnSave: (onSave: (() => Promise<boolean>) | null) => void;
  tokenCount: number;
  setTokenCount: (tokenCount: number) => void;
  trigger: UseFormTrigger<CardFormValues> | null;
  setTrigger: (trigger: UseFormTrigger<CardFormValues> | null) => void;
  invalidItemIds: string[];
  setInvalidItemIds: (invalidItemIds: string[]) => void;
  tryedValidation: boolean;
  setTryedValidation: (tryedValidation: boolean) => void;
}

const useCardsStoreBase = create<CardsState>()(
  immer((set) => ({
    sort: SearchCardsSort.Latest,
    setSort: (sort) =>
      set((state) => {
        state.sort = sort;
      }),
    type: [],
    setType: (type) =>
      set((state) => {
        state.type = type;
      }),
    keyword: "",
    setKeyword: (keyword) =>
      set((state) => {
        state.keyword = keyword;
      }),
    sortsByType: {} as Record<CardType, SearchCardsSort>,
    setSortByType: (type, sort) =>
      set((state) => {
        state.sortsByType[type] = sort;
      }),
    keywordsByType: {} as Record<CardType, string>,
    setKeywordByType: (type, keyword) =>
      set((state) => {
        state.keywordsByType[type] = keyword;
      }),

    isOpenEditCardDialog: false,
    setIsOpenEditCardDialog: (isOpen) =>
      set((state) => {
        state.isOpenEditCardDialog = isOpen;
      }),
    selectedCard: null,
    selectCard: (card) =>
      set((state) => {
        state.selectedCard = card;
      }),
    getFormValues: null,
    setGetFormValues: (getValues) =>
      set((state) => {
        state.getFormValues = getValues;
      }),
    isFormDirty: false,
    setIsFormDirty: (isDirty) =>
      set((state) => {
        state.isFormDirty = isDirty;
      }),
    onSave: null,
    setOnSave: (onSave) =>
      set((state) => {
        state.onSave = onSave;
      }),
    tokenCount: 0,
    setTokenCount: (tokenCount) =>
      set((state) => {
        state.tokenCount = tokenCount;
      }),
    trigger: null,
    setTrigger: (trigger) =>
      set((state) => {
        state.trigger = trigger;
      }),
    invalidItemIds: [],
    setInvalidItemIds: (invalidItemIds) =>
      set((state) => {
        state.invalidItemIds = invalidItemIds;
      }),
    tryedValidation: false,
    setTryedValidation: (tryedValidation) =>
      set((state) => {
        state.tryedValidation = tryedValidation;
      }),
  })),
);

export const useCardsStore = createSelectors(useCardsStoreBase);
