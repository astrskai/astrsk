import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { SessionsGrid } from "./ui/list";
import { SessionImportDialog } from "./ui/dialog/session-import-dialog";
import { useSessionImport } from "@/features/session/hooks/use-session-import";
import { useSessionImportDialog } from "@/shared/hooks/use-session-import-dialog";

import { sessionQueries } from "@/entities/session/api";
import { HelpVideoDialog, Loading, SearchEmptyState } from "@/shared/ui";
import { ListPageHeader } from "@/widgets/list-page-header";

/**
 * Sessions list page - displays all sessions in a card grid
 */
export function SessionsPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState<string>("");
  const [isOpenHelpDialog, setIsOpenHelpDialog] = useState<boolean>(false);

  // Fetch sessions with search filter
  const { data: sessions, isLoading } = useQuery(
    sessionQueries.list({ keyword }),
  );

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

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Export clicked");
  };

  const handleClearSearch = () => {
    setKeyword("");
  };

  const handleHelpClick = () => {
    setIsOpenHelpDialog(true);
  };

  return (
    <div className="bg-background-surface-2 flex h-full w-full flex-col">
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
        onExportClick={handleExport}
        onHelpClick={handleHelpClick}
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
      <div className="flex-1 overflow-y-auto px-1 py-2">
        {isLoading ? (
          <Loading />
        ) : keyword && (!sessions || sessions.length === 0) ? (
          // Search with no results - show empty state with clear action
          <SearchEmptyState
            keyword={keyword}
            message="No sessions found"
            description="Try a different search term"
            onClearSearch={handleClearSearch}
          />
        ) : (
          // Show grid with sessions (or NewSessionCard if empty)
          <SessionsGrid
            sessions={sessions || []}
            onCreateSession={handleCreateSession}
            showNewSessionCard={!keyword}
          />
        )}
      </div>
    </div>
  );
}
