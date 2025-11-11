import { Plus, Upload, Copy, Trash2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { Session } from "@/entities/session/domain/session";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { CreateItemCard } from "@/shared/ui";
import { Button } from "@/shared/ui/forms";
import { ActionConfirm } from "@/shared/ui/dialogs";
import { Checkbox, Label } from "@/shared/ui";

import SessionPreview from "@/features/session/ui/session-preview";
import type { SessionAction } from "@/features/session/ui/session-preview";
import { useSessionActions } from "@/features/session/model/use-session-actions";
import { useNewItemAnimation } from "@/shared/hooks/use-new-item-animation";
import { SessionExportDialog } from "../dialog/session-export-dialog";
import { useSessionStore } from "@/shared/stores/session-store";
import { useAsset } from "@/shared/hooks/use-asset";
import { cn } from "@/shared/lib";

interface SessionsGridProps {
  sessions: Session[];
  onCreateSession: () => void;
  showNewSessionCard: boolean;
  newlyCreatedSessionId?: string | null;
}

/**
 * Session Grid Item
 * Wrapper component for SessionPreview with actions
 */
interface SessionGridItemProps {
  session: Session;
  loading: { exporting?: boolean; copying?: boolean; deleting?: boolean };
  className?: string;
  onSessionClick: (sessionId: string) => void;
  onExportClick: (
    sessionId: string,
    title: string,
    flowId: UniqueEntityID | undefined,
  ) => (e: React.MouseEvent) => void;
  onCopy: (sessionId: string, title: string) => (e: React.MouseEvent) => void;
  onDeleteClick: (
    sessionId: string,
    title: string,
  ) => (e: React.MouseEvent) => void;
}

function SessionGridItem({
  session,
  loading,
  className,
  onSessionClick,
  onExportClick,
  onCopy,
  onDeleteClick,
}: SessionGridItemProps) {
  const sessionId = session.id.toString();
  const messageCount = session.props.turnIds.length;

  // Get session background image
  const backgroundId = session.props.backgroundId;
  const [coverImageUrl] = useAsset(backgroundId);

  // Simple validation: check if session has AI character cards
  // Avoid expensive per-card queries (useSessionValidation with nested flow queries)
  const isInvalid = session.aiCharacterCardIds.length === 0;

  const actions: SessionAction[] = [
    {
      icon: Upload,
      label: `Export`,
      onClick: onExportClick(sessionId, session.props.title, session.flowId),
      disabled: loading.exporting,
      loading: loading.exporting,
    },
    {
      icon: Copy,
      label: `Copy`,
      onClick: onCopy(sessionId, session.props.title),
      disabled: loading.copying,
      loading: loading.copying,
    },
    {
      icon: Trash2,
      label: `Delete`,
      onClick: onDeleteClick(sessionId, session.props.title),
      disabled: loading.deleting,
      loading: loading.deleting,
    },
  ];

  return (
    <SessionPreview
      title={session.props.title || "Untitled Session"}
      imageUrl={coverImageUrl}
      messageCount={messageCount}
      isInvalid={isInvalid}
      onClick={() => onSessionClick(sessionId)}
      actions={actions}
      isShowActions={true}
      className={className}
    />
  );
}

/**
 * Sessions grid component
 * Displays sessions in a responsive grid with optional New Session Card
 *
 * Layout:
 * - Mobile: Button above grid + 2 columns per row
 * - Desktop: New card inside grid + up to 5 columns per row
 */
export function SessionsGrid({
  sessions,
  onCreateSession,
  showNewSessionCard,
  newlyCreatedSessionId = null,
}: SessionsGridProps) {
  const navigate = useNavigate();
  const selectSession = useSessionStore.use.selectSession();
  const { animatingId, triggerAnimation } = useNewItemAnimation();

  const {
    loadingStates,
    deleteDialogState,
    exportDialogState,
    copyDialogState,
    handleExportClick,
    handleExportConfirm,
    handleCopyClick,
    handleCopyConfirm,
    toggleIncludeChatHistory,
    handleDeleteClick,
    handleDeleteConfirm,
    closeDeleteDialog,
    closeExportDialog,
    closeCopyDialog,
  } = useSessionActions({
    onCopySuccess: (sessionId) => triggerAnimation(sessionId),
  });

  // Track newly created session from parent
  useEffect(() => {
    if (newlyCreatedSessionId) {
      triggerAnimation(newlyCreatedSessionId);
    }
  }, [newlyCreatedSessionId, triggerAnimation]);

  const handleSessionClick = (sessionId: string) => {
    const session = sessions.find((s) => s.id.toString() === sessionId);
    if (session) {
      selectSession(session.id, session.props.title);
    }
    navigate({
      to: "/sessions/$sessionId",
      params: { sessionId },
    });
  };

  return (
    <>
      <div className="flex w-full flex-col gap-4">
        {/* Mobile: Create Button (outside grid) */}
        {showNewSessionCard && (
          <Button
            onClick={onCreateSession}
            icon={<Plus className="min-h-4 min-w-4" />}
            className="w-full md:hidden"
          >
            Create new session
          </Button>
        )}

        {/* Sessions Grid */}
        <div className="mx-auto grid w-full max-w-7xl grid-cols-2 justify-center gap-2 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {/* Desktop: New Session Card (inside grid) */}
          {showNewSessionCard && (
            <CreateItemCard
              title="New Session"
              onClick={onCreateSession}
              className="hidden max-w-[340px] md:flex"
            />
          )}

          {/* Existing Sessions */}
          {sessions.map((session) => {
            const sessionId = session.id.toString();
            const loading = loadingStates[sessionId] || {};
            const isNewlyCreated = animatingId === sessionId;

            return (
              <SessionGridItem
                key={sessionId}
                session={session}
                loading={loading}
                className={cn(
                  isNewlyCreated && [
                    "!border-green-500",
                    "shadow-[0_0_20px_rgba(34,197,94,0.5)]",
                    "animate-pulse",
                  ],
                )}
                onSessionClick={handleSessionClick}
                onExportClick={handleExportClick}
                onCopy={handleCopyClick}
                onDeleteClick={handleDeleteClick}
              />
            );
          })}
        </div>
      </div>

      {/* Export Dialog */}
      <SessionExportDialog
        open={exportDialogState.isOpen}
        onOpenChange={closeExportDialog}
        agents={exportDialogState.agents}
        onExport={async (modelTierSelections, includeHistory) => {
          const { sessionId, title } = exportDialogState;
          if (sessionId) {
            await handleExportConfirm(
              sessionId,
              title,
              modelTierSelections,
              includeHistory,
            );
          }
        }}
      />

      {/* Copy Confirmation Dialog */}
      <ActionConfirm
        open={copyDialogState.isOpen}
        onOpenChange={closeCopyDialog}
        title="Copy session"
        description="Do you want to include chat history?"
        content={
          <Label className="flex flex-row items-center gap-2">
            <Checkbox
              checked={copyDialogState.includeChatHistory}
              onCheckedChange={toggleIncludeChatHistory}
            />
            <span className="text-sm font-normal">
              Include chat messages in the duplicated session
            </span>
          </Label>
        }
        confirmLabel="Copy"
        onConfirm={handleCopyConfirm}
      />

      {/* Delete Confirmation Dialog */}
      <ActionConfirm
        open={deleteDialogState.isOpen}
        onOpenChange={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Delete Session"
        description="This action cannot be undone. This will permanently delete the session and all its messages."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="destructive"
      />
    </>
  );
}
