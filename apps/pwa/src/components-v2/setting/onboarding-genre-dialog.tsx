import { useAppStore, Page } from "@/app/stores/app-store";
import { useSessionStore } from "@/app/stores/session-store";
import { useSidebarLeft } from "@/components-v2/both-sidebar";
import { cn } from "@/components-v2/lib/utils";
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

import { SessionService } from "@/app/services/session-service";

// Map genres to session names
const GENRE_SESSION_MAP = {
  romance: "Sakura Blooms, Hearts Awaken",
  fantasy: "Dice of Fate",
} as const;


const OnboardingDialog = () => {
  const sessionOnboardingSteps = useAppStore.use.sessionOnboardingSteps();
  const setSessionOnboardingStep = useAppStore.use.setSessionOnboardingStep();
  const setOnboardingSelectedSessionId = useAppStore.use.setOnboardingSelectedSessionId();
  const setActivePage = useAppStore.use.setActivePage();
  const subscribed = useAppStore.use.subscribed();
  const [selectedGenre, setSelectedGenre] = useState<"romance" | "fantasy" | null>(null);

  // Session store
  const selectSession = useSessionStore.use.selectSession();

  // Sidebar control
  const { setOpen: setSidebarOpen } = useSidebarLeft();

  // Telemetry
  const setIsTelemetryEnabled = useAppStore.use.setIsTelemetryEnabled();

  // Get all sessions to find the matching session ID
  const { data: sessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const result = await SessionService.listSession.execute({});
      if (result.isFailure) return [];
      return result.getValue();
    },
    enabled: !sessionOnboardingSteps.genreSelection, // Only fetch if dialog is showing
  });

  const handleNext = () => {
    if (!selectedGenre || !sessions) return;

    // Enable telemetry by default
    setIsTelemetryEnabled(true);
    
    // Mark genre selection as completed - this will close the dialog
    setSessionOnboardingStep('genreSelection', true);
    
    // Find the session that matches the selected genre
    const targetSessionName = GENRE_SESSION_MAP[selectedGenre];
    const targetSession = sessions.find(session => session.title === targetSessionName);
    
    if (targetSession) {
      // Store the selected session ID for persistence during onboarding
      setOnboardingSelectedSessionId(targetSession.id.toString());
      
      // Navigate to sessions page
      setActivePage(Page.Sessions);
      
      // Select the appropriate session
      selectSession(targetSession.id, targetSession.title);
      
      // Collapse the left sidebar for a focused experience
      setSidebarOpen(false);
    } else {
      console.warn(`Could not find session with title: ${targetSessionName}`);
      // Fallback: just navigate to sessions page if session not found
      setActivePage(Page.Sessions);
      setSidebarOpen(false);
    }
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
              <div className="font-[500] text-[24px] leading-[40px] text-[#F1F1F1]">
                Try these sample sessions for free
              </div>
            </DialogTitle>
            <DialogDescription>
              <div className="font-[400] text-[16px] leading-[25.6px] text-[#A1A1A1]">
                Pick your genre and try out our pre-made adventures using your free credits!
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <div className="self-stretch h-[365px] inline-flex justify-start items-start gap-2">
            <div 
              className={cn(
                "flex-1 self-stretch relative rounded-lg overflow-hidden cursor-pointer transition-all",
                selectedGenre === "romance" 
                  ? "outline-[3px] outline-offset-0 outline-border-selected-primary hover:outline-[4px]" 
                  : "hover:opacity-80"
              )}
              onClick={() => setSelectedGenre("romance")}
            >
              <img 
                className="w-[332px] h-[365px] left-0 top-0 absolute object-cover" 
                src="/img/onboarding/romance.jpg" 
                alt="Romance genre"
              />
              <div className="w-[332px] h-24 px-2 py-6 left-0 bottom-0 absolute bg-gradient-to-b from-black/0 to-black/80 inline-flex justify-center items-end gap-2">
                <div className="justify-start text-text-primary text-base font-semibold leading-relaxed">
                  Romance
                </div>
              </div>
            </div>
            
            <div 
              className={cn(
                "flex-1 self-stretch relative rounded-lg overflow-hidden cursor-pointer transition-all",
                selectedGenre === "fantasy" 
                  ? "outline-[3px] outline-offset-0 outline-border-selected-primary hover:outline-[4px]" 
                  : "hover:opacity-80"
              )}
              onClick={() => setSelectedGenre("fantasy")}
            >
              <img 
                className="w-[332px] h-[365px] left-0 top-0 absolute object-cover" 
                src="/img/onboarding/fantasy.jpg" 
                alt="Fantasy genre"
              />
              <div className="w-[332px] h-24 px-2 py-6 left-0 bottom-0 absolute bg-gradient-to-b from-black/0 to-black/80 inline-flex justify-center items-end gap-2">
                <div className="justify-start text-text-primary text-base font-semibold leading-relaxed">
                  Fantasy
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-row justify-end gap-2">
            <Button size="lg" onClick={handleNext} disabled={!selectedGenre || isLoadingSessions}>
              {isLoadingSessions ? "Loading..." : "Next"}
            </Button>
          </div>
        </>
      </DialogContent>
    </Dialog>
  );
};

export { OnboardingDialog };