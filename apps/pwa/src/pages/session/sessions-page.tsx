import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  NewSessionCard,
  SessionsPageHeader,
  SessionsGrid,
  EmptyState,
} from "@/features/session/ui";
import { NameInputDialog } from "@/features/session/ui/create-session";
import { SessionImportDialog } from "@/features/session/components/session-import-dialog";
import { useSessionImport } from "@/features/session/hooks/use-session-import";

import { sessionQueries } from "@/app/queries/session-queries";
import { HelpVideoDialog, Loading } from "@/shared/ui";

/**
 * Sessions list page - displays all sessions in a card grid
 */
export function SessionsPage() {
  const [keyword, setKeyword] = useState<string>("");
  const [isOpenImportDialog, setIsOpenImportDialog] = useState<boolean>(false);
  const [isOpenCreateDialog, setIsOpenCreateDialog] = useState<boolean>(false);
  const [isOpenHelpDialog, setIsOpenHelpDialog] = useState<boolean>(false);

  // Fetch sessions with search filter
  const { data: sessions, isLoading } = useQuery(
    sessionQueries.list({ keyword }),
  );

  // Import handlers
  const { handleImport, handleFileSelect } = useSessionImport();

  const handleCreateSession = () => {
    setIsOpenCreateDialog(true);
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
      <SessionsPageHeader
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
      <NameInputDialog
        open={isOpenCreateDialog}
        onOpenChange={setIsOpenCreateDialog}
      />
      <HelpVideoDialog
        open={isOpenHelpDialog}
        onOpenChange={setIsOpenHelpDialog}
        type="sessions"
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {isLoading ? (
          <Loading />
        ) : sessions && sessions.length > 0 ? (
          <SessionsGrid
            sessions={sessions}
            onCreateSession={handleCreateSession}
            keyword={keyword}
          />
        ) : keyword ? (
          // Search with no results - show empty state
          <EmptyState keyword={keyword} onClearSearch={handleClearSearch} />
        ) : (
          // No sessions at all - show only New Session card
          <div className="mx-auto grid [grid-template-columns:repeat(auto-fit,minmax(min(288px,100%),340px))] justify-center gap-4 p-4">
            <NewSessionCard onClick={handleCreateSession} />
          </div>
        )}
      </div>
    </div>
  );
}
