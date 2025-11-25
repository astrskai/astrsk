import { Upload, Copy, Trash2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { Session } from "@/entities/session/domain/session";
import type { SessionWithCharacterMetadata } from "@/entities/session/api";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { DialogConfirm } from "@/shared/ui/dialogs";
import { Checkbox, Label } from "@/shared/ui";

import SessionCard from "@/features/session/ui/session-card";
import type { CardAction } from "@/features/common/ui";
import { useSessionActions } from "@/features/session/model/use-session-actions";
import { useNewItemAnimation } from "@/shared/hooks/use-new-item-animation";
import { SessionExportDialog } from "../dialog/session-export-dialog";
import { useSessionStore } from "@/shared/stores/session-store";
import { useAsset } from "@/shared/hooks/use-asset";
import { cn } from "@/shared/lib";

interface SessionsGridV2Props {
  sessions: Session[];
  newlyCreatedSessionId?: string | null;
  areCharactersLoading?: boolean;
}

/**
 * Session Grid Item
 * Wrapper component for SessionCard with actions
 */
interface SessionGridItemProps {
  session: Session;
  loading: { exporting?: boolean; copying?: boolean; deleting?: boolean };
  className?: string;
  areCharactersLoading?: boolean;
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
  areCharactersLoading,
  onSessionClick,
  onExportClick,
  onCopy,
  onDeleteClick,
}: SessionGridItemProps) {
  const sessionId = session.id.toString();
  const messageCount = session.props.turnIds.length;

  // Get session background image
  const coverId = session.props.coverId;
  const [coverImageUrl] = useAsset(coverId);

  // Simple validation: check if session has AI character cards
  // Avoid expensive per-card queries (useSessionValidation with nested flow queries)
  const isInvalid = session.aiCharacterCardIds.length === 0;

  // Character avatars are provided by useSessionsWithCharacterMetadata hook
  // The session object is enriched with characterAvatars by the hook
  const characterAvatars =
    (session as SessionWithCharacterMetadata).characterAvatars || [];

  const actions: CardAction[] = [
    {
      icon: Upload,
      label: "Export",
      onClick: onExportClick(sessionId, session.props.title, session.flowId),
      disabled: loading.exporting,
      loading: loading.exporting,
    },
    {
      icon: Copy,
      label: "Copy",
      onClick: onCopy(sessionId, session.props.title),
      disabled: loading.copying,
      loading: loading.copying,
    },
    {
      icon: Trash2,
      label: "Delete",
      onClick: onDeleteClick(sessionId, session.props.title),
      disabled: loading.deleting,
      loading: loading.deleting,
      className: "text-red-400 hover:text-red-300",
    },
  ];

  return (
    <SessionCard
      title={session.props.title || "Untitled Session"}
      imageUrl={coverImageUrl}
      messageCount={messageCount}
      isInvalid={isInvalid}
      onClick={() => onSessionClick(sessionId)}
      actions={actions}
      className={className}
      characterAvatars={characterAvatars}
      areCharactersLoading={areCharactersLoading}
    />
  );
}

/**
 * Sessions grid component v2
 * Displays session cards in a responsive grid
 *
 * Layout:
 * - Mobile (sm): 1 column
 * - Tablet (md): 2 columns
 * - Desktop (lg): 3 columns
 * - Large Desktop (xl): 4 columns
 */
export function SessionsGridV2({
  sessions,
  newlyCreatedSessionId = null,
  areCharactersLoading = false,
}: SessionsGridV2Props) {
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
      {/* Sessions Grid - Uses auto-fill with minmax to ensure stable card sizes */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
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
              areCharactersLoading={areCharactersLoading}
              onSessionClick={handleSessionClick}
              onExportClick={handleExportClick}
              onCopy={handleCopyClick}
              onDeleteClick={handleDeleteClick}
            />
          );
        })}
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
      <DialogConfirm
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
      <DialogConfirm
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
