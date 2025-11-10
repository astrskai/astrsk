import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { SessionsGrid } from "./ui/list";
import { SessionImportDialog } from "./ui/dialog/session-import-dialog";
import { useSessionImport } from "@/features/session/hooks/use-session-import";
import { useSessionImportDialog } from "@/shared/hooks/use-session-import-dialog";

import { sessionQueries } from "@/entities/session/api";
import {
  HelpVideoDialog,
  Loading,
  SearchEmptyState,
  EmptyState,
} from "@/shared/ui";
import { Select } from "@/shared/ui/forms";
import { ListPageHeader } from "@/widgets/list-page-header";
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

  // Fetch sessions with search filter
  const { data: sessions = [], isLoading } = useQuery(
    sessionQueries.list({ keyword, sort: sortOption }),
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

  const handleSortOptionChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setSortOption(event.target.value);
  };

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
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4">
        {isLoading ? (
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
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-200">
                <span className="font-semibold text-gray-50">
                  {sessions.length}
                </span>{" "}
                {sessions.length === 1 ? "session" : "sessions"}
              </span>
              <Select
                options={SORT_OPTIONS}
                value={sortOption}
                onChange={handleSortOptionChange}
                selectSize="sm"
                className="w-[150px] md:w-[180px]"
              />
            </div>

            <SessionsGrid
              sessions={sessions}
              onCreateSession={handleCreateSession}
              showNewSessionCard={!keyword}
            />
          </>
        )}
      </div>
    </div>
  );
}
