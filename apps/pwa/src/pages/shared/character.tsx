// @refresh reset - Force full reload on HMR to prevent DOM sync issues
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Route } from "@/routes/shared/character/$uuid";
import { useImportCharacterFromCloud } from "@/entities/card/api/mutations";
import { Button, Loading } from "@/shared/ui";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import type { CharacterCard } from "@/entities/card/domain";

type ImportState = "loading" | "error";

// Timeout before showing "Go back" button (in ms)
const LOADING_TIMEOUT = 10000;

export default function SharedCharacterPage() {
  const navigate = useNavigate();
  const { uuid } = Route.useParams();
  const [importState, setImportState] = useState<ImportState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showTimeoutButton, setShowTimeoutButton] = useState(false);

  // Guard against double execution (React Strict Mode runs effects twice)
  const importStartedRef = useRef(false);

  const importCharacterMutation = useImportCharacterFromCloud();

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

    const importCharacter = async () => {
      try {
        // Wait a moment to ensure services are fully initialized
        // This prevents "Cannot read properties of undefined (reading 'execute')" errors
        await new Promise(resolve => setTimeout(resolve, 500));

        const result = await importCharacterMutation.mutateAsync({
          characterId: uuid,
        });

        toastSuccess("Session created!", {
          description: `Started a chat with ${result.characterTitle}`,
        });

        // Navigate to session chat page
        navigate({
          to: "/sessions/$sessionId",
          params: { sessionId: result.sessionId },
          replace: true,
        });
      } catch (error) {
        setImportState("error");
        const message = error instanceof Error ? error.message : "Unknown error occurred";
        setErrorMessage(message);
        toastError("Failed to import character", { description: message });
      }
    };

    importCharacter();
  }, [uuid, importCharacterMutation, navigate]);

  const handleRetry = async () => {
    setImportState("loading");
    setErrorMessage("");

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

  const handleGoToCharacters = () => {
    navigate({ to: "/assets/characters" });
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-8">
        {importState === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <Loading size="lg" />
            <p className="text-fg-muted text-lg">Importing shared character...</p>
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
          <div className="flex flex-col items-center gap-4">
            <p className="text-fg-default text-lg font-semibold">
              Failed to import character
            </p>
            <p className="text-fg-muted max-w-md text-center text-sm">
              {errorMessage}
            </p>
            <div className="flex gap-3">
              <Button onClick={handleRetry} variant="outline">
                Try again
              </Button>
              <Button onClick={handleGoToCharacters}>Go to characters</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
