"use client";

import { Import } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Page, useAppStore } from "@/app/stores/app-store";
import CardList from "@/components-v2/card/card-list";
import CardFormSheet from "@/components-v2/card/components/edit-sheet/card-form-sheet";
import {
  useCardEditor,
  useCardImport,
  useCardManagement,
} from "@/components-v2/card/hooks";
import { useResponsiveLayout } from "@/components-v2/card/hooks/useResponsiveLayout";
import { cn } from "@/components-v2/lib/utils";
import { TypoBase } from "@/components-v2/typo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components-v2/ui/dialog";
import { Card, CardType } from "@/modules/card/domain";
import * as amplitude from "@amplitude/analytics-browser";

export default function CardPage({ className }: { className?: string }) {
  // Sheet state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeCardType, setActiveCardType] = useState<CardType>(
    CardType.Character,
  );
  const [isLoading, setIsLoading] = useState(false);
  const { cardEditOpen, setSelectedCardId, setActivePage } = useAppStore();

  // Get responsive layout configuration from the custom hook
  const { characterWidth, plotWidth, isVertical } = useResponsiveLayout();

  // Local state for the actual widths (for debugging and to ensure reactivity)
  const [charWidth, setCharWidth] = useState(characterWidth);
  const [pltWidth, setPltWidth] = useState(plotWidth);
  const [vertical, setVertical] = useState(isVertical);

  // Update local state when the hook values change
  useEffect(() => {
    setCharWidth(characterWidth);
    setPltWidth(plotWidth);
    setVertical(isVertical);
  }, [characterWidth, plotWidth, isVertical]);

  // Ref for container
  const containerRef = useRef<HTMLDivElement>(null);

  // Use the card management hook for real card data
  const {
    characterCards,
    plotCards,
    sortsByType,
    keywordsByType,
    handleInvalidation,
    handleSort,
    handleSearchByType,
    clearSearch,
  } = useCardManagement();

  // Use the card editor hook for creating and editing cards
  const {
    selectedCard,
    isOpenCloseWithoutSaveConfirm,
    createCard,
    openCardForEdit,
    handleDialogOpenChange,
    handleConfirmDialogActions,
  } = useCardEditor();

  // Use the card import hook
  const {
    isOpenImportCardPopup,
    refImportFileInput,
    setIsOpenImportCardPopup,
    onClickImportCard,
    onImportCardFromFile,
  } = useCardImport(handleInvalidation);

  // Card creation functions
  const handleCreateCard = (type: CardType) => {
    if (type === CardType.Character) {
      console.log("Tracking new character card creation button pressed");
      amplitude.track("create_charactercard_initiate");
    } else if (type === CardType.Plot) {
      console.log("Tracking new plot card creation button pressed");
      amplitude.track("create_plotcard_initiate");
    }
    setActiveCardType(type);
    createCard(type);
    setIsSheetOpen(true);
  };

  // Handle opening a card for editing
  const handleEditCard = (id: string, type: CardType) => {
    setActiveCardType(type);
    // Find the card by ID
    let card: Card | undefined;
    if (type === CardType.Character) {
      card = characterCards?.find((c: Card) => c.id.toString() === id);
    } else if (type === CardType.Plot) {
      card = plotCards?.find((c: Card) => c.id.toString() === id);
    }

    if (card) {
      openCardForEdit(card);
      setIsSheetOpen(true);
    }
  };

  // Handle card click to navigate to CardPanel
  const handleCardClick = (id: string) => {
    console.log("Navigate to CardPanel for card:", id);
    setSelectedCardId(id);
    setActivePage(Page.CardPanel);
  };

  useEffect(() => {
    if (cardEditOpen === null) {
      return;
    }
    if (cardEditOpen === CardType.Plot) {
      handleCreateCard(CardType.Plot);
    } else if (cardEditOpen === CardType.Character) {
      handleCreateCard(CardType.Character);
    }
  }, [cardEditOpen]);

  return (
    <div className={cn(className)}>
      <div
        className="flex flex-col h-screen bg-background-screen relative overflow-hidden"
        // style={{
        //   backgroundImage: "url('/img/message-view-background.png')",
        //   backgroundSize: "cover",
        //   backgroundPosition: "center",
        //   backgroundRepeat: "no-repeat",
        // }}
      >
        <div
          ref={containerRef}
          className={cn(
            "relative flex justify-center gap-4 p-4 h-full",
            "flex-row",
            "pb-8",
            "z-10",
            "overflow-hidden",
          )}
        >
          <div
            // style={{ width: charWidth }}
            className="w-[50%] transition-all duration-300 overflow-hidden max-w-[1000px] min-w-[426px]"
          >
            <CardList
              title="Characters"
              cards={characterCards?.map((card: Card) => card.id.toValue()) || []}
              cardType={CardType.Character}
              maxColumns={4} // Character grids have 5 max columns
              onSearch={(query) => {
                handleSearchByType(CardType.Character, query);
              }}
              onSort={(sortOrder) => {
                handleSort(CardType.Character, sortOrder);
              }}
              onFilter={() => {
                handleSearchByType(CardType.Character, "");
              }}
              onCreate={() => {
                handleCreateCard(CardType.Character);
              }}
              onCardClick={(id) => {
                handleCardClick(id);
              }}
              onImport={() => {
                setIsOpenImportCardPopup(true);
              }}
            />
          </div>

          <div
            // style={{ width: pltWidth }}
            className="w-[50%] transition-all duration-300 overflow-hidden max-w-[1000px] min-w-[426px]"
          >
            <CardList
              title="Plots"
              cards={plotCards?.map((card: Card) => card.id.toValue()) || []}
              cardType={CardType.Plot}
              maxColumns={4} // Plot grids have 4 max columns
              onSearch={(query) => {
                handleSearchByType(CardType.Plot, query);
              }}
              onSort={(sortOrder) => {
                handleSort(CardType.Plot, sortOrder);
              }}
              onFilter={() => {
                handleSearchByType(CardType.Plot, "");
              }}
              onCreate={() => {
                handleCreateCard(CardType.Plot);
              }}
              onCardClick={(id) => {
                handleCardClick(id);
              }}
              onImport={() => {
                setIsOpenImportCardPopup(true);
              }}
            />
          </div>
        </div>

        <CardFormSheet
          open={isSheetOpen}
          onOpenChange={(open) => {
            setIsSheetOpen(open);
            if (!open) {
              handleDialogOpenChange(false);
            }
          }}
          cardType={activeCardType}
          selectedCard={selectedCard}
        />

        <Dialog
          open={isOpenImportCardPopup}
          onOpenChange={(open) => setIsOpenImportCardPopup(open)}
        >
          <DialogContent className="pt-14">
            <DialogTitle>Import card</DialogTitle>

            <DialogDescription>
              <div className="flex flex-col gap-2">
                <TypoBase className="text-text-input-subtitle">
                  Supports both V2 and V3 character cards.
                </TypoBase>
              </div>
            </DialogDescription>
            <div
              className="border-dashed bg-background-card hover:bg-background-input rounded-2xl flex flex-col justify-center items-center p-8 cursor-pointer"
              onClick={onClickImportCard}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const file = e.dataTransfer.files[0];
                if (
                  file &&
                  (file.type === "application/json" ||
                    file.type === "image/png")
                ) {
                  onImportCardFromFile(file);
                }
              }}
            >
              <Import size={72} className="text-muted-foreground" />
              <div>
                <TypoBase className="text-muted-foreground">
                  Choose a file or drag it here
                </TypoBase>
              </div>
              <input
                ref={refImportFileInput}
                type="file"
                accept=".json,.png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onImportCardFromFile(file);
                  }
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
