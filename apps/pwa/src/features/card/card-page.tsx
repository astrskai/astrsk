"use client";

import { Import } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

import { useNavigate } from "@tanstack/react-router";
import CardList from "@/features/card/card-list";
import CardFormSheet from "@/features/card/ui/edit-sheet/card-form-sheet";
import {
  useCardEditor,
  useCardImport,
  useCardManagement,
} from "@/features/card/hooks";
import { cn } from "@/shared/lib";
import {
  TypoBase,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui";
import { Card, CardType } from "@/entities/card/domain";
import { useCardUIStore } from "@/entities/card/stores/card-ui-store";

export default function CardPage({ className }: { className?: string }) {
  // Sheet state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeCardType, setActiveCardType] = useState<CardType>(
    CardType.Character,
  );

  const { cardEditOpen } = useCardUIStore();

  const navigate = useNavigate();

  // Ref for container
  const containerRef = useRef<HTMLDivElement>(null);

  // Use the card management hook for real card data
  const {
    characterCards,
    plotCards,
    handleInvalidation,
    handleSort,
    handleSearchByType,
  } = useCardManagement();

  // Use the card editor hook for creating and editing cards
  const { selectedCard, createCard, handleDialogOpenChange } = useCardEditor();

  // Use the card import hook
  const {
    isOpenImportCardPopup,
    refImportFileInput,
    setIsOpenImportCardPopup,
    onClickImportCard,
    onImportCardFromFile,
  } = useCardImport(handleInvalidation);

  // Card creation functions
  const handleCreateCard = useCallback(
    (type: CardType) => {
      console.log("Creating card of type:", type);
      if (type === CardType.Character) {
        console.log("Tracking new character card creation button pressed");
      } else if (type === CardType.Plot) {
        console.log("Tracking new plot card creation button pressed");
      }
      setActiveCardType(type);
      createCard(type);
      setIsSheetOpen(true);
    },
    [createCard, setActiveCardType, setIsSheetOpen],
  );

  // Handle card click to navigate to CardPanel
  const handleCharacterClick = (id: string) => {
    console.log("Navigate to character detail page for card:", id);
    navigate({
      to: "/assets/characters/{-$characterId}",
      params: { characterId: id },
    });
  };

  const handlePlotClick = (id: string) => {
    console.log("Navigate to scenario detail page for card:", id);
    navigate({ to: "/assets/scenarios/$scenarioId", params: { scenarioId: id } });
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
  }, [cardEditOpen, handleCreateCard]);

  return (
    <div className={cn(className)}>
      <div
        className="bg-background-screen relative flex h-screen flex-col overflow-hidden"
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
            "relative flex h-full justify-center gap-4 p-4",
            "flex-row",
            "pb-8",
            "z-10",
            "overflow-hidden",
          )}
        >
          <div
            // style={{ width: charWidth }}
            className="w-[50%] max-w-[1000px] min-w-[426px] overflow-hidden transition-all duration-300"
          >
            <CardList
              title="Characters"
              cards={
                characterCards?.map((card: Card) => card.id.toValue()) || []
              }
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
                handleCharacterClick(id);
              }}
              onImport={() => {
                setIsOpenImportCardPopup(true);
              }}
            />
          </div>

          <div
            // style={{ width: pltWidth }}
            className="w-[50%] max-w-[1000px] min-w-[426px] overflow-hidden transition-all duration-300"
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
                handlePlotClick(id);
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
              className="bg-background-card hover:bg-background-input flex cursor-pointer flex-col items-center justify-center rounded-2xl border-dashed p-8"
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
