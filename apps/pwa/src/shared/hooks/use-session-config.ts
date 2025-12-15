import { useCallback } from "react";
import { logger } from "@/shared/lib/logger";
import { toastError } from "@/shared/ui/toast";
import { Session } from "@/entities/session/domain/session";
import { useSaveSession } from "@/entities/session/api";

interface UseSessionConfigOptions {
  session: Session | null;
}

/**
 * Hook to manage session config state including:
 * - Settings panel open/closed state
 * - Data panel open/closed state
 *
 * All state is persisted to session.config in the database
 */
export const useSessionConfig = ({
  session,
}: UseSessionConfigOptions) => {
  const saveSessionMutation = useSaveSession();

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
    // Panel states
    isSettingsPanelOpen,
    isDataPanelOpen,
    toggleSettingsPanel,
    toggleDataPanel,
  };
};
