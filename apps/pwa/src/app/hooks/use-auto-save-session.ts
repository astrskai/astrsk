import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { logger } from "@/shared/utils/logger";
import { SessionProps } from "@/modules/session/domain/session";
import { Session } from "@/modules/session/domain/session";
import { useSaveSession } from "@/app/queries/session-queries";

interface UseAutoSaveSessionOptions {
  session: Session | null;
  onSave?: () => void;
  debounceMs?: number;
}

export const useAutoSaveSession = ({
  session,
  onSave,
  debounceMs = 500,
}: UseAutoSaveSessionOptions) => {
  const saveSessionMutation = useSaveSession();

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  const autoSave = useCallback(
    async (props: Partial<SessionProps>, skipToast = false) => {
      if (!session || isSavingRef.current) {
        return;
      }

      // Clear any existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce the save
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          isSavingRef.current = true;

          // Update session
          const updateResult = session.update(props);
          if (updateResult.isFailure) {
            throw new Error(updateResult.getError());
          }

          // Save session
          const saveResult = await saveSessionMutation.mutateAsync({
            session: session,
          });
          if (saveResult.isFailure) {
            throw new Error(saveResult.getError());
          }

          // Call onSave callback if provided
          onSave?.();

          // Show success toast (optional)
          if (!skipToast) {
            toast.success("Session updated");
          }
        } catch (error) {
          logger.error("Failed to auto-save session", error);
          toast.error("Failed to save session", {
            description: error instanceof Error ? error.message : "Unknown error",
          });
        } finally {
          isSavingRef.current = false;
        }
      }, debounceMs);
    },
    [session, onSave, debounceMs]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return { autoSave };
};