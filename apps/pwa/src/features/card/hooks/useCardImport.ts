import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { CardService } from "@/app/services";

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
        toast.error("Failed to import card from file", {
          description: importResult.getError(),
        });
        return;
      }

      // Show toast
      toast("Card Imported!");

      // Refresh cards
      handleInvalidation();

      // Close popup
      setIsOpenImportCardPopup(false);
    },
    [handleInvalidation, toast],
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
