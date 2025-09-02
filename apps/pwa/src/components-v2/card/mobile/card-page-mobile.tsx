"use client";

import { Menu, Plus, Copy, Download, Import, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { useAppStore } from "@/app/stores/app-store";
import CardFormSheet from "@/components-v2/card/components/edit-sheet/card-form-sheet";
import {
  useCardEditor,
  useCardImport,
  useCardManagement,
} from "@/components-v2/card/hooks";
import { useCardSelection, type SelectionAction } from "./hooks/use-card-selection-mobile";
import { CardGridMobile } from "./components/card-grid-mobile";
import { cn } from "@/components-v2/lib/utils";
import { SearchInput } from "@/components-v2/search-input";
import { Button } from "@/components-v2/ui/button";
import { CheckboxMobile } from "@/components-v2/ui/checkbox";
import { ScrollArea, ScrollBar } from "@/components-v2/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components-v2/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components-v2/ui/dialog";
import { Card, CardType } from "@/modules/card/domain";
import { useQueryClient } from "@tanstack/react-query";
import { useMobileNavigation } from "@/App";
import { DeleteConfirm } from "@/components-v2/confirm";
import { SearchCardsSort } from "@/modules/card/repos";
import * as amplitude from "@amplitude/analytics-browser";
import { ListEditDialog } from "@/components-v2/list-edit-dialog";
import { TopNavigation } from "@/components-v2/top-navigation";
import { SortDialog } from "@/components-v2/sort-dialog";


interface CardPageMobileProps {
  className?: string;
}

export default function CardPageMobile({ className }: CardPageMobileProps) {
  const { setIsOpen } = useMobileNavigation();
  // State
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeCardType, setActiveCardType] = useState<CardType>(
    CardType.Character,
  );
  const [activeTab, setActiveTab] = useState<"character" | "plot">("character");
  const {
    cardEditOpen,
    isCardImportDonNotShowAgain,
    setIsCardImportDonNotShowAgain,
  } = useAppStore();

  // Import tip dialog state
  const [showImportTip, setShowImportTip] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Use the card selection hook
  const {
    isSelectionMode,
    selectedCards,
    selectionAction,
    isDeleteConfirmOpen,
    usedSessions,
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
  } = useCardSelection();

  const queryClient = useQueryClient();

  // Use the card management hook
  const {
    characterCards,
    plotCards,
    keywordsByType,
    sortsByType,
    handleInvalidation,
    handleSearchByType,
    handleSort,
  } = useCardManagement();

  // Use the card editor hook
  const { selectedCard, createCard, openCardForEdit, handleDialogOpenChange } =
    useCardEditor();

  // Use the card import hook
  const {
    isOpenImportCardPopup,
    refImportFileInput,
    setIsOpenImportCardPopup,
    onClickImportCard,
    onImportCardFromFile,
  } = useCardImport(handleInvalidation);

  // Get current search query for active tab
  const currentSearchQuery =
    activeTab === "character"
      ? keywordsByType[CardType.Character]
      : keywordsByType[CardType.Plot];

  // Get current sort for active tab
  const currentSort =
    activeTab === "character"
      ? sortsByType[CardType.Character]
      : sortsByType[CardType.Plot];

  // Sort options for the sort dialog
  const sortOptions = [
    { value: SearchCardsSort.Latest, label: "Newest First" },
    { value: SearchCardsSort.Oldest, label: "Oldest First" },
    { value: SearchCardsSort.TitleAtoZ, label: "Title (A-Z)" },
    { value: SearchCardsSort.TitleZtoA, label: "Title (Z-A)" },
  ];

  // Handle search input change
  const handleSearchChange = (value: string) => {
    const cardType =
      activeTab === "character" ? CardType.Character : CardType.Plot;
    handleSearchByType(cardType, value);
  };

  // Handle sorting change
  const handleSortChange = (sortOrder: SearchCardsSort) => {
    const cardType =
      activeTab === "character" ? CardType.Character : CardType.Plot;
    handleSort(cardType, sortOrder);
  };

  // Card creation functions
  const handleCreateCard = (type: CardType) => {
    if (type === CardType.Character) {
      amplitude.track("create_charactercard_initiate");
    } else if (type === CardType.Plot) {
      amplitude.track("create_plotcard_initiate");
    }
    setActiveCardType(type);
    createCard(type);
    setIsSheetOpen(true);
  };

  // Handle opening a card for editing
  const handleEditCard = (id: string, type: CardType) => {
    setActiveCardType(type);
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




  const handleSelectionAction = async () => {
    if (selectedCards.size === 0) return;

    const selectedCardsData = getSelectedCardsData(characterCards, plotCards);

    if (selectionAction === "copy") {
      await handleCopyCards(selectedCardsData, handleInvalidation);
    } else if (selectionAction === "delete") {
      await checkDeleteDependencies(selectedCardsData);
    } else if (selectionAction === "export") {
      await handleExportCards(selectedCardsData);
    }
  };

  const executeSelectionAction = async () => {
    const selectedCardsData = getSelectedCardsData(characterCards, plotCards);
    await handleDeleteCards(selectedCardsData, handleInvalidation);
  };

  // Auto-open for card creation from other pages
  useEffect(() => {
    if (cardEditOpen === null) return;
    if (cardEditOpen === CardType.Plot) {
      setActiveTab("plot");
      handleCreateCard(CardType.Plot);
    } else if (cardEditOpen === CardType.Character) {
      setActiveTab("character");
      handleCreateCard(CardType.Character);
    }
  }, [cardEditOpen]);

  const renderCardGrid = (cards: Card[], type: CardType) => (
    <CardGridMobile
      cards={cards}
      type={type}
      isSelectionMode={isSelectionMode}
      selectedCards={selectedCards}
      onToggleSelection={toggleSelection}
      onCardClick={handleEditCard}
    />
  );

  return (
    <div
      className={cn("flex flex-col h-dvh bg-background-surface-2", className)}
    >
      {/* Mobile Header */}
      <TopNavigation
        title={
          isSelectionMode ? `${selectedCards.size} Cards selected` : "Cards"
        }
        onMenuClick={isSelectionMode ? undefined : () => setIsOpen(true)}
        leftAction={
          isSelectionMode ? (
            <Button
              variant="ghost"
              onClick={exitSelectionMode}
              className="h-[40px]"
            >
              Done
            </Button>
          ) : undefined
        }
        rightAction={
          isSelectionMode ? (
            <Button
              variant="ghost"
              onClick={handleSelectionAction}
              disabled={selectedCards.size === 0}
              className="h-[40px]"
            >
              {selectionAction === "copy"
                ? "Copy"
                : selectionAction === "export"
                  ? "Export"
                  : "Delete"}
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              <SortDialog
                options={sortOptions}
                onSort={(value) => handleSortChange(value as SearchCardsSort)}
                triggerClassName="h-[40px] w-[40px]"
              />
              <ListEditDialog
                onAction={(action) => {
                  if (action === "import") {
                    if (!isCardImportDonNotShowAgain) {
                      setShowImportTip(true);
                    } else {
                      onClickImportCard();
                    }
                  } else {
                    enterSelectionMode(action as SelectionAction);
                  }
                }}
              />
            </div>
          )
        }
      />

      {/* Tabs for Character and Plot */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "character" | "plot")}
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="shrink-0">
          <TabsList
            variant="dark-mobile"
            className="mt-4 mx-4 flex w-[calc(100%-2rem)] overflow-x-auto"
          >
            <TabsTrigger value="character">Characters</TabsTrigger>
            <TabsTrigger value="plot">Plots</TabsTrigger>
          </TabsList>

          {/* Search and Create */}
          <div className="px-4 pt-4 pb-4 space-y-4">
            <SearchInput
              key={activeTab}
              variant="mobile"
              value={currentSearchQuery || ""}
              onChange={(e) => handleSearchChange(e.target.value)}
              onClear={() => handleSearchChange("")}
              placeholder="Search cards"
            />
          </div>
        </div>

        <TabsContent value="character" className="mt-0 flex-1 min-h-0">
          <ScrollArea className="h-full">
            {characterCards && characterCards.length > 0 && (
              <div className="w-full flex flex-col items-center justify-center pb-2">
                <Button
                  onClick={() => {
                    handleCreateCard(
                      activeTab === "character"
                        ? CardType.Character
                        : CardType.Plot,
                    );
                  }}
                  size="lg"
                  disabled={isSelectionMode}
                >
                  <Plus className="min-w-4 min-h-4" />
                  Create new {activeTab === "character" ? "character" : "plot"}
                </Button>
              </div>
            )}
            <div className="pt-1 pb-4 px-4">
              {!characterCards || characterCards.length === 0 ? (
                <div className="absolute inset-x-0 top-[35%] -translate-y-1/2 flex items-center justify-center h-[400px]">
                  <div className="w-80 inline-flex flex-col justify-start items-center gap-8">
                    <div className="flex flex-col justify-start items-center gap-4">
                      <div className="text-center justify-start text-text-body text-xl font-semibold">
                        {keywordsByType[CardType.Character]
                          ? `No results for '${keywordsByType[CardType.Character]}'`
                          : "No character cards available"}
                      </div>
                      <div className="self-stretch text-center justify-start text-background-surface-5 text-base font-medium leading-relaxed">
                        {keywordsByType[CardType.Character] ? (
                          <>
                            Try a different name, tag, or keyword to
                            <br />
                            find the character you're looking for.
                          </>
                        ) : (
                          <>
                            Every story needs a cast.
                            <br />
                            Add your first character to begin
                          </>
                        )}
                      </div>
                    </div>
                    {/* Add character card button when no cards exist */}
                    {!keywordsByType[CardType.Character] && (
                      <Button
                        onClick={() => handleCreateCard(CardType.Character)}
                        disabled={isSelectionMode}
                        size="lg"
                      >
                        <Plus className="min-w-4 min-h-4" />
                        Create new character
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                renderCardGrid(characterCards, CardType.Character)
              )}
            </div>

            <ScrollBar orientation="vertical" className="w-1.5" />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="plot" className="mt-0 flex-1 min-h-0">
          <ScrollArea className="h-full">
            {/* Only show create button if there are plot cards */}
            {plotCards && plotCards.length > 0 && (
              <div className="w-full flex flex-col items-center justify-center pb-2">
                <Button
                  onClick={() => {
                    handleCreateCard(CardType.Plot);
                  }}
                  size="lg"
                  disabled={isSelectionMode}
                >
                  <Plus className="min-w-4 min-h-4" />
                  Create new plot
                </Button>
              </div>
            )}
            <div className="pt-1 pb-4 px-4">
              {!plotCards || plotCards.length === 0 ? (
                <div className="absolute inset-x-0 top-[35%] -translate-y-1/2 flex items-center justify-center h-[400px]">
                  <div className="w-80 inline-flex flex-col justify-start items-center gap-8">
                    <div className="flex flex-col justify-start items-center gap-4">
                      <div className="text-center justify-start text-text-body text-xl font-semibold">
                        {keywordsByType[CardType.Plot]
                          ? `No results for '${keywordsByType[CardType.Plot]}'`
                          : "No plot cards available"}
                      </div>
                      <div className="self-stretch text-center justify-start text-background-surface-5 text-base font-medium leading-relaxed">
                        {keywordsByType[CardType.Plot] ? (
                          <>
                            Try a different name, tag, or keyword to
                            <br />
                            find the plot you're looking for.
                          </>
                        ) : (
                          <>Start by creating a plot to guide your story</>
                        )}
                      </div>
                    </div>
                    {/* Add plot card button when no cards exist */}
                    {!keywordsByType[CardType.Plot] && (
                      <Button
                        onClick={() => handleCreateCard(CardType.Plot)}
                        disabled={isSelectionMode}
                        size="lg"
                      >
                        <Plus className="min-w-4 min-h-4" />
                        Create new plot
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                renderCardGrid(plotCards, CardType.Plot)
              )}
            </div>
            <ScrollBar orientation="vertical" className="w-1.5" />
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Card Form Sheet */}
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

      {/* Hidden file input for import */}
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

      {/* Delete Confirmation Dialog */}
      <DeleteConfirm
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="Are you sure?"
        description={
          <>
            {usedSessions.length > 0 && (
              <>
                {selectedCards.size === 1 ? "This card is" : "These cards are"}{" "}
                used in{" "}
                <span className="text-secondary-normal font-medium">
                  {usedSessions.length} session
                  {usedSessions.length !== 1 ? "s" : ""}
                </span>
                .
                <br />
                Deleting {selectedCards.size === 1 ? "it" : "them"} might
                corrupt or disable these sessions.
                <br />
                <br />
              </>
            )}
            This action cannot be undone.{" "}
            {selectedCards.size === 1
              ? "The selected card"
              : `${selectedCards.size} selected cards`}{" "}
            will be permanently deleted.
          </>
        }
        deleteLabel="Yes, delete"
        onDelete={async () => {
          await executeSelectionAction();
          setIsDeleteConfirmOpen(false);
        }}
      />

      {/* Import Tip Dialog */}
      <Dialog
        open={showImportTip}
        onOpenChange={(open) => {
          setShowImportTip(open);
          if (!open) {
            setDontShowAgain(false);
          }
        }}
      >
        <DialogContent hideClose className="max-w-[90vw]">
          <DialogHeader hidden>
            <DialogTitle className="text-left">Import card tip!</DialogTitle>
          </DialogHeader>
          <div className="py-2 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="text-xl  text-text-primary font-semibold text-left">
                  Import card tip!
                </div>
              </div>
              <p className="text-text-secondary text-left">
                Supports both V2 and V3 character cards.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <CheckboxMobile
                checked={dontShowAgain}
                onCheckedChange={(checked) =>
                  setDontShowAgain(checked === true)
                }
                className="h-6 w-6"
              />
              <span className="text-base text-text-primary">
                Don't show this again
              </span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              size="lg"
              variant="ghost"
              onClick={() => {
                setShowImportTip(false);
              }}
            >
              Cancel
            </Button>
            <Button
              size="lg"
              onClick={() => {
                if (dontShowAgain) {
                  setIsCardImportDonNotShowAgain(true);
                }
                setShowImportTip(false);
                onClickImportCard();
              }}
            >
              Choose a file
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
