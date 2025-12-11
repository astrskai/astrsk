import { Upload, Copy, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

import { Session } from "@/entities/session/domain/session";

import { IconHarpyLogo } from "@/shared/assets/icons";
import type {
  SessionWithCharacterMetadata,
  CharacterMetadata,
} from "@/entities/session/api";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { DialogConfirm } from "@/shared/ui/dialogs";

import SessionCard from "@/features/session/ui/session-card";
import type { CardAction } from "@/features/common/ui";
import { useSessionActions } from "@/features/session/model/use-session-actions";
import { useNewItemAnimation } from "@/shared/hooks/use-new-item-animation";
import { SessionExportDialog } from "@/features/session/ui/session-export-dialog";
import { useAsset } from "@/shared/hooks/use-asset";
import { cn } from "@/shared/lib";


interface SessionsGridProps {
  sessions: SessionWithCharacterMetadata[];
  newlyCreatedSessionId?: string | null;
  areCharactersLoading?: boolean;
}

/**
 * Session Grid Item
 * Wrapper component for SessionCard with actions
 */
interface SessionGridItemProps {
  session: Session;
  characterAvatars: CharacterMetadata[];
  loading: { exporting?: boolean; copying?: boolean; deleting?: boolean };
  className?: string;
  areCharactersLoading?: boolean;
  onSessionClick: (sessionId: string) => void;
  onExportClick: (
    sessionId: string,
    title: string,
    flowId: UniqueEntityID | undefined,
    exportType?: "file" | "cloud",
  ) => (e: React.MouseEvent) => void;
  onCopy: (sessionId: string, title: string) => (e: React.MouseEvent) => void;
  onDeleteClick: (
    sessionId: string,
    title: string,
  ) => (e: React.MouseEvent) => void;
}

function SessionGridItem({
  session,
  characterAvatars,
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

  // Check if session is generating workflow
  const isGenerating = session.config?.generationStatus === "generating";

  // Simple validation: check if session has AI character cards
  // Avoid expensive per-card queries (useSessionValidation with nested flow queries)
  // TODO: Disabled validation - no validation needed atm
  // const isInvalid = session.aiCharacterCardIds.length === 0;
  const isInvalid = false;

  const actions: CardAction[] = [
    {
      icon: Upload,
      label: "Export",
      onClick: onExportClick(sessionId, session.props.title, session.flowId, "file"),
      disabled: loading.exporting,
      loading: loading.exporting,
    },
    {
      icon: IconHarpyLogo,
      label: "Harpy",
      onClick: onExportClick(sessionId, session.props.title, session.flowId, "cloud"),
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
      isGenerating={isGenerating}
    />
  );
}

/**
 * Sessions grid component
 * Displays session cards in a responsive grid
 *
 * Layout:
 * - Mobile (sm): 1 column
 * - Tablet (md): 2 columns
 * - Desktop (lg): 3 columns
 * - Large Desktop (xl): 4 columns
 */
export function SessionsGrid({
  sessions,
  newlyCreatedSessionId = null,
  areCharactersLoading = false,
}: SessionsGridProps) {
  const { animatingId, triggerAnimation } = useNewItemAnimation();
  const navigate = useNavigate();

  const {
    loadingStates,
    deleteDialogState,
    exportDialogState,
    handleExportClick,
    handleExportConfirm,
    handleCopyClick,
    handleDeleteClick,
    handleDeleteConfirm,
    closeDeleteDialog,
    closeExportDialog,
  } = useSessionActions({
    onCopySuccess: (sessionId) => triggerAnimation(sessionId),
  });

  // Track newly created session from parent
  useEffect(() => {
    if (newlyCreatedSessionId) {
      triggerAnimation(newlyCreatedSessionId);
    }
  }, [newlyCreatedSessionId, triggerAnimation]);

  /**
   * Handle session click - navigate to settings page
   */
  const handleSessionClick = (sessionId: string) => {
    navigate({
      to: "/sessions/settings/$sessionId",
      params: { sessionId },
    });
  };




  return (
    <>
      {/* Sessions Grid - Uses auto-fill with minmax to ensure stable card sizes */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
        {sessions.map(({ session, characterAvatars }) => {
          const sessionId = session.id.toString();
          const loading = loadingStates[sessionId] || {};
          const isNewlyCreated = animatingId === sessionId;

          return (
            <div key={sessionId} className="relative">
              <SessionGridItem
                session={session}
                characterAvatars={characterAvatars}
                loading={loading}
                className={cn(
                  isNewlyCreated && [
                    "border-green-500!",
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
            </div>
          );
        })}
      </div>

      {/* Export Dialog */}
      <SessionExportDialog
        open={exportDialogState.isOpen}
        onOpenChange={closeExportDialog}
        exportType={exportDialogState.exportType}
        onExport={handleExportConfirm}
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
