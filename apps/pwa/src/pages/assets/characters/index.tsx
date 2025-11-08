import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ListPageHeader } from "@/widgets/list-page-header";
import { ASSET_TABS } from "@/shared/config/asset-tabs";
import { CharactersGrid } from "./ui/list";
import { HelpVideoDialog, Loading, SearchEmptyState } from "@/shared/ui";
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

  const handleClearSearch = () => {
    setKeyword("");
  };

  return (
    <div className="flex h-full w-full flex-col">
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
      <div className="flex-1 overflow-y-auto">
        {isLoadingCards ? (
          <Loading />
        ) : keyword && characters.length === 0 ? (
          // Search with no results - show empty state with clear action
          <SearchEmptyState
            keyword={keyword}
            message="No characters found"
            description="Try a different search term"
            onClearSearch={handleClearSearch}
          />
        ) : (
          // Show grid with characters (or NewCharacterCard if empty)
          <CharactersGrid
            characters={characters}
            showNewCharacterCard={!keyword}
          />
        )}
      </div>
    </div>
  );
}
