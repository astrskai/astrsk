import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ListPageHeader } from "@/widgets/list-page-header";
import { ASSET_TABS } from "@/shared/config/asset-tabs";
import { CharactersGrid } from "./ui/list";
import {
  HelpVideoDialog,
  Loading,
  SearchEmptyState,
  EmptyState,
} from "@/shared/ui";
import { cardQueries } from "@/entities/card/api/card-queries";
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

  // Fetch cards
  const { data: allCards, isLoading: isLoadingCards } = useQuery(
    cardQueries.list({ keyword }),
  );

  // Filter by character type
  const characters =
    allCards?.filter(
      (card: CharacterCard) => card.props.type === CardType.Character,
    ) || [];

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
    <div className="flex h-full w-full flex-col overflow-y-auto">
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
      <div className="mx-auto w-full max-w-7xl flex-1 p-4">
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
          // Show grid with characters
          <CharactersGrid
            characters={characters}
            showNewCharacterCard={!keyword}
          />
        )}
      </div>
    </div>
  );
}
