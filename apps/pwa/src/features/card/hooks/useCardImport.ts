import { useCallback, useRef, useState } from "react";

import { CardService } from "@/app/services";
import { toastError, toastSuccess } from "@/shared/ui/toast";

/**
 * Hook to manage card import functionality
 * @param handleInvalidation Function to refresh the card list after import
 * @returns Card import functions and state
 */
export const useCardImport = (handleInvalidation: () => void) => {
  const refImportFileInput = useRef<HTMLInputElement>(null);
  const [isOpenImportCardPopup, setIsOpenImportCardPopup] =
    useState<boolean>(false);

  /**
   * Handle import button click
   */
  const onClickImportCard = useCallback(() => {
    refImportFileInput.current?.click();
  }, []);

  /**
   * Handle file import
   */
  const onImportCardFromFile = useCallback(
    async (file: File) => {
      // Import card from file
      const importResult = await CardService.importCardFromFile.execute(file);
      if (importResult.isFailure) {
        toastError("Failed to import card from file", {
          description: importResult.getError(),
        });
        return;
      }

      // Show toast
      toastSuccess("Card Imported!");

      // Refresh cards
      handleInvalidation();

      // Close popup
      setIsOpenImportCardPopup(false);
    },
    [handleInvalidation],
  );

  return {
    // State
    isOpenImportCardPopup,
    refImportFileInput,

    // Actions
    setIsOpenImportCardPopup,
    onClickImportCard,
    onImportCardFromFile,
  };
};

export default useCardImport;
