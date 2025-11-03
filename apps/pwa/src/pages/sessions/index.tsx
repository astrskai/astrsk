import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { SessionsGrid } from "./ui/list";
import { SessionImportDialog } from "./ui/dialog/session-import-dialog";
import { useSessionImport } from "@/features/session/hooks/use-session-import";

import { sessionQueries } from "@/entities/session/api";
import { HelpVideoDialog, Loading, SearchEmptyState } from "@/shared/ui";
import { ListPageHeader } from "@/widgets/list-page-header";

/**
 * Sessions list page - displays all sessions in a card grid
 */
export function SessionsPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState<string>("");
  const [isOpenImportDialog, setIsOpenImportDialog] = useState<boolean>(false);
  const [isOpenHelpDialog, setIsOpenHelpDialog] = useState<boolean>(false);

  // Fetch sessions with search filter
  const { data: sessions, isLoading } = useQuery(
    sessionQueries.list({ keyword }),
  );

  // Import handlers
  const { handleImport, handleFileSelect } = useSessionImport();

  const handleCreateSession = () => {
    navigate({ to: "/sessions/new" });
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
      {/* Header */}
      <ListPageHeader
        title="Sessions"
        keyword={keyword}
        onKeywordChange={setKeyword}
        onImportClick={() => setIsOpenImportDialog(true)}
        onExportClick={handleExport}
        onHelpClick={handleHelpClick}
      />

      <SessionImportDialog
        open={isOpenImportDialog}
        onOpenChange={setIsOpenImportDialog}
        onImport={handleImport}
        onFileSelect={handleFileSelect}
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
