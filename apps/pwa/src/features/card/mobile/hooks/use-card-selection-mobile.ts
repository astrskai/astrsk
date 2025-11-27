import { useState, useCallback } from "react";
import { Card } from "@/entities/card/domain";
import { Session } from "@/entities/session/domain/session";
import { CardService } from "@/app/services/card-service";
import { SessionService } from "@/app/services/session-service";
import { toastError, toastSuccess } from "@/shared/ui/toast";

export type SelectionAction = "copy" | "export" | "delete";

export function useCardSelection() {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [selectionAction, setSelectionAction] =
    useState<SelectionAction>("copy");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [usedSessions, setUsedSessions] = useState<Session[]>([]);

  const toggleSelection = useCallback((cardId: string) => {
    setSelectedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback((cards: Card[]) => {
    setSelectedCards(new Set(cards.map((c) => c.id.toString())));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCards(new Set());
  }, []);

  const enterSelectionMode = useCallback((action: SelectionAction) => {
    setIsSelectionMode(true);
    setSelectionAction(action);
    setSelectedCards(new Set());
  }, []);

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedCards(new Set());
    setSelectionAction("copy");
  }, []);

  const getSelectedCardsData = useCallback(
    (characterCards: Card[] | undefined, plotCards: Card[] | undefined) => {
      const allCards = [...(characterCards || []), ...(plotCards || [])];
      return allCards.filter((card) => selectedCards.has(card.id.toString()));
    },
    [selectedCards],
  );

  const handleCopyCards = useCallback(
    async (selectedCardsData: Card[], onInvalidation: () => void) => {
      try {
        const results = await Promise.allSettled(
          selectedCardsData.map((card) =>
            CardService.cloneCard.execute({ cardId: card.id }),
          ),
        );

        const successCount = results.filter(
          (r) => r.status === "fulfilled",
        ).length;
        const failCount = results.filter((r) => r.status === "rejected").length;

        if (successCount > 0) {
          toastSuccess(
            `${successCount} card${successCount > 1 ? "s" : ""} copied successfully`,
          );
          onInvalidation();
        }

        if (failCount > 0) {
          toastError(
            `Failed to copy ${failCount} card${failCount > 1 ? "s" : ""}`,
          );
        }

        exitSelectionMode();
      } catch (error) {
        console.error("Error copying cards:", error);
        toastError("Failed to copy cards");
      }
    },
    [exitSelectionMode],
  );

  const handleExportCards = useCallback(
    async (selectedCardsData: Card[]) => {
      try {
        let successCount = 0;
        let failCount = 0;

        for (const card of selectedCardsData) {
          try {
            // Export each card individually using the proper export service
            const fileOrError = await CardService.exportCardToFile.execute({
              cardId: card.id,
              options: { format: "png" },
            });

            if (fileOrError.isFailure) {
              failCount++;
              continue;
            }

            const file = fileOrError.getValue();

            // Download the file
            const url = URL.createObjectURL(file);
            const a = document.createElement("a");
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            successCount++;
          } catch (error) {
            console.error(`Error exporting card ${card.id.toString()}:`, error);
            failCount++;
          }
        }

        if (successCount > 0) {
          toastSuccess(
            `${successCount} card${successCount > 1 ? "s" : ""} exported successfully`,
          );
        }

        if (failCount > 0) {
          toastError(
            `Failed to export ${failCount} card${failCount > 1 ? "s" : ""}`,
          );
        }

        exitSelectionMode();
      } catch (error) {
        console.error("Error exporting cards:", error);
        toastError("Failed to export cards");
      }
    },
    [exitSelectionMode],
  );

  const checkDeleteDependencies = useCallback(
    async (selectedCardsData: Card[]) => {
      try {
        const sessionsResult = await SessionService.listSession.execute({});
        if (sessionsResult.isFailure) {
          throw new Error(sessionsResult.getError());
        }
        const sessions = sessionsResult.getValue();

        const usedInSessions: Session[] = [];
        selectedCardsData.forEach((card) => {
          sessions.forEach((session) => {
            const isUsed = session.allCards.some((sessionCard) =>
              sessionCard.id.equals(card.id),
            );
            if (
              isUsed &&
              !usedInSessions.find((s) => s.id.equals(session.id))
            ) {
              usedInSessions.push(session);
            }
          });
        });

        setUsedSessions(usedInSessions);
        setIsDeleteConfirmOpen(true);
      } catch (error) {
        console.error("Error checking dependencies:", error);
        toastError("Failed to check card dependencies");
      }
    },
    [],
  );

  const handleDeleteCards = useCallback(
    async (selectedCardsData: Card[], onInvalidation: () => void) => {
      try {
        const results = await Promise.allSettled(
          selectedCardsData.map((card) =>
            CardService.deleteCard.execute(card.id),
          ),
        );

        const successCount = results.filter(
          (r) => r.status === "fulfilled",
        ).length;
        const failCount = results.filter((r) => r.status === "rejected").length;

        if (successCount > 0) {
          toastSuccess(
            `${successCount} card${successCount > 1 ? "s" : ""} deleted successfully`,
          );
          onInvalidation();
        }

        if (failCount > 0) {
          toastError(
            `Failed to delete ${failCount} card${failCount > 1 ? "s" : ""}`,
          );
        }

        setIsDeleteConfirmOpen(false);
        exitSelectionMode();
      } catch (error) {
        console.error("Error deleting cards:", error);
        toastError("Failed to delete cards");
      }
    },
    [exitSelectionMode],
  );

  return {
    // State
    isSelectionMode,
    selectedCards,
    selectionAction,
    isDeleteConfirmOpen,
    usedSessions,

    // Actions
    toggleSelection,
    selectAll,
    clearSelection,
    enterSelectionMode,
    exitSelectionMode,
    getSelectedCardsData,
    handleCopyCards,
    handleExportCards,
    checkDeleteDependencies,
    handleDeleteCards,
    setIsDeleteConfirmOpen,
  };
}
