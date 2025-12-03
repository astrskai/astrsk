import { Upload, Copy, Trash2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Session } from "@/entities/session/domain/session";
import { IconHarpyLogo } from "@/shared/assets/icons";
import type {
  SessionWithCharacterMetadata,
  CharacterMetadata,
} from "@/entities/session/api";
import { sessionQueries, SessionListItem } from "@/entities/session/api";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { DialogConfirm } from "@/shared/ui/dialogs";
import { Checkbox, Label, Loading } from "@/shared/ui";

import SessionCard from "@/features/session/ui/session-card";
import type { CardAction } from "@/features/common/ui";
import { useSessionActions } from "@/features/session/model/use-session-actions";
import { useNewItemAnimation } from "@/shared/hooks/use-new-item-animation";
import { SessionExportDialog } from "@/features/session/ui/session-export-dialog";
import { useSessionStore } from "@/shared/stores/session-store";
import { useAsset } from "@/shared/hooks/use-asset";
import { cn, logger } from "@/shared/lib";
import { SessionService } from "@/app/services/session-service";
import { CardService } from "@/app/services/card-service";
import { toastError } from "@/shared/ui/toast";
import {
  PersonaSelectionDialog,
  type PersonaResult,
} from "@/features/character/ui/persona-selection-dialog";

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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const selectSession = useSessionStore.use.selectSession();
  const { animatingId, triggerAnimation } = useNewItemAnimation();
  const [isCloning, setIsCloning] = useState<string | null>(null);

  // Persona selection dialog state
  const [isPersonaDialogOpen, setIsPersonaDialogOpen] = useState(false);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [suggestedPersonaId, setSuggestedPersonaId] = useState<
    string | undefined
  >(undefined);

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

  /**
   * Handle session click - if session has userCharacterCardId, show persona dialog
   * Otherwise, clone and play directly
   */
  const handleSessionClick = (sessionId: string) => {
    const item = sessions.find((s) => s.session.id.toString() === sessionId);
    if (!item) return;

    const userCharacterCardId = item.session.props.userCharacterCardId;

    if (userCharacterCardId) {
      // Session has a user character - show persona selection dialog
      setPendingSessionId(sessionId);
      setSuggestedPersonaId(userCharacterCardId.toString());
      setIsPersonaDialogOpen(true);
    } else {
      // No user character - clone and play directly
      cloneAndPlaySession(sessionId, null);
    }
  };

  /**
   * Clone the session and navigate to cloned session for play
   * This preserves the original session as a "template" and creates a play session
   */
  const cloneAndPlaySession = useCallback(
    async (sessionId: string, personaResult: PersonaResult | null) => {
      const item = sessions.find((s) => s.session.id.toString() === sessionId);
      if (!item) return;

      setIsCloning(sessionId);

      try {
        // Clone the session (without chat history since it's a fresh play)
        const clonedSessionOrError = await SessionService.cloneSession.execute({
          sessionId: new UniqueEntityID(sessionId),
          includeHistory: false,
        });

        if (clonedSessionOrError.isFailure) {
          throw new Error(clonedSessionOrError.getError());
        }

        const clonedSession = clonedSessionOrError.getValue();
        const clonedSessionId = clonedSession.id;

        // Handle persona selection
        let userCharacterCardId: UniqueEntityID | undefined;
        if (personaResult?.type === "existing" && personaResult.characterId) {
          // Clone the persona card into the session
          const personaCloneResult = await CardService.cloneCard.execute({
            cardId: new UniqueEntityID(personaResult.characterId),
            sessionId: clonedSessionId,
          });

          if (personaCloneResult.isFailure) {
            throw new Error("Could not copy persona for session.");
          }

          userCharacterCardId = personaCloneResult.getValue().id;
        }

        // Set isPlaySession: true, fix title, and update userCharacterCardId
        const originalTitle = item.session.props.title;
        clonedSession.update({
          isPlaySession: true,
          title: originalTitle, // Use original title, not "Copy of..."
          userCharacterCardId,
        });

        // Save the updated session
        const saveResult = await SessionService.saveSession.execute({
          session: clonedSession,
        });
        if (saveResult.isFailure) {
          throw new Error(saveResult.getError());
        }

        // Optimistically update the sidebar list by adding the new session at the top
        const listItemQueryKey = sessionQueries.listItem({
          isPlaySession: true,
        }).queryKey;
        queryClient.setQueryData<SessionListItem[]>(listItemQueryKey, (oldData) => {
          const newItem: SessionListItem = {
            id: clonedSession.id.toString(),
            title: clonedSession.props.title,
            messageCount: 0, // New cloned session has no messages
            updatedAt: new Date(),
          };
          // Add new item at the top (sorted by updatedAt desc)
          return [newItem, ...(oldData || [])];
        });

        // Select and navigate to the cloned session
        selectSession(clonedSession.id, clonedSession.props.title);
        navigate({
          to: "/sessions/$sessionId",
          params: { sessionId: clonedSession.id.toString() },
        });
      } catch (error) {
        logger.error("Failed to start play session:", error);
        toastError("Failed to start play session", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setIsCloning(null);
      }
    },
    [sessions, queryClient, selectSession, navigate],
  );

  /**
   * Handle persona selection confirmation
   */
  const handlePersonaConfirm = useCallback(
    (personaResult: PersonaResult | null) => {
      if (pendingSessionId) {
        cloneAndPlaySession(pendingSessionId, personaResult);
        setPendingSessionId(null);
        setSuggestedPersonaId(undefined);
      }
    },
    [pendingSessionId, cloneAndPlaySession],
  );

  return (
    <>
      {/* Sessions Grid - Uses auto-fill with minmax to ensure stable card sizes */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
        {sessions.map(({ session, characterAvatars }) => {
          const sessionId = session.id.toString();
          const loading = loadingStates[sessionId] || {};
          const isNewlyCreated = animatingId === sessionId;
          const isCloningThis = isCloning === sessionId;

          return (
            <div key={sessionId} className="relative">
              {isCloningThis && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/60">
                  <Loading />
                </div>
              )}
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
                  isCloningThis && "opacity-50",
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

      {/* Persona Selection Dialog */}
      <PersonaSelectionDialog
        open={isPersonaDialogOpen}
        onOpenChange={setIsPersonaDialogOpen}
        onConfirm={handlePersonaConfirm}
        allowSkip={true}
        suggestedPersonaId={suggestedPersonaId}
      />
    </>
  );
}
