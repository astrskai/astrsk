// @refresh reset - Force full reload on HMR to prevent DOM sync issues
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Route } from "@/routes/shared/flow/$uuid";
import { useImportFlowFromCloud } from "@/entities/flow/api/mutations";
import { Button, Loading } from "@/shared/ui";
import { toastError, toastSuccess } from "@/shared/ui/toast";

type ImportState = "loading" | "success" | "error";

// Delay before redirect to allow viewing logs (in ms)
const REDIRECT_DELAY = 3000;
// Timeout before showing "Go back" button (in ms)
const LOADING_TIMEOUT = 10000;

export default function SharedFlowPage() {
  const navigate = useNavigate();
  const { uuid } = Route.useParams();
  const [importState, setImportState] = useState<ImportState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showTimeoutButton, setShowTimeoutButton] = useState(false);

  // Guard against double execution (React Strict Mode runs effects twice)
  const importStartedRef = useRef(false);

  const importFlowMutation = useImportFlowFromCloud();

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
      console.log("[SharedFlowPage] Import already started, skipping duplicate execution");
      return;
    }
    importStartedRef.current = true;

    console.log("[SharedFlowPage] Starting flow import for:", uuid);

    const importFlow = async () => {
      try {
        console.log("[SharedFlowPage] Calling importFlowMutation.mutateAsync");
        const flow = await importFlowMutation.mutateAsync({
          flowId: uuid,
        });

        console.log("[SharedFlowPage] Import successful:", flow.id.toString());
        setImportState("success");
        toastSuccess(`Workflow "${flow.props.name}" imported successfully`);

        // Navigate to the imported flow (delayed for log viewing)
        console.log(`[SharedFlowPage] Redirecting in ${REDIRECT_DELAY}ms...`);
        setTimeout(() => {
          console.log("[SharedFlowPage] Navigating to flow page");
          navigate({
            to: "/assets/workflows/$workflowId",
            params: { workflowId: flow.id.toString() },
            replace: true,
          });
        }, REDIRECT_DELAY);
      } catch (error) {
        console.error("[SharedFlowPage] Import failed:", error);
        setImportState("error");
        const message = error instanceof Error ? error.message : "Unknown error occurred";
        setErrorMessage(message);
        toastError("Failed to import workflow", { description: message });
      }
    };

    importFlow();
  }, [uuid]);

  const handleRetry = () => {
    setImportState("loading");
    setErrorMessage("");
    importFlowMutation.mutate({ flowId: uuid });
  };

  const handleGoToWorkflows = () => {
    navigate({ to: "/assets/workflows" });
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-8">
        {importState === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <Loading size="lg" />
            <p className="text-fg-muted text-lg">Importing shared workflow...</p>
            <p className="text-fg-subtle text-sm">
              This may take a moment while we download all agents.
            </p>
            {showTimeoutButton && (
              <>
                <p className="text-fg-warning text-sm">
                  This is taking unusually long.
                </p>
                <Button onClick={handleGoToWorkflows} variant="outline">
                  Go back to workflows
                </Button>
              </>
            )}
          </div>
        )}

        {importState === "success" && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-fg-default text-lg font-semibold">
              Workflow imported successfully!
            </p>
            <p className="text-fg-muted text-sm">Redirecting to your workflow...</p>
          </div>
        )}

        {importState === "error" && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-fg-default text-lg font-semibold">
              Failed to import workflow
            </p>
            <p className="text-fg-muted max-w-md text-center text-sm">
              {errorMessage}
            </p>
            <div className="flex gap-3">
              <Button onClick={handleRetry} variant="outline">
                Try again
              </Button>
              <Button onClick={handleGoToWorkflows}>Go to workflows</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
