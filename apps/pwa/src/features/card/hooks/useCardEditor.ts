import { useState, useCallback } from "react";

import { useCardsStore } from "@/shared/stores/cards-store";
import { Card, CardType, CharacterCard, PlotCard } from "@/entities/card/domain";

/**
 * Hook to manage card creation and editing
 * @returns Card editing functions and state
 */
export const useCardEditor = () => {
  // Edit Card state from the store
  const isOpenEditCardDialog = useCardsStore.use.isOpenEditCardDialog();
  const setIsOpenEditCardDialog = useCardsStore.use.setIsOpenEditCardDialog();
  const selectedCard = useCardsStore.use.selectedCard();
  const selectCard = useCardsStore.use.selectCard();
  const isFormDirty = useCardsStore.use.isFormDirty();
  const onSave = useCardsStore.use.onSave();
  const setTryedValidation = useCardsStore.use.setTryedValidation();

  // Local state for the confirm dialog
  const [isOpenCloseWithoutSaveConfirm, setIsOpenCloseWithoutSaveConfirm] =
    useState<boolean>(false);

  /**
   * Handle dialog open/close
   */
  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      if (isFormDirty) {
        setIsOpenCloseWithoutSaveConfirm(true);
        return;
      }
      setIsOpenEditCardDialog(false);
    },
    [isFormDirty, setIsOpenEditCardDialog],
  );

  /**
   * Create a new card and open the editor
   */
  const createCard = useCallback(
    (type: CardType) => {
      // Create new card
      let card: Card;
      switch (type) {
        case CardType.Character:
          card = CharacterCard.create({}).getValue();
          break;
        case CardType.Plot:
          card = PlotCard.create({}).getValue();
          break;
        default:
          throw new Error(`Unknown card type: ${type}`);
      }
      // Select new card
      selectCard(card);

      // Open edit card dialog
      setTryedValidation(false);
    },
    [selectCard, setTryedValidation],
  );

  /**
   * Handle confirmation dialog actions
   */
  const handleConfirmDialogActions = {
    cancel: () => setIsOpenCloseWithoutSaveConfirm(false),
    saveAndClose: async () => {
      if (!onSave) {
        return;
      }
      setIsOpenCloseWithoutSaveConfirm(false);
      if ((await onSave()) === false) {
        return;
      }
      setIsOpenEditCardDialog(false);
    },
    closeWithoutSaving: () => {
      setIsOpenCloseWithoutSaveConfirm(false);
      setIsOpenEditCardDialog(false);
    },
  };

  /**
   * Handle opening a card for editing
   */
  const openCardForEdit = useCallback(
    (card: Card) => {
      selectCard(card);
      setTryedValidation(false);
    },
    [selectCard, setTryedValidation],
  );

  return {
    // State
    isOpenEditCardDialog,
    selectedCard,
    isOpenCloseWithoutSaveConfirm,

    // Actions
    createCard,
    openCardForEdit,
    handleDialogOpenChange,
    handleConfirmDialogActions,
  };
};

export default useCardEditor;
