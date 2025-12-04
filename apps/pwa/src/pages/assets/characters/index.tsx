import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ListPageHeader } from "@/widgets/header";
import {
  SORT_OPTIONS,
  DEFAULT_SORT_VALUE,
  type SortOptionValue,
} from "@/shared/config/sort-options";
import { CharactersGrid } from "./characters-grid";
import {
  HelpVideoDialog,
  Loading,
  SearchEmptyState,
  EmptyState,
} from "@/shared/ui";
import { characterQueries } from "@/entities/character/api";
import { useResourceImport } from "@/shared/hooks/use-resource-import";
import { FlowImportDialog } from "@/features/flow/ui/flow-import-dialog";

/**
 * Characters Page
 * Displays all character cards with search and import functionality
 */
export function CharactersPage() {
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

  // Fetch characters directly (DB-level filtering by CardType.Character)
  const { data: characters = [], isLoading: isLoadingCards } = useQuery(
    characterQueries.list({ keyword, sort: sortOption }),
  );

  // Event handlers
  const handleImport = () => {
    triggerImport();
  };

  const handleHelpClick = () => {
    setIsOpenHelpDialog(true);
  };

  const handleCreateCharacter = () => {
    // Navigate to the unified create/edit page with "new" as special value (create mode)
    navigate({
      to: "/assets/characters/{-$characterId}",
      params: { characterId: "new" },
    });
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

      {/* Header */}
      <ListPageHeader
        title="Characters"
        keyword={keyword}
        onKeywordChange={setKeyword}
        onImportClick={handleImport}
        onHelpClick={handleHelpClick}
        createLabel="New Character"
        onCreateClick={handleCreateCharacter}
        sortOptions={SORT_OPTIONS}
        sortValue={sortOption}
        onSortChange={setSortOption}
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
      <div className="flex w-full flex-1 flex-col gap-4 p-4 md:p-8">
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
            <CharactersGrid characters={characters} />
          </>
        )}
      </div>
    </div>
  );
}
