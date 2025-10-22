import { Plus } from "lucide-react";
import React, { useState } from "react";

import { useCards } from "@/app/hooks/use-cards";
import {
  characterFilePath,
  plotFilePath,
} from "@/app/hooks/use-default-initialized";
import { CardService } from "@/app/services";
import { HeaderBar, SortingBar } from "@/features/card/components";
import CardGrid from "@/features/card/components/card-grid";
import { SearchInput } from "@/components/ui/search-input";
import { TypoBase, Typo3XLarge } from "@/components/ui/typo";
import { Button } from "@/components-v2/ui/button";
import { Card } from "@/components-v2/ui/card";
import { CardType } from "@/modules/card/domain";
import { SearchCardsSort } from "@/modules/card/repos";
import { useIsMobile } from "@/components-v2/hooks/use-mobile";
import { cn } from "@/shared/utils";

interface CardListProps {
  title: string;
  cards: string[];
  cardType?: CardType;
  onSearch?: (query: string) => void;
  onSort?: (order: SearchCardsSort) => void;
  onFilter?: () => void;
  onCreate?: () => void;
  onCardClick?: (id: string) => void;
  onImport?: () => void;
  maxColumns?: number; // Optional prop to override max columns
}

interface NoCardsFoundProps {
  cardType?: CardType;
  onCreate?: () => void;
  onCreateDefault?: () => void;
  variant?: "default" | "edit";
  keyword?: string;
}

export const NoCardsFound: React.FC<NoCardsFoundProps> = ({
  cardType,
  onCreate,
  onCreateDefault,
  variant = "default",
  keyword,
}) => {
  // Call the hook at the component level
  const [, invalidateCards] = useCards();
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();
  const initializeCard = async (cardType: CardType) => {
    setIsLoading(true);
    try {
      const filePaths =
        cardType === CardType.Character ? characterFilePath : plotFilePath;

      for (const path of filePaths) {
        const response = await fetch(path);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${path}`);
        }

        const file = new File([await response.blob()], path, {
          type: "image/png",
        });

        const result = await CardService.importCardFromFile.execute(file);
        if (result.isFailure) {
          throw new Error(result.getError());
        }
      }

      invalidateCards();
      if (onCreateDefault) onCreateDefault();
    } catch (error) {
      console.error("Failed to initialize default cards:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col items-center gap-8`}>
      <div className="flex flex-col items-center gap-4">
        <Typo3XLarge
          className={cn(
            "text-text-input-subtitle w-[600px] truncate text-center",
            isMobile && "w-full text-base",
          )}
        >
          {keyword && keyword.length > 0
            ? `No results for \'${keyword}\'`
            : cardType === CardType.Character
              ? "No character cards available"
              : "No plot cards available"}
        </Typo3XLarge>
        {keyword && keyword.length > 0 ? (
          <TypoBase className="text-background-dialog truncate text-center leading-normal">
            Try a different name, tag, or keyword to <br />
            find the {cardType === CardType.Character
              ? "character"
              : "plot"}{" "}
            you&apos;re looking for.
          </TypoBase>
        ) : cardType === CardType.Character ? (
          <TypoBase className="text-background-dialog text-center leading-normal">
            Every story needs a cast.
            <br />
            Add your first character to begin
          </TypoBase>
        ) : (
          <TypoBase className="text-background-dialog text-center leading-normal">
            Start by creating a plot to guide your story.
          </TypoBase>
        )}
      </div>
      {!keyword && (
        <Button size="lg" onClick={onCreate}>
          <Plus className="mr-1" />
          Create New {cardType === CardType.Character ? "Character" : "Plot"}
        </Button>
      )}
      {/* <Button 
        variant="ghost_white" 
        className="text-button-background-secondary" 
        onClick={() => initializeCard(cardType!)} 
        disabled={isLoading}
      >
        {isLoading ? 'Loading...' : `+ Add from default ${cardType === CardType.Character ? "characters" : "plots"}`}
      </Button> */}
    </div>
  );
};

const CardList: React.FC<CardListProps> = ({
  title,
  cards,
  cardType,
  onSearch,
  onSort,
  onFilter,
  onCreate,
  onCardClick,
  onImport,
  maxColumns, // Pass through to CardGrid
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SearchCardsSort>(
    SearchCardsSort.Latest,
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) onSearch(query);
  };

  const handleSort = (newSortOrder: SearchCardsSort) => {
    setSortOrder(newSortOrder);
    if (onSort) onSort(newSortOrder);
  };

  return (
    <Card className="rounded-5 bg-background-container text-card-foreground border-secondary flex h-[calc(100%-4rem)] min-h-0 grow translate-y-4 flex-col overflow-hidden p-4 px-3 shadow-lg backdrop-blur-xs">
      <div className="flex h-full min-h-0 flex-col space-y-4">
        <HeaderBar
          title={title}
          onCreate={onCreate}
          onImport={onImport}
          cardType={cardType}
        />
        <SearchInput value={searchQuery} onChange={handleSearch} />
        <SortingBar
          sortOrder={sortOrder}
          onSort={handleSort}
          onFilter={onFilter}
        />
        {cards.length === 0 ? (
          searchQuery.length > 0 ? (
            <div className="flex h-full items-center justify-center">
              <NoCardsFound
                cardType={cardType}
                onCreate={onCreate}
                keyword={searchQuery}
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <NoCardsFound cardType={cardType} onCreate={onCreate} />
            </div>
          )
        ) : (
          <CardGrid
            cards={cards}
            onCardClick={onCardClick}
            maxColumns={maxColumns}
          />
        )}
      </div>
    </Card>
  );
};

export default CardList;
