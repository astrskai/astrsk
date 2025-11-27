"use client";

import { useQueryClient } from "@tanstack/react-query";
import { isUndefined, omitBy } from "lodash-es";
import { ChevronLeft, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { UseFormGetValues, UseFormTrigger } from "react-hook-form";
import { toastError, toastSuccess } from "@/shared/ui/toast";

import { cn } from "@/shared/lib";
import { downloadFile, logger } from "@/shared/lib";

import { CardService } from "@/app/services";
import { AssetService } from "@/app/services/asset-service";
import { SessionService } from "@/app/services/session-service";
import { Page, useAppStore } from "@/shared/stores/app-store";
import { useCardUIStore } from "@/entities/card/stores/card-ui-store";
import { useCardsStore } from "@/shared/stores/cards-store";
import { useEditSessionDialogStore } from "@/shared/stores/edit-session-dialog-store";
import { CharacterForm } from "@/features/card/ui/edit-sheet/character-form-v2";
import { PlotForm } from "@/features/card/ui/edit-sheet/plot-form-v2";
import { CardFormValues } from "@/features/card/types/card-form";

import { TopNavigation } from "@/widgets/top-navigation";
import {
  DeleteConfirm,
  UnsavedChangesConfirm,
  Button,
  ScrollArea,
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetFooter,
} from "@/shared/ui";
import { TableName } from "@/db/schema/table-name";
import {
  Card,
  CardType,
  CharacterCard,
  Lorebook,
  PlotCard,
} from "@/entities/card/domain";
import { Session } from "@/entities/session/domain/session";
import { useIsMobile } from "@/shared/hooks/use-mobile";

export const ActiveTabType = {
  BasicInfo: "basic-info",
  AdditionalInfo: "additional-info",
} as const;

export type ActiveTabType = (typeof ActiveTabType)[keyof typeof ActiveTabType];

export interface CardStore {
  // States
  isOpenEditCardDialog: () => boolean;
  selectedCard: () => Card | null;
  getFormValues: () => UseFormGetValues<CardFormValues> | null;
  isFormDirty: () => boolean;
  onSave: () => (() => Promise<boolean>) | null;
  tokenCount: () => number;
  trigger: () => UseFormTrigger<CardFormValues> | null;
  invalidItemIds: () => string[];

  // Actions
  setIsOpenEditCardDialog: () => (isOpen: boolean) => void;
  selectCard: () => (card: Card | null) => void;
  setGetFormValues: () => (
    getValues: UseFormGetValues<CardFormValues> | null,
  ) => void;
  setIsFormDirty: () => (isDirty: boolean) => void;
  setOnSave: () => (onSave: (() => Promise<boolean>) | null) => void;
  setTokenCount: () => (tokenCount: number) => void;
  setTrigger: () => (trigger: UseFormTrigger<CardFormValues> | null) => void;
  setInvalidItemIds: () => (invalidItemIds: string[]) => void;
  tryedValidation: () => boolean;
  setTryedValidation: () => (tryedValidation: boolean) => void;
}

interface CardFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardType: CardType;
  selectedCard: Card | null;
  source?: "library" | "session";
}

