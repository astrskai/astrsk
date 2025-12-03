import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import { SessionsGrid } from "./sessions-grid";
import { SessionImportDialog } from "@/features/session/ui/session-import-dialog";
import { useSessionImport } from "@/features/session/hooks/use-session-import";
import { useSessionImportDialog } from "@/shared/hooks/use-session-import-dialog";

import { useSessionsWithCharacterMetadata } from "@/entities/session/api";
import {
  HelpVideoDialog,
  Loading,
  SearchEmptyState,
  EmptyState,
} from "@/shared/ui";
import { ListPageHeader } from "@/widgets/header";
import {
  SortOptionValue,
  DEFAULT_SORT_VALUE,
  SORT_OPTIONS,
} from "@/shared/config/sort-options";

/**
 * Sessions list page - displays all sessions in a card grid
 */
export function SessionsPage() {
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState<string>("");
  const [isOpenHelpDialog, setIsOpenHelpDialog] = useState<boolean>(false);
  const [sortOption, setSortOption] =
    useState<SortOptionValue>(DEFAULT_SORT_VALUE);

  // Fetch sessions with character metadata prefetched
  // Uses Batch Prefetch pattern for optimal performance
  // Filter to show only non-play sessions (is_play_session: false)
  // Play sessions are shown in the left sidebar instead
  const { sessions, isSessionsLoading, areCharactersLoading } =
    useSessionsWithCharacterMetadata({
      keyword,
      sort: sortOption,
      isPlaySession: false,
    });

  // Import dialog hook - manages file input and parsing
  const {
    fileInputRef,
    isOpenImportDialog,
    setIsOpenImportDialog,
    importingFile,
    agentModels,
    handleFileSelect,
    triggerImport,
  } = useSessionImportDialog();

  // Import handler
  const { handleImport } = useSessionImport();

  const handleCreateSession = () => {
    navigate({ to: "/sessions/new" });
  };

  const handleImportClick = () => {
    // Trigger file selection via hook
    triggerImport();
  };

  const handleHelpClick = () => {
    setIsOpenHelpDialog(true);
  };

  return (
    <div className="flex w-full flex-1 flex-col">
      {/* Hidden file input for import - triggers file selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".session"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Header */}
      <ListPageHeader
        title="Sessions"
        keyword={keyword}
        onKeywordChange={setKeyword}
        onImportClick={handleImportClick}
        onHelpClick={handleHelpClick}
        createLabel="New Session"
        onCreateClick={handleCreateSession}
        sortOptions={SORT_OPTIONS}
        sortValue={sortOption}
        onSortChange={setSortOption}
      />

      {/* Session Import Dialog - receives file and agent models from hook */}
      <SessionImportDialog
        open={isOpenImportDialog}
        onOpenChange={setIsOpenImportDialog}
        onImport={handleImport}
        file={importingFile}
        agentModels={agentModels}
      />
      <HelpVideoDialog
        open={isOpenHelpDialog}
        onOpenChange={setIsOpenHelpDialog}
        type="sessions"
      />

      {/* Content */}
      <div className="flex w-full flex-1 flex-col gap-4 p-4 md:p-8">
        {isSessionsLoading ? (
          <Loading />
        ) : keyword && (!sessions || sessions.length === 0) ? (
          <SearchEmptyState keyword={keyword} />
        ) : !keyword && (!sessions || sessions.length === 0) ? (
          <EmptyState
            title="No sessions available"
            description="Start your new session"
            buttonLabel="Create new session"
            onButtonClick={handleCreateSession}
          />
        ) : (
          <SessionsGrid
            sessions={sessions}
            areCharactersLoading={areCharactersLoading}
          />
        )}
      </div>
    </div>
  );
}
