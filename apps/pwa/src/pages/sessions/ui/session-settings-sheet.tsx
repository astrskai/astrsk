import { useCallback, useState, useRef, MutableRefObject } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Play } from "lucide-react";

import { Dialog, DialogContent, DialogPortal, DialogOverlay } from "@/shared/ui";
import { SessionSettingsNew } from "./chat/session-settings-new";
import { fetchSession, useCloneSession, useSaveSession } from "@/entities/session/api";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import { useSessionStore, useSessionUIStore } from "@/shared/stores/session-store";
import { UniqueEntityID } from "@/shared/domain";
import { CardTab } from "@/features/session/create-session/step-cards";
import { cn } from "@/shared/lib";

interface SessionSettingsSheetProps {
  sessionId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SessionSettingsSheet({
  sessionId,
  isOpen,
  onClose,
}: SessionSettingsSheetProps) {
  const navigate = useNavigate();
  const selectSession = useSessionStore.use.selectSession();
  const skipScenarioDialog = useSessionUIStore.use.skipScenarioDialog();
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

      // Skip the scenario dialog for the new session
      skipScenarioDialog(clonedSession.id.toString());

      // Success toast
      toastSuccess("Session started successfully");

      // Close the sheet
      onClose();

      // Select and navigate to the cloned session
      selectSession(clonedSession.id, clonedSession.props.title);
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
    skipScenarioDialog,
    onClose,
    selectSession,
    navigate,
  ]);

  if (!sessionId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay className="bg-black/80" />
        <DialogContent
          className={cn(
            // Override default dialog styles to make it full screen
            "!inset-0 !top-0 !left-0 !right-0 !bottom-0",
            "!translate-x-0 !translate-y-0",
            "!max-w-none !w-full !h-full",
            "!rounded-none",
            // Layout
            "flex flex-col",
            "p-0 gap-0",
            "bg-surface-raised",
          )}
        >
          {/* Body with SessionSettingsNew component */}
          <div className="flex-1 overflow-y-auto">
            <SessionSettingsNew
              setIsOpenSettings={(open) => {
                if (!open) onClose();
              }}
              refEditCards={refEditCards}
              refInitCardTab={refInitCardTab}
              isSettingsOpen={isOpen}
              actionButton={
                <button
                  onClick={handleStartSession}
                  disabled={isStarting}
                  className={cn(
                    "bg-white text-black px-6 py-2.5 rounded-full font-bold text-sm",
                    "hover:bg-gray-200 transition-all flex items-center gap-2",
                    "shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_20px_rgba(255,255,255,0.5)]",
                    "transform hover:scale-105 active:scale-95",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
                  )}
                >
                  <Play className="h-3 w-3" />
                  {isStarting ? "Starting..." : "Start Session"}
                </button>
              }
            />
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
