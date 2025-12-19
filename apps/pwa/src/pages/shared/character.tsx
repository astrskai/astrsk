// @refresh reset - Force full reload on HMR to prevent DOM sync issues
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Route } from "@/routes/shared/character/$uuid";
import { useImportCharacterFromCloud } from "@/entities/card/api/mutations";
import { Button, Loading } from "@/shared/ui";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import { fetchCharacterFromCloud, type CharacterCloudData } from "@/shared/lib/cloud-download-helpers";
import { SharedWelcome } from "./shared-welcome";

type ImportState = "welcome" | "fetching" | "importing" | "error";

// Timeout before showing "Go back" button (in ms)
const LOADING_TIMEOUT = 10000;

export default function SharedCharacterPage() {
  const navigate = useNavigate();
  const { uuid } = Route.useParams();
  const [importState, setImportState] = useState<ImportState>("welcome");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showTimeoutButton, setShowTimeoutButton] = useState(false);
  const [characterData, setCharacterData] = useState<CharacterCloudData | null>(null);

  // Guard against double execution (React Strict Mode runs effects twice)
  const fetchStartedRef = useRef(false);

  const importCharacterMutation = useImportCharacterFromCloud();

  // Show "Go back" button after timeout
  useEffect(() => {
    if (importState !== "importing") return;

    const timeoutId = setTimeout(() => {
      setShowTimeoutButton(true);
    }, LOADING_TIMEOUT);

    return () => clearTimeout(timeoutId);
  }, [importState]);

  // Fetch character metadata immediately on mount (in background while showing welcome)
  useEffect(() => {
    if (!uuid) return;

    // Prevent duplicate fetches (React Strict Mode protection)
    if (fetchStartedRef.current) {
      return;
    }
    fetchStartedRef.current = true;

    const fetchCharacterMetadata = async () => {
      try {
        // Fetch immediately - no waiting for service initialization
        // This is just a cloud API call, doesn't need services
        const result = await fetchCharacterFromCloud(uuid);

        if (result.isFailure) {
          throw new Error(result.getError());
        }

        const character = result.getValue();
        setCharacterData(character);
        // Don't change state - keep showing welcome until user clicks Enter
      } catch (error) {
        setImportState("error");
        const message = error instanceof Error ? error.message : "Unknown error occurred";
        setErrorMessage(message);
        toastError("Failed to fetch character", { description: message });
      }
    };

    fetchCharacterMetadata();
  }, [uuid]);

  // Auto-transition from fetching to importing when data loads
  useEffect(() => {
    if (importState === "fetching" && characterData) {
      handleConfirmImport();
    }
  }, [importState, characterData]);

  const handleConfirmImport = async () => {
    setImportState("importing");
    setErrorMessage("");
    setShowTimeoutButton(false);

    // Wait a moment to ensure services are fully initialized
    await new Promise(resolve => setTimeout(resolve, 500));

    importCharacterMutation.mutate(
      { characterId: uuid },
      {
        onSuccess: (result) => {
          toastSuccess("Session created!", {
            description: `Started a chat with ${result.characterTitle}`,
          });
          navigate({
            to: "/sessions/$sessionId",
            params: { sessionId: result.sessionId },
            replace: true,
          });
        },
        onError: (error) => {
          setImportState("error");
          const message = error instanceof Error ? error.message : "Unknown error occurred";
          setErrorMessage(message);
          toastError("Failed to import character", { description: message });
        },
      },
    );
  };

  const handleRetry = async () => {
    setImportState("fetching");
    setErrorMessage("");
    fetchStartedRef.current = false;

    // Retry fetching metadata
    const result = await fetchCharacterFromCloud(uuid);

    if (result.isFailure) {
      setImportState("error");
      const message = result.getError();
      setErrorMessage(message);
      toastError("Failed to fetch character", { description: message });
      return;
    }

    const character = result.getValue();
    setCharacterData(character);
    // Auto-import will be triggered by the useEffect
  };

  const handleGoToCharacters = () => {
    navigate({ to: "/assets/characters" });
  };

  const handleEnterAstrsk = () => {
    // If data is already loaded, start importing immediately
    // Otherwise show fetching state first
    if (characterData) {
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
                <p className="text-fg-muted text-lg">Loading character details...</p>
                <p className="text-fg-subtle text-sm">
                  Please wait while we fetch the character information.
                </p>
              </div>
            )}

            {importState === "importing" && (
              <div className="flex flex-col items-center gap-4">
                <Loading size="lg" />
                <p className="text-fg-muted text-lg">Importing character...</p>
                <p className="text-fg-subtle text-sm">
                  This may take a moment while we download the assets.
                </p>
                {showTimeoutButton && (
                  <>
                    <p className="text-fg-warning text-sm">
                      This is taking unusually long.
                    </p>
                    <Button onClick={handleGoToCharacters} variant="outline">
                      Go back to characters
                    </Button>
                  </>
                )}
              </div>
            )}

            {importState === "error" && (
              <div className="bg-bg-default border-border-default flex max-w-md flex-col items-center gap-4 rounded-lg border p-8 shadow-lg">
                <p className="text-fg-default text-lg font-semibold">
                  Failed to load character
                </p>
                <p className="text-fg-muted text-center text-sm">
                  {errorMessage}
                </p>
                <div className="flex w-full gap-3">
                  <Button onClick={handleRetry} variant="outline" className="flex-1">
                    Try again
                  </Button>
                  <Button onClick={handleGoToCharacters} className="flex-1">
                    Go to characters
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
