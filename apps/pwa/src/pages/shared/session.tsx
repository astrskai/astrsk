// @refresh reset - Force full reload on HMR to prevent DOM sync issues
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Route } from "@/routes/shared/session/$uuid";
import { useImportSessionFromCloud } from "@/entities/session/api/mutations";
import { Button, Loading } from "@/shared/ui";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import { useSessionStore } from "@/shared/stores/session-store";

type ImportState = "loading" | "error";

// Timeout before showing "Go back" button (in ms)
// Sessions have many assets, so use a longer timeout
const LOADING_TIMEOUT = 30000;

export default function SharedSessionPage() {
  const navigate = useNavigate();
  const selectSession = useSessionStore.use.selectSession();
  const { uuid } = Route.useParams();
  const [importState, setImportState] = useState<ImportState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showTimeoutButton, setShowTimeoutButton] = useState(false);

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
      return;
    }
    importStartedRef.current = true;

    const importSession = async () => {
      try {
        const session = await importSessionMutation.mutateAsync({
          sessionId: uuid,
        });

        toastSuccess(`Session "${session.name}" imported successfully`);

        // Navigate to session settings page (template view)
        selectSession(session.id, session.props.name);
        navigate({
          to: "/sessions/settings/$sessionId",
          params: { sessionId: session.id.toString() },
          replace: true,
        });
      } catch (error) {
        setImportState("error");
        const message = error instanceof Error ? error.message : "Unknown error occurred";
        setErrorMessage(message);
        toastError("Failed to import session", { description: message });
      }
    };

    importSession();
  }, [uuid, importSessionMutation, selectSession, navigate]);

  const handleRetry = () => {
    setImportState("loading");
    setErrorMessage("");
    importStartedRef.current = false;
    importSessionMutation.mutate(
      { sessionId: uuid },
      {
        onSuccess: (session) => {
          toastSuccess(`Session "${session.name}" imported successfully`);
          selectSession(session.id, session.props.name);
          navigate({
            to: "/sessions/settings/$sessionId",
            params: { sessionId: session.id.toString() },
            replace: true,
          });
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
    </div>
  );
}
