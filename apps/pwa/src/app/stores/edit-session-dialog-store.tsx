// TODO: remove this file

import { UseFormGetValues, UseFormTrigger } from "react-hook-form";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

import { Result } from "@/shared/core/result";
import { UniqueEntityID } from "@/shared/domain";
import { PromptAndModel } from "@/shared/task/domain/prompt-and-model";
import { createSelectors } from "@/shared/utils/zustand-utils";

import { CardFormValues } from "@/features/card/types/card-form";
import { Card, CardType } from "@/modules/card/domain/card";
import { CardListItem } from "@/modules/session/domain/session";

export enum EditSessionTab {
  PromptAndModel = "prompt-and-model",
  Cards = "cards",
}

interface EditSessionDialogState {
  // Open dialog
  isOpenEditSessionDialog: boolean;
  isOpenImportSessionDialog: boolean;

  // Active tab
  activeTab: EditSessionTab;

  // Selected session
  selectedSessionId: UniqueEntityID | null;

  // Validation
  isPromptsAndModelsValid: boolean;

  // Drag and drop
  draggingCard: Card | null;

  // Session title
  title: string;

  // Prompts and Models
  aiResponse: PromptAndModel | null;
  userResponse: PromptAndModel | null;

  // Cards
  allCardListItems: CardListItem[];

  // User character card
  userCharacterCardId: UniqueEntityID | null;

  // Edit Card
  isOpenEditCardDialog: boolean;
  selectedCard: Card | null;
  getFormValues: UseFormGetValues<CardFormValues> | null;
  isFormDirty: boolean;
  onSave: (() => Promise<boolean>) | null;
  tokenCount: number;
  trigger: UseFormTrigger<CardFormValues> | null;
  invalidItemIds: string[];

  // Source tracking
  isOpenedFromRightPanel: boolean;
}

interface EditSessionDialogActions {
  // Open dialog
  setIsOpenEditSessionDialog: (isOpen: boolean) => void;
  setIsOpenImportSessionDialog: (isOpen: boolean) => void;

  // Active tab
  setActiveTab: (tab: EditSessionTab) => void;

  // Selected session
  setSelectedSessionId: (sessionId: UniqueEntityID | null) => void;

  // Validation
  setIsPromptsAndModelsValid: (isValid: boolean) => void;

  // Drag and drop
  setDraggingCard: (card: Card | null) => void;

  // Session title
  setTitle: (title: string) => void;

  // Prompts and Models
  setAiResponse: (response: PromptAndModel | null) => void;
  setUserResponse: (response: PromptAndModel | null) => void;

  // Cards
  addCard: (cardListItem: CardListItem) => Result<void>;
  deleteCard: (cardId: UniqueEntityID) => void;
  setCardEnabled: (cardId: UniqueEntityID, enabled: boolean) => void;

  // User character card
  setUserCharacterCardId: (cardId: UniqueEntityID) => void;

  // Edit Card
  setIsOpenEditCardDialog: (isOpen: boolean) => void;
  selectCard: (card: Card | null) => void;
  setGetFormValues: (
    getValues: UseFormGetValues<CardFormValues> | null,
  ) => void;
  setIsFormDirty: (isDirty: boolean) => void;
  setOnSave: (onSave: (() => Promise<boolean>) | null) => void;
  setTokenCount: (tokenCount: number) => void;
  setTrigger: (trigger: UseFormTrigger<CardFormValues> | null) => void;
  setInvalidItemIds: (invalidItemIds: string[]) => void;

  // Source tracking
  setIsOpenedFromRightPanel: (isOpenedFromRightPanel: boolean) => void;

  // Reset store
  reset: () => void;
}

const initialState: EditSessionDialogState = {
  isOpenEditSessionDialog: false,
  isOpenImportSessionDialog: false,
  activeTab: EditSessionTab.PromptAndModel,
  selectedSessionId: null,
  isPromptsAndModelsValid: false,
  draggingCard: null,
  title: "New Session",
  aiResponse: null,
  userResponse: null,
  allCardListItems: [],
  userCharacterCardId: null,
  isOpenEditCardDialog: false,
  selectedCard: null,
  getFormValues: null,
  isFormDirty: false,
  onSave: null,
  tokenCount: 0,
  trigger: null,
  invalidItemIds: [],
  isOpenedFromRightPanel: false,
};

