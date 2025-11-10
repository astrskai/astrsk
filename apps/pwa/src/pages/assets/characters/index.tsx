import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ListPageHeader } from "@/widgets/list-page-header";
import { ASSET_TABS } from "@/shared/config/asset-tabs";
import {
  SORT_OPTIONS,
  DEFAULT_SORT_VALUE,
  type SortOptionValue,
} from "@/shared/config/sort-options";
import { CharactersGrid } from "./ui/list";
import {
  HelpVideoDialog,
  Loading,
  SearchEmptyState,
  EmptyState,
} from "@/shared/ui";
import { Select } from "@/shared/ui/forms";
import { cardQueries } from "@/entities/card/api";
import { CardType } from "@/entities/card/domain";
import { CharacterCard } from "@/entities/card/domain/character-card";
import { useResourceImport } from "@/shared/hooks/use-resource-import";
import { FlowImportDialog } from "@/pages/assets/workflows/ui/dialog/flow-import-dialog";

/**
 * Characters List Page
 * Displays all character cards with search and import functionality
 */
export function CharactersListPage() {
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState<string>("");
  const [isOpenHelpDialog, setIsOpenHelpDialog] = useState<boolean>(false);
  const [sortOption, setSortOption] =
    useState<SortOptionValue>(DEFAULT_SORT_VALUE);

  // Unified resource import hook
  const {
    fileInputRef,
    isOpenImportDialog,
    setIsOpenImportDialog,
    importingFile,
    agentModels,
    handleFileSelect,
    handleImportFlow,
    triggerImport,
  } = useResourceImport();

  // Fetch cards with sorting
  const { data: allCards, isLoading: isLoadingCards } = useQuery(
    cardQueries.list({ keyword, sort: sortOption }),
  );

  // Filter by character type
  const characters = useMemo(() => {
    return (
      allCards?.filter(
        (card: CharacterCard) => card.props.type === CardType.Character,
      ) || []
    );
  }, [allCards]);

  const handleSortOptionChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setSortOption(event.target.value);
  };

  // Event handlers
  const handleImport = () => {
    triggerImport();
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Export clicked for: characters");
  };

  const handleHelpClick = () => {
    setIsOpenHelpDialog(true);
  };

  const handleCreateCharacter = () => {
    navigate({ to: "/assets/characters/new" });
  };

  return (
    <div className="flex w-full flex-1 flex-col">
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,.json,application/json"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Header - Sticky */}
      <ListPageHeader
        title="Assets"
        tabs={ASSET_TABS}
        activeTab="character"
        keyword={keyword}
        onKeywordChange={setKeyword}
        onImportClick={handleImport}
        onExportClick={handleExport}
        onHelpClick={handleHelpClick}
      />

      {/* Import Flow Dialog - for JSON imports */}
      <FlowImportDialog
        open={isOpenImportDialog}
        onOpenChange={setIsOpenImportDialog}
        onImport={handleImportFlow}
        onFileSelect={async () => agentModels}
        file={importingFile}
        agentModels={agentModels}
      />

      <HelpVideoDialog
        open={isOpenHelpDialog}
        onOpenChange={setIsOpenHelpDialog}
        type="cards"
      />

      {/* Content */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4">
        {isLoadingCards ? (
          <Loading />
        ) : keyword && characters.length === 0 ? (
          <SearchEmptyState
            keyword={keyword}
            description="Try a different name, tag or keyword to find the character you're looking for"
          />
        ) : !keyword && characters.length === 0 ? (
          <EmptyState
            title="No characters available"
            description="Start your new character"
            buttonLabel="Create new character"
            onButtonClick={handleCreateCharacter}
          />
        ) : (
          <>
            {/* Sort Controls */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-200">
                <span className="font-semibold text-gray-50">
                  {characters.length}
                </span>{" "}
                {characters.length === 1 ? "character" : "characters"}
              </span>
              <Select
                options={SORT_OPTIONS}
                value={sortOption}
                onChange={handleSortOptionChange}
                selectSize="sm"
                className="w-[150px] md:w-[180px]"
              />
            </div>

            {/* Characters Grid */}
            <CharactersGrid
              characters={characters}
              showNewCharacterCard={!keyword}
            />
          </>
        )}
      </div>
    </div>
  );
}
