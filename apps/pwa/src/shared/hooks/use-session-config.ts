import { useState, useEffect, useCallback } from "react";
import { logger } from "@/shared/lib/logger";
import { toastError } from "@/shared/ui/toast";
import { Session } from "@/entities/session/domain/session";
import { useSaveSession } from "@/entities/session/api";
import type { PersonaResult } from "@/features/character/ui/persona-selection-dialog";

interface UseSessionConfigOptions {
  session: Session | null;
  onPersonaConfirm?: (result: PersonaResult | null | undefined) => void | Promise<void>;
}

// TTL for dialogs (24 hours in milliseconds)
const DIALOG_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Hook to manage session config state including:
 * - Initial persona dialog (shows on first load if not seen in last 24 hours)
 * - Settings panel open/closed state
 * - Data panel open/closed state
 *
 * All state is persisted to session.config in the database
 */
export const useSessionConfig = ({
  session,
  onPersonaConfirm,
}: UseSessionConfigOptions) => {
  const [isPersonaDialogOpen, setIsPersonaDialogOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const saveSessionMutation = useSaveSession();

  // Track when component has mounted
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Show persona dialog on first load if conditions met
  useEffect(() => {
    if (!session || !hasMounted) return;

    const hasNoTurns = session.turnIds.length === 0;
    const lastSeenTimestamp = session.props.config?.hasSeenPersonaDialog as number | undefined;

    // Check if dialog was seen within last 24 hours
    const hasSeenRecently = lastSeenTimestamp &&
      (Date.now() - lastSeenTimestamp < DIALOG_TTL_MS);

    // Show dialog if: no turns AND (never seen OR expired after 24 hours)
    if (hasNoTurns && !hasSeenRecently) {
      setIsPersonaDialogOpen(true);
    }
  }, [session, hasMounted]);

  /**
   * Handle persona dialog confirm or dismiss
   * Marks persona dialog as seen in config
   */
  const handlePersonaDialogClose = useCallback(
    async (result?: PersonaResult | null) => {
      if (!session) return;

      try {
        const now = Date.now();

        // Call callback first to update persona (if provided)
        if (onPersonaConfirm) {
          await onPersonaConfirm(result);
        }

        // Update session config to mark persona dialog as seen
        session.update({
          config: {
            ...session.props.config,
            hasSeenPersonaDialog: now,
          },
        });

        // Persist to database
        await saveSessionMutation.mutateAsync({ session });

        // Close dialog
        setIsPersonaDialogOpen(false);
      } catch (error) {
        logger.error("Failed to update session config", error);
        toastError("Failed to save persona preference", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [session, saveSessionMutation, onPersonaConfirm],
  );

  /**
   * Get settings panel open state from session config
   */
  const isSettingsPanelOpen: boolean = (session?.props.config?.settingsPanelOpen as boolean | undefined) ?? false;

  /**
   * Get data panel open state from session config
   */
  const isDataPanelOpen: boolean = (session?.props.config?.dataPanelOpen as boolean | undefined) ?? false;

  /**
   * Toggle settings panel open/closed state
   */
  const toggleSettingsPanel = useCallback(async () => {
    if (!session) return;

    try {
      const newValue = !isSettingsPanelOpen;

      session.update({
        config: {
          ...session.props.config,
          settingsPanelOpen: newValue,
        },
      });

      // Persist to database
      await saveSessionMutation.mutateAsync({ session });
    } catch (error) {
      logger.error("Failed to toggle settings panel", error);
      toastError("Failed to update panel state", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [session, isSettingsPanelOpen, saveSessionMutation]);

  /**
   * Toggle data panel open/closed state
   */
  const toggleDataPanel = useCallback(async () => {
    if (!session) return;

    try {
      const newValue = !isDataPanelOpen;

      session.update({
        config: {
          ...session.props.config,
          dataPanelOpen: newValue,
        },
      });

      // Persist to database
      await saveSessionMutation.mutateAsync({ session });
    } catch (error) {
      logger.error("Failed to toggle data panel", error);
      toastError("Failed to update panel state", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [session, isDataPanelOpen, saveSessionMutation]);

  return {
    // Persona dialog state
    isPersonaDialogOpen,
    setIsPersonaDialogOpen,
    handlePersonaDialogClose,

    // Panel states
    isSettingsPanelOpen,
    isDataPanelOpen,
    toggleSettingsPanel,
    toggleDataPanel,
  };
};