const useEditSessionDialogStoreBase = create<
  EditSessionDialogState & EditSessionDialogActions
>()(
  immer((set) => ({
    ...initialState,

    setIsOpenEditSessionDialog: (isOpen) =>
      set((state) => {
        state.isOpenEditSessionDialog = isOpen;
      }),
    setIsOpenImportSessionDialog: (isOpen) =>
      set((state) => {
        state.isOpenImportSessionDialog = isOpen;
      }),

    setActiveTab: (tab) =>
      set((state) => {
        state.activeTab = tab;
      }),

    setSelectedSessionId: (sessionId) =>
      set((state) => {
        state.selectedSessionId = sessionId;
      }),

    setIsPromptsAndModelsValid: (isValid) =>
      set((state) => {
        state.isPromptsAndModelsValid = isValid;
      }),

    setDraggingCard: (card) =>
      set((state) => {
        state.draggingCard = card;
      }),

    setTitle: (title) =>
      set((state) => {
        state.title = title;
      }),

    setAiResponse: (response) =>
      set((state) => {
        state.aiResponse = response;
      }),
    setUserResponse: (response) =>
      set((state) => {
        state.userResponse = response;
      }),

    addCard: (cardListItem) => {
      // Check if plot card already exists
      const plotCard = useEditSessionDialogStore
        .getState()
        .allCardListItems.find((c) => c.type === CardType.Plot);
      if (plotCard && cardListItem.type === CardType.Plot) {
        return Result.fail("Only one plot card can be added per session.");
      }

      // Add card
      set((state) => {
        state.allCardListItems.push(cardListItem);
      });
      return Result.ok();
    },
    deleteCard: (cardId) =>
      set((state) => {
        const cardListItem = state.allCardListItems.find((c) =>
          c.id.equals(cardId),
        );
        if (!cardListItem) {
          return;
        }
        state.allCardListItems = state.allCardListItems.filter(
          (c) => !c.id.equals(cardId),
        );
        switch (cardListItem.type) {
          case CardType.Character:
            if (state.userCharacterCardId?.equals(cardId)) {
              state.userCharacterCardId = null;
            }
            break;
        }
      }),
    setCardEnabled: (cardId, enabled) =>
      set((state) => {
        const cardListItem = state.allCardListItems.find((c) =>
          c.id.equals(cardId),
        );
        if (cardListItem) {
          cardListItem.enabled = enabled;
        }
      }),

    setUserCharacterCardId: (cardId) =>
      set((state) => {
        state.userCharacterCardId = cardId;
      }),

    setIsOpenEditCardDialog: (isOpen) =>
      set((state) => {
        state.isOpenEditCardDialog = isOpen;
      }),
    selectCard: (card) =>
      set((state) => {
        state.selectedCard = card;
      }),
    setGetFormValues: (getValues) =>
      set((state) => {
        state.getFormValues = getValues;
      }),
    setIsFormDirty: (isDirty) =>
      set((state) => {
        state.isFormDirty = isDirty;
      }),
    setOnSave: (onSave) =>
      set((state) => {
        state.onSave = onSave;
      }),
    setTokenCount: (tokenCount) =>
      set((state) => {
        state.tokenCount = tokenCount;
      }),
    setTrigger: (trigger) =>
      set((state) => {
        state.trigger = trigger;
      }),
    setInvalidItemIds: (invalidItemIds) =>
      set((state) => {
        state.invalidItemIds = invalidItemIds;
      }),

    setIsOpenedFromRightPanel: (isOpenedFromRightPanel) =>
      set((state) => {
        state.isOpenedFromRightPanel = isOpenedFromRightPanel;
      }),

    reset: () => {
      set(initialState);
    },
  })),
);

export const useEditSessionDialogStore = createSelectors(
  useEditSessionDialogStoreBase,
);

export const useCharacterCardListItems = () => {
  const allCardListItems = useEditSessionDialogStore.use.allCardListItems();
  return allCardListItems.filter((c) => c.type === CardType.Character);
};

export const usePlotCardListItem = () => {
  const allCardListItems = useEditSessionDialogStore.use.allCardListItems();
  return allCardListItems.find((c) => c.type === CardType.Plot) ?? null;
};
