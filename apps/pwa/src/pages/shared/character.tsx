import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Route } from "@/routes/shared/character/$uuid";
import { useImportCharacterFromCloud } from "@/entities/card/api/mutations";
import { Button, Loading } from "@/shared/ui";
import { toastError, toastSuccess } from "@/shared/ui/toast";

type ImportState = "loading" | "success" | "error";

// Delay before redirect to allow viewing logs (in ms)
const REDIRECT_DELAY = 3000;
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
      console.log("[SharedCharacterPage] Import already started, skipping duplicate execution");
      return;
    }
    importStartedRef.current = true;

    console.log("[SharedCharacterPage] Starting character import for:", uuid);

    const importCharacter = async () => {
      try {
        console.log("[SharedCharacterPage] Calling importCharacterMutation.mutateAsync");
        const character = await importCharacterMutation.mutateAsync({
          characterId: uuid,
        });

        console.log("[SharedCharacterPage] Import successful:", character.id.toString());
        setImportState("success");
        toastSuccess(`Character "${character.props.title}" imported successfully`);

        // Navigate to the imported character (delayed for log viewing)
        console.log(`[SharedCharacterPage] Redirecting in ${REDIRECT_DELAY}ms...`);
        setTimeout(() => {
          console.log("[SharedCharacterPage] Navigating to character page");
          navigate({
            to: "/assets/characters/{-$characterId}",
            params: { characterId: character.id.toString() },
            replace: true,
          });
        }, REDIRECT_DELAY);
      } catch (error) {
        console.error("[SharedCharacterPage] Import failed:", error);
        setImportState("error");
        const message = error instanceof Error ? error.message : "Unknown error occurred";
        setErrorMessage(message);
        toastError("Failed to import character", { description: message });
      }
    };

    importCharacter();
  }, [uuid]);

  const handleRetry = () => {
    setImportState("loading");
    setErrorMessage("");
    importCharacterMutation.mutate({ characterId: uuid });
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

        {importState === "success" && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-fg-default text-lg font-semibold">
              Character imported successfully!
            </p>
            <p className="text-fg-muted text-sm">Redirecting to your character...</p>
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
