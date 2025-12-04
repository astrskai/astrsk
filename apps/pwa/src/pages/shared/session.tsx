// @refresh reset - Force full reload on HMR to prevent DOM sync issues
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Route } from "@/routes/shared/session/$uuid";
import { useImportSessionFromCloud } from "@/entities/session/api/mutations";
import { sessionQueries, SessionListItem } from "@/entities/session/api";
import { Button, Loading } from "@/shared/ui";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import { useSessionStore } from "@/shared/stores/session-store";
import { SessionService } from "@/app/services/session-service";
import { CardService } from "@/app/services/card-service";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { logger } from "@/shared/lib";
import {
  PersonaSelectionDialog,
  type PersonaResult,
} from "@/features/character/ui/persona-selection-dialog";
import type { Session } from "@/entities/session/domain/session";

type ImportState = "loading" | "success" | "persona_selection" | "cloning" | "error";

// Timeout before showing "Go back" button (in ms)
// Sessions have many assets, so use a longer timeout
const LOADING_TIMEOUT = 30000;

export default function SharedSessionPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const selectSession = useSessionStore.use.selectSession();
  const { uuid } = Route.useParams();
  const [importState, setImportState] = useState<ImportState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showTimeoutButton, setShowTimeoutButton] = useState(false);

  // Store the imported session for cloning
  const [importedSession, setImportedSession] = useState<Session | null>(null);
  const [suggestedPersonaId, setSuggestedPersonaId] = useState<string | undefined>(undefined);

  // Guard against double execution (React Strict Mode runs effects twice)
  const importStartedRef = useRef(false);

  const importSessionMutation = useImportSessionFromCloud();

  // Show "Go back" button after timeout
  useEffect(() => {
    if (importState !== "loading") return;

    const timeoutId = setTimeout(() => {
      setShowTimeoutButton(true);
    }, LOADING_TIMEOUT);

    return () => clearTimeout(timeoutId);
  }, [importState]);

  useEffect(() => {
    if (!uuid) return;

    // Prevent duplicate imports (React Strict Mode protection)
    if (importStartedRef.current) {
      console.log("[SharedSessionPage] Import already started, skipping duplicate execution");
      return;
    }
    importStartedRef.current = true;

    console.log("[SharedSessionPage] Starting session import for:", uuid);

    const importSession = async () => {
      try {
        console.log("[SharedSessionPage] Calling importSessionMutation.mutateAsync");
        const session = await importSessionMutation.mutateAsync({
          sessionId: uuid,
        });

        console.log("[SharedSessionPage] Import successful:", session.id.toString());
        setImportedSession(session);

        // Get suggested persona from imported session
        const userCharacterCardId = session.props.userCharacterCardId;
        setSuggestedPersonaId(userCharacterCardId?.toString());

        toastSuccess(`Session "${session.title}" imported successfully`);

        // Show persona selection dialog
        setImportState("persona_selection");
      } catch (error) {
        console.error("[SharedSessionPage] Import failed:", error);
        setImportState("error");
        const message = error instanceof Error ? error.message : "Unknown error occurred";
        setErrorMessage(message);
        toastError("Failed to import session", { description: message });
      }
    };

    importSession();
  }, [uuid]);

  /**
   * Clone the imported session and navigate to play
   */
  const cloneAndPlaySession = useCallback(
    async (personaResult: PersonaResult | null) => {
      if (!importedSession) return;

      setImportState("cloning");

      try {
        // Clone the session (without chat history since it's a fresh play)
        const clonedSessionOrError = await SessionService.cloneSession.execute({
          sessionId: importedSession.id,
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

        // Set isPlaySession: true, keep original title, and update userCharacterCardId
        const originalTitle = importedSession.props.title;
        clonedSession.update({
          isPlaySession: true,
          title: originalTitle,
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
            messageCount: 0,
            updatedAt: new Date(),
          };
          return [newItem, ...(oldData || [])];
        });

        setImportState("success");

        // Select and navigate to the cloned session
        selectSession(clonedSession.id, clonedSession.props.title);
        navigate({
          to: "/sessions/$sessionId",
          params: { sessionId: clonedSession.id.toString() },
          replace: true,
        });
      } catch (error) {
        logger.error("Failed to start play session:", error);
        setImportState("error");
        const message = error instanceof Error ? error.message : "Unknown error";
        setErrorMessage(message);
        toastError("Failed to start play session", { description: message });
      }
    },
    [importedSession, queryClient, selectSession, navigate],
  );

  /**
   * Handle persona selection confirmation
   */
  const handlePersonaConfirm = useCallback(
    (personaResult: PersonaResult | null) => {
      cloneAndPlaySession(personaResult);
    },
    [cloneAndPlaySession],
  );

  /**
   * Handle persona dialog close (user cancelled)
   */
  const handlePersonaDialogClose = useCallback(
    (open: boolean) => {
      if (!open) {
        // User cancelled - navigate to sessions list
        navigate({ to: "/sessions", replace: true });
      }
    },
    [navigate],
  );

  const handleRetry = () => {
    setImportState("loading");
    setErrorMessage("");
    importStartedRef.current = false;
    importSessionMutation.mutate(
      { sessionId: uuid },
      {
        onSuccess: (session) => {
          setImportedSession(session);
          setSuggestedPersonaId(session.props.userCharacterCardId?.toString());
          toastSuccess(`Session "${session.title}" imported successfully`);
          setImportState("persona_selection");
        },
        onError: (error) => {
          setImportState("error");
          const message = error instanceof Error ? error.message : "Unknown error occurred";
          setErrorMessage(message);
          toastError("Failed to import session", { description: message });
        },
      },
    );
  };

  const handleGoToSessions = () => {
    navigate({ to: "/sessions" });
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-8">
        {importState === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <Loading size="lg" />
            <p className="text-fg-muted text-lg">Importing shared session...</p>
            <p className="text-fg-subtle text-sm">
              This may take a moment while we download all assets.
            </p>
            {showTimeoutButton && (
              <>
                <p className="text-fg-warning text-sm">
                  This is taking unusually long.
                </p>
                <Button onClick={handleGoToSessions} variant="outline">
                  Go back to sessions
                </Button>
              </>
            )}
          </div>
        )}

        {importState === "cloning" && (
          <div className="flex flex-col items-center gap-4">
            <Loading size="lg" />
            <p className="text-fg-muted text-lg">Starting your session...</p>
          </div>
        )}

        {importState === "success" && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-fg-default text-lg font-semibold">
              Session ready!
            </p>
            <p className="text-fg-muted text-sm">Redirecting to your session...</p>
          </div>
        )}

        {importState === "error" && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-fg-default text-lg font-semibold">
              Failed to import session
            </p>
            <p className="text-fg-muted max-w-md text-center text-sm">
              {errorMessage}
            </p>
            <div className="flex gap-3">
              <Button onClick={handleRetry} variant="outline">
                Try again
              </Button>
              <Button onClick={handleGoToSessions}>Go to sessions</Button>
            </div>
          </div>
        )}
      </div>

      {/* Persona Selection Dialog - shown after import success */}
      <PersonaSelectionDialog
        open={importState === "persona_selection"}
        onOpenChange={handlePersonaDialogClose}
        onConfirm={handlePersonaConfirm}
        allowSkip={true}
        suggestedPersonaId={suggestedPersonaId}
      />
    </div>
  );
}
