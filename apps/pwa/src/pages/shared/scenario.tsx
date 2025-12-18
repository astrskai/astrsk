import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Route } from "@/routes/shared/scenario/$uuid";
import { useImportScenarioFromCloud } from "@/entities/card/api/mutations";
import { Button, Loading } from "@/shared/ui";
import { toastError, toastSuccess } from "@/shared/ui/toast";

type ImportState = "loading" | "success" | "error";

// Delay before redirect to allow viewing logs (in ms)
const REDIRECT_DELAY = 3000;
// Timeout before showing "Go back" button (in ms)
const LOADING_TIMEOUT = 10000;

export default function SharedScenarioPage() {
  const navigate = useNavigate();
  const { uuid } = Route.useParams();
  const [importState, setImportState] = useState<ImportState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showTimeoutButton, setShowTimeoutButton] = useState(false);

  // Guard against double execution (React Strict Mode runs effects twice)
  const importStartedRef = useRef(false);

  const importScenarioMutation = useImportScenarioFromCloud();

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
      console.log("[SharedScenarioPage] Import already started, skipping duplicate execution");
      return;
    }
    importStartedRef.current = true;

    console.log("[SharedScenarioPage] Starting scenario import for:", uuid);

    const importScenario = async () => {
      try {
        // Wait a moment to ensure services are fully initialized
        // This prevents "Cannot read properties of undefined (reading 'execute')" errors
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log("[SharedScenarioPage] Calling importScenarioMutation.mutateAsync");
        const scenario = await importScenarioMutation.mutateAsync({
          scenarioId: uuid,
        });

        console.log("[SharedScenarioPage] Import successful:", scenario.id.toString());
        setImportState("success");
        toastSuccess(`Scenario "${scenario.props.title}" imported successfully`);

        // Navigate to the imported scenario (delayed for log viewing)
        console.log(`[SharedScenarioPage] Redirecting in ${REDIRECT_DELAY}ms...`);
        setTimeout(() => {
          console.log("[SharedScenarioPage] Navigating to scenario page");
          navigate({
            to: "/assets/scenarios/{-$scenarioId}",
            params: { scenarioId: scenario.id.toString() },
            replace: true,
          });
        }, REDIRECT_DELAY);
      } catch (error) {
        console.error("[SharedScenarioPage] Import failed:", error);
        setImportState("error");
        const message = error instanceof Error ? error.message : "Unknown error occurred";
        setErrorMessage(message);
        toastError("Failed to import scenario", { description: message });
      }
    };

    importScenario();
  }, [uuid]);

  const handleRetry = async () => {
    setImportState("loading");
    setErrorMessage("");

    // Wait a moment to ensure services are fully initialized
    await new Promise(resolve => setTimeout(resolve, 500));

    importScenarioMutation.mutate(
      { scenarioId: uuid },
      {
        onSuccess: (scenario) => {
          setImportState("success");
          toastSuccess(`Scenario "${scenario.props.title}" imported successfully`);
          setTimeout(() => {
            navigate({
              to: "/assets/scenarios/{-$scenarioId}",
              params: { scenarioId: scenario.id.toString() },
              replace: true,
            });
          }, REDIRECT_DELAY);
        },
        onError: (error) => {
          setImportState("error");
          const message = error instanceof Error ? error.message : "Unknown error occurred";
          setErrorMessage(message);
          toastError("Failed to import scenario", { description: message });
        },
      },
    );
  };

  const handleGoToScenarios = () => {
    navigate({ to: "/assets/scenarios" });
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-8">
        {importState === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <Loading size="lg" />
            <p className="text-fg-muted text-lg">Importing shared scenario...</p>
            <p className="text-fg-subtle text-sm">
              This may take a moment while we download the assets.
            </p>
            {showTimeoutButton && (
              <>
                <p className="text-fg-warning text-sm">
                  This is taking unusually long.
                </p>
                <Button onClick={handleGoToScenarios} variant="outline">
                  Go back to scenarios
                </Button>
              </>
            )}
          </div>
        )}

        {importState === "success" && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-fg-default text-lg font-semibold">
              Scenario imported successfully!
            </p>
            <p className="text-fg-muted text-sm">Redirecting to your scenario...</p>
          </div>
        )}

        {importState === "error" && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-fg-default text-lg font-semibold">
              Failed to import scenario
            </p>
            <p className="text-fg-muted max-w-md text-center text-sm">
              {errorMessage}
            </p>
            <div className="flex gap-3">
              <Button onClick={handleRetry} variant="outline">
                Try again
              </Button>
              <Button onClick={handleGoToScenarios}>Go to scenarios</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