const CardFormSheet: React.FC<CardFormSheetProps> = ({
  open,
  onOpenChange,
  cardType,
  selectedCard,
  source = "library",
}) => {
  // State for confirmation dialog
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);

  const isMobile = useIsMobile();
  const { setActivePage } = useAppStore();
  const { cardEditOpen, setCardEditOpen } = useCardUIStore();
  // Use the appropriate store based on source
  const store = (
    source === "library" ? useCardsStore.use : useEditSessionDialogStore.use
  ) as CardStore;

  const cardService = CardService;
  const [isLoading, setIsLoading] = useState(false);

  // Access store values through selector functions
  const tokenCount = store.tokenCount();
  const selectCard = store.selectCard();
  const getFormValues = store.getFormValues();
  const trigger = store.trigger();
  const setInvalidItemIds = store.setInvalidItemIds();
  const isFormDirty = store.isFormDirty();
  const setIsFormDirty = store.setIsFormDirty();
  const tryedValidation = store.tryedValidation();
  const setTryedValidation = store.setTryedValidation();
  const isNewCard = selectedCard?.props.title.trim().length === 0;

  const [activeTab, setActiveTab] = useState<ActiveTabType>(
    ActiveTabType.BasicInfo,
  );
  // Set basic info tab as default on first open
  useEffect(() => {
    if (open) {
      setActiveTab(ActiveTabType.BasicInfo);
    }
  }, [open]);

  const queryClient = useQueryClient();
  const invalidateCards = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: [TableName.Cards],
    });
  }, [queryClient]);

  const onSave = useCallback(async () => {
    setTryedValidation(true);
    // Validate form
    if (!trigger) {
      setActiveTab(ActiveTabType.BasicInfo);
      console.log("No trigger function available");
      return false;
    }
    const isValid = await trigger(undefined, { shouldFocus: true });
    if (!isValid) {
      setActiveTab(ActiveTabType.BasicInfo);
      console.log("Form validation failed");
      return false;
    }

    // Get form values
    if (!getFormValues) {
      console.log("No getFormValues function available");
      return false;
    }
    const formValues = getFormValues();

    // Check selected card
    if (!selectedCard) {
      console.log("No card selected");
      return false;
    }

    // Validate entries or roles
    if (selectedCard.props.type === CardType.Character) {
      // Validate entries props
      const invalidEntries = formValues.entries?.filter((entry) => {
        return (
          entry.name.length === 0 ||
          isNaN(entry.recallRange) ||
          entry.recallRange < 0 ||
          entry.keys.length === 0 ||
          (entry.keys.length === 1 && entry.keys[0].trim().length === 0) ||
          entry.content.length === 0
        );
      });
      if (invalidEntries && invalidEntries.length > 0) {
        document.getElementById(invalidEntries[0].id.toString())?.focus();
        setInvalidItemIds(invalidEntries.map((entry) => entry.id.toString()));
        return false;
      }
    } else if (selectedCard.props.type === CardType.Plot) {
      // Validate entries props
      const invalidEntries = formValues.entries?.filter((entry) => {
        return (
          entry.name.length === 0 ||
          isNaN(entry.recallRange) ||
          entry.recallRange < 0 ||
          entry.keys.length === 0 ||
          (entry.keys.length === 1 && entry.keys[0].trim().length === 0) ||
          entry.content.length === 0
        );
      });
      if (invalidEntries && invalidEntries.length > 0) {
        document.getElementById(invalidEntries[0].id.toString())?.focus();
        setInvalidItemIds(invalidEntries.map((entry) => entry.id.toString()));
        return false;
      }
    }

    // Save new icon to assets
    if (formValues.newIcon && formValues.newIcon.length > 0) {
      const newIconFile = formValues.newIcon[0];
      const assetOrError = await AssetService.saveFileToAsset.execute({
        file: newIconFile,
      });
      if (assetOrError.isFailure) {
        console.log("Failed to save icon:", assetOrError.getError());
        logger.error(assetOrError.getError());
        return false;
      }
      formValues.iconAssetId = assetOrError.getValue().id.toString();
    }
    // Update selected card
    const updateResult = selectedCard.update(
      omitBy(
        {
          ...formValues,
          scenarios: formValues.scenarios,
          lorebook: formValues.entries
            ? Lorebook.create({ entries: formValues.entries }).isSuccess
              ? Lorebook.create({ entries: formValues.entries }).getValue()
              : undefined
            : undefined,
        },
        isUndefined,
      ),
    );
    if (updateResult.isFailure) {
      logger.error(updateResult.getError());
      return false;
    }

    // Save updated card
    const savedCardOrError = await cardService.saveCard.execute(selectedCard);
    if (savedCardOrError.isFailure) {
      logger.error(savedCardOrError.getError());
      return false;
    }

    // Refresh card list
    invalidateCards();

    if (open) {
      onOpenChange(false);
    }

    // Toast
    toastSuccess("Saved!");

    return true;
  }, [
    cardService.saveCard,
    getFormValues,
    invalidateCards,
    selectCard,
    selectedCard,
    setInvalidItemIds,
    setIsFormDirty,
    setTryedValidation,
    onOpenChange,
    source,
    tokenCount,
    trigger,
    isNewCard,
    open,
  ]);

  const onClone = useCallback(async () => {
    // Clone selected card
    if (!selectedCard) {
      return;
    }
    const cloneResult = await cardService.cloneCard.execute({
      cardId: selectedCard.id,
    });
    if (cloneResult.isFailure) {
      logger.error(cloneResult.getError());
      return;
    }

    // Refresh card list
    invalidateCards();

    if (open) {
      onOpenChange(false);
    }
  }, [
    cardService.cloneCard,
    invalidateCards,
    selectedCard,
    open,
    onOpenChange,
  ]);

  const onExport = useCallback(
    async (type: "png" | "json") => {
      if (!selectedCard) {
        return;
      }

      const fileOrError = await cardService.exportCardToFile.execute({
        cardId: selectedCard.id,
        options: { format: type },
      });

      if (fileOrError.isFailure) {
        logger.error(fileOrError.getError());
        toastError("Failed to export card", {
          description: fileOrError.getError(),
        });
        return;
      }

      const file = fileOrError.getValue();
      downloadFile(file);
    },
    [cardService.exportCardToFile, selectedCard],
  );

  // Delete confirm
  const [isOpenDeleteConfirm, setIsOpenDeleteConfirm] = useState(false);
  const [usedSessions, setUsedSessions] = useState<Session[]>([]);
  const getUsedSessions = useCallback(async () => {
    if (!selectedCard) {
      return;
    }
    const sessionsOrError = await SessionService.listSessionByCard.execute({
      cardId: selectedCard.id,
    });
    if (sessionsOrError.isFailure) {
      return;
    }
    setUsedSessions(sessionsOrError.getValue());
  }, [selectedCard]);

  const onDelete = useCallback(async () => {
    // Check selected card
    if (!selectedCard) {
      return;
    }

    // Delete selected card
    const deleteResult = await cardService.deleteCard.execute(selectedCard.id);
    if (deleteResult.isFailure) {
      logger.error(deleteResult.getError());
      return;
    }

    // Refresh card list
    invalidateCards();

    // Invalidate used sessions validation
    for (const usedSession of usedSessions) {
      queryClient.invalidateQueries({
        queryKey: [TableName.Sessions, usedSession.id.toString(), "validation"],
      });
    }

    if (open) {
      onOpenChange(false);
    }
  }, [
    selectedCard,
    source,
    cardService.deleteCard,
    invalidateCards,
    open,
    tokenCount,
    usedSessions,
    queryClient,
    onOpenChange,
  ]);

  // Custom handler for sheet close
  const handleSheetOpenChange = (newOpenState: boolean) => {
    // If trying to close and form is dirty, show confirmation instead
    if (!newOpenState && isFormDirty) {
      setShowCloseConfirmation(true);
      return;
    }
    if (cardEditOpen) {
      console.log("Tracking card edit close");

      setActivePage(Page.Sessions);
      setCardEditOpen(null);
    }
    // Otherwise, pass through to parent handler
    onOpenChange(newOpenState);
  };

  // Handle Android back gesture
  const handleBackGesture = () => {
    if (isFormDirty) {
      setShowCloseConfirmation(true);
    } else {
      handleSheetOpenChange(false);
    }
  };

  // useBackGesture({ enabled: isMobile && open, onBack: handleBackGesture });

  // Handler for discarding changes
  const handleDiscardChanges = () => {
    setShowCloseConfirmation(false);
    // Reset form dirty state to prevent recursive dialog trigger
    setIsFormDirty(false);
    // Close the sheet
    onOpenChange(false);
    // setCardEditOpen(null);
    if (cardEditOpen) {
      console.log("Tracking card edit close");
      setActivePage(Page.Sessions);
      setCardEditOpen(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          "bg-background-card border-secondary flex h-full w-full flex-col border-l p-0 sm:max-w-xl md:max-w-3xl",
          isMobile ? "bg-background-surface-2" : "pt-4",
        )}
        hideClose
      >
        {/* Mobile Top Bar */}
        {isMobile && (
          <TopNavigation
            title={`${isNewCard ? "Create" : "Edit"} ${cardType === CardType.Character ? "Character" : "Plot"}`}
            leftAction={
              <Button
                variant="ghost_white"
                size="icon"
                className="h-[40px] w-[40px] p-[8px]"
                onClick={() => {
                  if (isFormDirty) {
                    setShowCloseConfirmation(true);
                  } else {
                    handleSheetOpenChange(false);
                  }
                }}
              >
                <ChevronLeft className="min-h-6 min-w-6" />
              </Button>
            }
            rightAction={
              <Button
                size="lg"
                onClick={() => {
                  setIsLoading(true);
                  try {
                    onSave()
                      .then((success) => {
                        setIsLoading(false);
                      })
                      .catch((err) => {
                        setIsLoading(false);
                        toastError("Failed to save card", {
                          description: err.message,
                        });
                      });
                    if (cardEditOpen) {
                      setActivePage(Page.Sessions);
                      setCardEditOpen(null);
                    }
                  } catch (error) {
                    setIsLoading(false);
                    toastError("Failed to save card", {
                      description: (error as Error).message,
                    });
                    if (cardEditOpen) {
                      setActivePage(Page.Sessions);
                      setCardEditOpen(null);
                    }
                  }
                }}
                disabled={isLoading || !isFormDirty}
                variant="ghost"
                className="h-[40px]"
              >
                {isNewCard ? "Create" : "Save"} {isLoading ? "..." : ""}
              </Button>
            }
          />
        )}

        <ScrollArea className="h-full min-h-0 grow">
          <SheetBody className="text-foreground dark:text-foreground px-5">
            {selectedCard && cardType === CardType.Character && (
              <CharacterForm
                store={store}
                card={selectedCard as CharacterCard}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                setIsFormDirty={setIsFormDirty}
                tryedValidation={tryedValidation}
                isNewCard={isNewCard}
                isMobile={isMobile}
              />
            )}
            {selectedCard && cardType === CardType.Plot && (
              <PlotForm
                store={store}
                card={selectedCard as PlotCard}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                setIsFormDirty={setIsFormDirty}
                tryedValidation={tryedValidation}
                isNewCard={isNewCard}
                isMobile={isMobile}
              />
            )}
          </SheetBody>
        </ScrollArea>

        {/* Desktop Footer */}
        {!isMobile && (
          <SheetFooter
            variant="edit"
            className="border-border-container bg-background-container flex w-full justify-between border-t pt-4"
          >
            <div className="flex w-full justify-between">
              <SheetClose asChild>
                <Button variant="ghost" size="sm">
                  Cancel
                </Button>
              </SheetClose>

              <div className="flex items-center gap-2">
                {!isNewCard && (
                  <div>
                    <DeleteConfirm
                      open={isOpenDeleteConfirm}
                      onOpenChange={async (open) => {
                        if (open) {
                          await getUsedSessions();
                        }
                        setIsOpenDeleteConfirm(open);
                      }}
                      description={
                        <>
                          This card is used in{" "}
                          <span className="text-secondary-normal">
                            {usedSessions.length} sessions
                          </span>
                          .
                          <br />
                          Deleting it might corrupt or disable these sessions.
                        </>
                      }
                      onDelete={() => {
                        onDelete();
                        onOpenChange(false);
                      }}
                    >
                      <Button variant="ghost" size="sm">
                        Delete
                      </Button>
                    </DeleteConfirm>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={onClone}
                    >
                      Copy
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onExport("png")}
                    >
                      Export
                    </Button>
                  </div>
                )}

                <Button
                  type="button"
                  onClick={() => {
                    setIsLoading(true);
                    try {
                      onSave()
                        .then((success) => {
                          setIsLoading(false);
                        })
                        .catch((err) => {
                          setIsLoading(false);
                          toastError("Failed to save card", {
                            description: err.message,
                          });
                        });
                      if (cardEditOpen) {
                        setActivePage(Page.Sessions);
                        setCardEditOpen(null);
                      }
                    } catch (error) {
                      setIsLoading(false);
                      toastError("Failed to save card", {
                        description: (error as Error).message,
                      });
                      if (cardEditOpen) {
                        setActivePage(Page.Sessions);
                        setCardEditOpen(null);
                      }
                    }
                  }}
                  disabled={isLoading || !isFormDirty}
                  size="sm"
                >
                  <Save className="mr-1 h-4 w-4" />
                  {isNewCard ? "Create" : "Save"} {isLoading ? "..." : ""}
                </Button>
              </div>
            </div>
          </SheetFooter>
        )}
      </SheetContent>

      {/* Unsaved Changes Confirmation Dialog */}
      <UnsavedChangesConfirm
        open={showCloseConfirmation}
        onOpenChange={setShowCloseConfirmation}
        onCloseWithoutSaving={handleDiscardChanges}
      />
    </Sheet>
  );
};

export default CardFormSheet;
