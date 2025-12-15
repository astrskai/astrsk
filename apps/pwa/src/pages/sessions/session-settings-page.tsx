import { useCallback, useState, useRef, MutableRefObject, useEffect } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Play } from "lucide-react";

import { SessionSettings } from "./ui/chat/session-settings";
import { fetchSession, useSaveSession } from "@/entities/session/api";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import { useSessionStore } from "@/shared/stores/session-store";
import { UniqueEntityID } from "@/shared/domain";
import { CardTab } from "@/features/session/create-session/step-cards";
import { useMobileNavigationStore } from "@/shared/stores/mobile-navigation-context";
import { Button } from "@/shared/ui/forms/button";
import { SessionService } from "@/app/services/session-service";

export function SessionSettingsPage() {
  const { sessionId } = useParams({ from: "/_layout/sessions/settings/$sessionId" });
  const navigate = useNavigate();
  const selectSession = useSessionStore.use.selectSession();
  const setIsLeftSidebarOpen = useMobileNavigationStore.use.setIsOpen();
  const saveSessionMutation = useSaveSession();

  const [isStarting, setIsStarting] = useState(false);

  // Refs for session settings
  const refEditCards = useRef<HTMLDivElement>(null);
  const refInitCardTab = useRef<CardTab>("ai-character" as CardTab) as MutableRefObject<CardTab>;

  // Handle Start Session - clone session as play session and navigate
  const handleStartSession = useCallback(async () => {
    if (!sessionId) return;

    setIsStarting(true);

    try {
      // Fetch the latest session data
      const session = await fetchSession(new UniqueEntityID(sessionId));

      // Clone as play session (centralized logic)
      const clonedPlaySessionResult = await SessionService.clonePlaySession.execute({
        sessionId: session.id,
        includeHistory: false,
      });

      if (clonedPlaySessionResult.isFailure) {
        throw new Error(clonedPlaySessionResult.getError());
      }

      const clonedSession = clonedPlaySessionResult.getValue();

      // Save the play session (title and isPlaySession already set by ClonePlaySession)
      await saveSessionMutation.mutateAsync({ session: clonedSession });

      // Select and navigate to the cloned session
      selectSession(clonedSession.id, clonedSession.props.name);

      // Open the left sidebar (session list) on desktop only
      // Mobile is determined by window width < 768px (Tailwind md breakpoint)
      const isMobile = window.innerWidth < 768;
      if (!isMobile) {
        setIsLeftSidebarOpen(true);
      }

      navigate({
        to: "/sessions/$sessionId",
        params: { sessionId: clonedSession.id.toString() },
      });
    } catch (error) {
      toastError("Failed to start session", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsStarting(false);
    }
  }, [
    sessionId,
    saveSessionMutation,
    selectSession,
    setIsLeftSidebarOpen,
    navigate,
  ]);

  // Set selected session when component mounts or sessionId changes
  useEffect(() => {
    if (sessionId) {
      selectSession(new UniqueEntityID(sessionId), "");
    }
  }, [sessionId, selectSession]);

  if (!sessionId) return null;

  return (
    <div className="w-full h-full overflow-y-auto bg-surface">
      <SessionSettings
        setIsOpenSettings={() => {
          // Navigate back to sessions list
          navigate({ to: "/sessions" });
        }}
        refEditCards={refEditCards}
        refInitCardTab={refInitCardTab}
        isSettingsOpen={true}
        actionButton={
          <Button
            onClick={handleStartSession}
            loading={isStarting}
            icon={<Play className="h-3 w-3" />}
          >
            Start Session
          </Button>
        }
      />
    </div>
  );
}
