// @refresh reset - Force full reload on HMR to prevent DOM sync issues
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Route } from "@/routes/shared/session/$uuid";
import { useImportSessionFromCloud } from "@/entities/session/api/mutations";
import { Button, Loading } from "@/shared/ui";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import { useSessionStore } from "@/shared/stores/session-store";
import { fetchSessionFromCloud, type SessionCloudBundle } from "@/shared/lib/cloud-download-helpers";
import { SharedWelcome } from "./shared-welcome";
import { SessionService } from "@/app/services/session-service";
import { useQueryClient } from "@tanstack/react-query";
import { sessionQueries } from "@/entities/session/api/query-factory";

type ImportState = "welcome" | "fetching" | "importing" | "error";

// Timeout before showing "Go back" button (in ms)
// Sessions have many assets, so use a longer timeout
const LOADING_TIMEOUT = 30000;

export default function SharedSessionPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const selectSession = useSessionStore.use.selectSession();
  const { uuid } = Route.useParams();
  const [importState, setImportState] = useState<ImportState>("welcome");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showTimeoutButton, setShowTimeoutButton] = useState(false);
  const [sessionData, setSessionData] = useState<SessionCloudBundle | null>(null);

  // Guard against double execution (React Strict Mode runs effects twice)
  const fetchStartedRef = useRef(false);

  const importSessionMutation = useImportSessionFromCloud();

  // Show "Go back" button after timeout
  useEffect(() => {
    if (importState !== "importing") return;

    const timeoutId = setTimeout(() => {
      setShowTimeoutButton(true);
    }, LOADING_TIMEOUT);

    return () => clearTimeout(timeoutId);
  }, [importState]);

  // Fetch session metadata immediately on mount (in background while showing welcome)
  useEffect(() => {
    if (!uuid) return;

    // Prevent duplicate fetches (React Strict Mode protection)
    if (fetchStartedRef.current) {
      return;
    }
    fetchStartedRef.current = true;

    const fetchSessionMetadata = async () => {
      try {
        // Fetch immediately - no waiting for service initialization
        // This is just a cloud API call, doesn't need services
        const result = await fetchSessionFromCloud(uuid);

        if (result.isFailure) {
          throw new Error(result.getError());
        }

        const bundle = result.getValue();
        setSessionData(bundle);
        // Don't change state - keep showing welcome until user clicks Enter
      } catch (error) {
        setImportState("error");
        const message = error instanceof Error ? error.message : "Unknown error occurred";
        setErrorMessage(message);
        toastError("Failed to fetch session", { description: message });
      }
    };

    fetchSessionMetadata();
  }, [uuid]);

  // Auto-transition from fetching to importing when data loads
  useEffect(() => {
    if (importState === "fetching" && sessionData) {
      handleConfirmImport();
    }
  }, [importState, sessionData]);

  const handleConfirmImport = async () => {
    setImportState("importing");
    setErrorMessage("");
    setShowTimeoutButton(false);

    // Wait a moment to ensure services are fully initialized
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 1: Import as template session (isPlaySession: false)
    importSessionMutation.mutate(
      { sessionId: uuid, isPlaySession: false },
      {
        onSuccess: async (templateSession) => {
          console.log("[SharedSession] Template session imported:", {
            id: templateSession.id.toString(),
            name: templateSession.props.name,
            isPlaySession: templateSession.props.isPlaySession,
          });

          // Step 2: Clone the template to create a play session
          const clonedPlaySessionResult = await SessionService.clonePlaySession.execute({
            sessionId: templateSession.id,
            includeHistory: false,
          });

          if (clonedPlaySessionResult.isFailure) {
            setImportState("error");
            const message = clonedPlaySessionResult.getError();
            setErrorMessage(message);
            toastError("Failed to create play session", { description: message });
            return;
          }

          const playSession = clonedPlaySessionResult.getValue();

          console.log("[SharedSession] Play session cloned:", {
            id: playSession.id.toString(),
            name: playSession.props.name,
            isPlaySession: playSession.props.isPlaySession,
          });

          // Manually invalidate cache after cloning (SessionService.clonePlaySession doesn't use mutation hook)
          queryClient.invalidateQueries({
            queryKey: sessionQueries.lists(),
          });

          console.log("[SharedSession] Cache invalidated for session lists");

          toastSuccess("Session started!", {
            description: `Started a chat in ${playSession.props.name}`,
          });
          selectSession(playSession.id, playSession.props.name);
          navigate({
            to: "/sessions/$sessionId",
            params: { sessionId: playSession.id.toString() },
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

  const handleRetry = async () => {
    setImportState("fetching");
    setErrorMessage("");
    fetchStartedRef.current = false;

    // Retry fetching metadata
    const result = await fetchSessionFromCloud(uuid);

    if (result.isFailure) {
      setImportState("error");
      const message = result.getError();
      setErrorMessage(message);
      toastError("Failed to fetch session", { description: message });
      return;
    }

    const bundle = result.getValue();
    setSessionData(bundle);
    // Auto-import will be triggered by the useEffect
  };

  const handleGoToSessions = () => {
    navigate({ to: "/sessions" });
  };

  const handleEnterAstrsk = () => {
    // If data is already loaded, start importing immediately
    // Otherwise show fetching state first
    if (sessionData) {
      handleConfirmImport();
    } else {
      setImportState("fetching");
    }
  };

  return (
    <>
      {importState === "welcome" && <SharedWelcome onEnter={handleEnterAstrsk} />}

      {importState !== "welcome" && (
        <div className="flex h-screen items-center justify-center bg-bg-subtle">
          <div className="flex flex-col items-center justify-center gap-8 px-4">
            {importState === "fetching" && (
              <div className="flex flex-col items-center gap-4">
                <Loading size="lg" />
                <p className="text-fg-muted text-lg">Loading session details...</p>
                <p className="text-fg-subtle text-sm">
                  Please wait while we fetch the session information.
                </p>
              </div>
            )}

            {importState === "importing" && (
              <div className="flex flex-col items-center gap-4">
                <Loading size="lg" />
                <p className="text-fg-muted text-lg">Importing session...</p>
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
              <div className="bg-bg-default border-border-default flex max-w-md flex-col items-center gap-4 rounded-lg border p-8 shadow-lg">
                <p className="text-fg-default text-lg font-semibold">
                  Failed to load session
                </p>
                <p className="text-fg-muted text-center text-sm">
                  {errorMessage}
                </p>
                <div className="flex w-full gap-3">
                  <Button onClick={handleRetry} variant="outline" className="flex-1">
                    Try again
                  </Button>
                  <Button onClick={handleGoToSessions} className="flex-1">
                    Go to sessions
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
