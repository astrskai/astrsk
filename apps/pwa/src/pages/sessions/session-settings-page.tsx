import { useCallback, useState, useRef, MutableRefObject, useEffect } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Play } from "lucide-react";

import { SessionSettings } from "./ui/chat/session-settings";
import { fetchSession, useCloneSession, useSaveSession } from "@/entities/session/api";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import { useSessionStore } from "@/shared/stores/session-store";
import { UniqueEntityID } from "@/shared/domain";
import { CardTab } from "@/features/session/create-session/step-cards";
import { useMobileNavigationStore } from "@/shared/stores/mobile-navigation-context";
import { Button } from "@/shared/ui/forms/button";

export function SessionSettingsPage() {
  const { sessionId } = useParams({ from: "/_layout/sessions/settings/$sessionId" });
  const navigate = useNavigate();
  const selectSession = useSessionStore.use.selectSession();
  const setIsLeftSidebarOpen = useMobileNavigationStore.use.setIsOpen();
  const cloneSessionMutation = useCloneSession();
  const saveSessionMutation = useSaveSession();

  const [isStarting, setIsStarting] = useState(false);

  // Refs for session settings
  const refEditCards = useRef<HTMLDivElement>(null);
  const refInitCardTab = useRef<CardTab>("ai-character" as CardTab) as MutableRefObject<CardTab>;

  // Handle Start Session - clone session and navigate
  const handleStartSession = useCallback(async () => {
    if (!sessionId) return;

    setIsStarting(true);

    try {
      // Fetch the latest session data
      const session = await fetchSession(new UniqueEntityID(sessionId));

      // Clone the session (without chat history)
      const clonedSession = await cloneSessionMutation.mutateAsync({
        sessionId: session.id,
        includeHistory: false,
      });

      // Remove the original user character from allCards
      // The user will select a persona in the chat page
      const originalUserCardId = clonedSession.props.userCharacterCardId;
      let updatedAllCards = clonedSession.props.allCards;

      if (originalUserCardId) {
        updatedAllCards = clonedSession.props.allCards.filter(
          (card) => !card.id.equals(originalUserCardId)
        );
      }

      // Set isPlaySession: true, fix title, and keep userCharacterCardId for suggestion
      clonedSession.update({
        isPlaySession: true,
        title: session.props.title, // Use original title, not "Copy of..."
        userCharacterCardId: originalUserCardId, // Keep it so ChatPage prompts for persona as suggestion
        allCards: updatedAllCards,
      });

      // Save the updated session
      await saveSessionMutation.mutateAsync({ session: clonedSession });

      // Success toast
      toastSuccess("Session started successfully");

      // Select and navigate to the cloned session
      selectSession(clonedSession.id, clonedSession.props.title);

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
    cloneSessionMutation,
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
