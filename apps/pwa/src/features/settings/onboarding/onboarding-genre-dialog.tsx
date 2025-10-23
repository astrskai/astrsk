import { Page, useAppStore } from "@/app/stores/app-store";
import { useSessionStore } from "@/app/stores/session-store";
import { useSidebarLeft } from "@/components/layout/both-sidebar";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/components-v2/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components-v2/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { sessionQueries } from "@/app/queries/session-queries";
import { Session } from "@/modules/session/domain";
import { useNavigate } from "@tanstack/react-router";

// Map genres to session names
const GENRE_SESSION_MAP = {
  romance: "Sakura Blooms, Hearts Awaken",
  fantasy: "Dice of Fate",
} as const;

const OnboardingDialog = () => {
  const sessionOnboardingSteps = useAppStore.use.sessionOnboardingSteps();
  const setSessionOnboardingStep = useAppStore.use.setSessionOnboardingStep();
  const setOnboardingSelectedSessionId =
    useAppStore.use.setOnboardingSelectedSessionId();
  const setActivePage = useAppStore.use.setActivePage();
  const subscribed = useAppStore.use.subscribed();
  const [selectedGenre, setSelectedGenre] = useState<
    "romance" | "fantasy" | null
  >(null);

  // Session store
  const selectSession = useSessionStore.use.selectSession();
  const navigate = useNavigate();

  // Sidebar control
  const { setOpen: setSidebarOpen } = useSidebarLeft();

  // Get all sessions to find the matching session ID
  const { data: sessions, isLoading: isLoadingSessions } = useQuery(
    sessionQueries.list({}),
  );

  const handleNext = () => {
    if (!selectedGenre || !sessions) return;

    // Mark genre selection as completed - this will close the dialog
    setSessionOnboardingStep("genreSelection", true);

    // Find the session that matches the selected genre
    const targetSessionName = GENRE_SESSION_MAP[selectedGenre];
    const targetSession = sessions.find(
      (session: Session) => session.title === targetSessionName,
    );

    if (targetSession) {
      // Store the selected session ID for persistence during onboarding
      setOnboardingSelectedSessionId(targetSession.id.toString());

      // Select the appropriate session
      selectSession(targetSession.id, targetSession.title);

      navigate({
        to: "/sessions/$sessionId",
        params: { sessionId: targetSession.id.toString() },
      });

      // Collapse the left sidebar for a focused experience
      setSidebarOpen(false);
    } else {
      console.warn(`Could not find session with title: ${targetSessionName}`);

      navigate({
        to: "/",
      });

      setSidebarOpen(false);
    }

    setActivePage(Page.Init);
  };

  // Show dialog only if:
  // 1. Old users: isPassedOnboarding is false (legacy check)
  // 2. New users: genreSelection step is not completed
  const shouldShowDialog = !sessionOnboardingSteps.genreSelection && subscribed;

  return (
    <Dialog open={shouldShowDialog}>
      <DialogContent hideClose className="min-w-[720px] outline-none">
        <>
          <DialogHeader>
            <DialogTitle>
              <div className="text-[24px] leading-[40px] font-[500] text-[#F1F1F1]">
                Dive right in!
              </div>
            </DialogTitle>
            <DialogDescription>
              <div className="text-[16px] leading-[25.6px] font-[400] text-[#A1A1A1]">
                Select a genre to experience our pre-built roleplay session
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="inline-flex h-[365px] items-start justify-start gap-2 self-stretch">
            <div
              className={cn(
                "relative flex-1 cursor-pointer self-stretch overflow-hidden rounded-lg transition-all",
                selectedGenre === "romance"
                  ? "outline-border-selected-primary outline-[3px] outline-offset-0 hover:outline-[4px]"
                  : "hover:opacity-80",
              )}
              onClick={() => setSelectedGenre("romance")}
            >
              <img
                className="absolute inset-0 h-full w-full object-cover"
                src="/img/onboarding/romance.jpg"
                alt="Romance genre"
              />
              <div className="absolute inset-x-0 bottom-0 flex h-24 w-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-black/0 to-black/80 px-2 py-6">
                <div className="text-text-primary justify-start text-xl leading-relaxed font-semibold">
                  Sakura Blooms, hearts awaken
                </div>
                <div className="text-text-subtle text-sm font-semibold">
                  Romance
                </div>
              </div>
            </div>

            <div
              className={cn(
                "relative flex-1 cursor-pointer self-stretch overflow-hidden rounded-lg transition-all",
                selectedGenre === "fantasy"
                  ? "outline-border-selected-primary outline-[3px] outline-offset-0 hover:outline-[4px]"
                  : "hover:opacity-80",
              )}
              onClick={() => setSelectedGenre("fantasy")}
            >
              <img
                className="absolute inset-0 h-full w-full object-cover"
                src="/img/onboarding/fantasy.jpg"
                alt="Fantasy genre"
              />
              <div className="absolute inset-x-0 bottom-0 flex h-24 w-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-black/0 to-black/80 px-2 py-6">
                <div className="text-text-primary justify-start text-xl leading-relaxed font-semibold">
                  Dice of Fate
                </div>
                <div className="text-text-subtle text-sm font-semibold">
                  Fantasy TRPG
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-row justify-end gap-2">
            <Button
              size="lg"
              onClick={handleNext}
              disabled={!selectedGenre || isLoadingSessions}
            >
              {isLoadingSessions ? "Loading..." : "Next"}
            </Button>
          </div>
        </>
      </DialogContent>
    </Dialog>
  );
};

export { OnboardingDialog };
