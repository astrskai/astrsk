import { useState, useEffect } from "react";
import { ShieldCheck, Play, HardDrive } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/shared/lib";
import { TutorialDialog } from "@/widgets/onboarding/tutorial-dialog";

// Typewriter effect component
const TypewriterText = ({
  text,
  delay = 0,
}: {
  text: string;
  delay?: number;
}) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let i = 0;
    let interval: ReturnType<typeof setInterval> | undefined;
    const timer = setTimeout(() => {
      interval = setInterval(() => {
        setDisplayedText(text.slice(0, i + 1));
        i++;
        if (i === text.length) clearInterval(interval);
      }, 30);
    }, delay);
    return () => {
      clearTimeout(timer);
      if (interval) clearInterval(interval);
    };
  }, [text, delay]);

  return <span>{displayedText}</span>;
};

// Chat Demo Component
const ChatDemo = () => {
  return (
    <div className="bg-surface shadow-brand-500/10 relative mx-auto max-w-2xl overflow-hidden rounded-2xl border border-neutral-800 shadow-2xl">
      {/* Header */}
      <div className="bg-surface-raised/50 flex items-center gap-2 border-b border-neutral-800 px-4 py-3">
        <div className="flex gap-1.5">
          <div className="bg-status-error/20 h-3 w-3 rounded-full" />
          <div className="bg-status-warning/20 h-3 w-3 rounded-full" />
          <div className="bg-status-success/20 h-3 w-3 rounded-full" />
        </div>
        <div className="text-fg-subtle mx-auto flex items-center gap-2 text-xs font-medium">
          <HardDrive size={10} className="text-status-success" />
          <span>Local Session: The Clockwork Spire</span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex min-h-[300px] flex-col gap-4 p-6">
        {/* AI Message */}
        <div className="flex gap-4">
          <div className="border-accent-purple/30 h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=2864&auto=format&fit=crop"
              alt="AI"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-accent-orange text-sm font-bold">
                Sakuraba Yui
              </span>
              <span className="text-fg-subtle rounded bg-neutral-800 px-1.5 py-0.5 text-[10px]">
                NPC
              </span>
            </div>
            <p className="text-fg-muted max-w-md text-sm leading-relaxed">
              <TypewriterText text="She hesitates, looking around nervously. 'Are you sure no one is listening? What we're about to discuss... it can't leave this room.'" />
            </p>
          </div>
        </div>

        {/* User Message */}
        <div className="flex flex-row-reverse gap-4">
          <div className="text-fg-subtle flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-neutral-800 text-xs">
            You
          </div>
          <div className="space-y-1 text-right">
            <div className="text-accent-indigo text-sm font-bold">Player</div>
            <div className="bg-brand-600/20 text-brand-300 inline-block rounded-2xl rounded-tr-sm px-4 py-2 text-left text-sm">
              "Don't worry, Yui. This data stays on my device. We're completely
              off the grid."
            </div>
          </div>
        </div>

        {/* AI Response (Simulated loading) */}
        <div className="flex gap-4 opacity-80">
          <div className="border-accent-purple/30 h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=2864&auto=format&fit=crop"
              alt="AI"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-accent-orange text-sm font-bold">
                Sakuraba Yui
              </span>
            </div>
            <div className="flex gap-1">
              <span
                className="bg-fg-subtle h-1.5 w-1.5 animate-bounce rounded-full"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="bg-fg-subtle h-1.5 w-1.5 animate-bounce rounded-full"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="bg-fg-subtle h-1.5 w-1.5 animate-bounce rounded-full"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Input Mock */}
      <div className="bg-surface border-t border-neutral-800 p-4">
        <div className="bg-canvas text-fg-subtle flex items-center gap-2 rounded-lg border border-neutral-800 px-3 py-2">
          <span className="text-sm">What do you do next?</span>
          <div className="bg-brand-500 ml-auto h-4 w-0.5 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

// Company Info Component
const CompanyInfo = () => (
  <div className="text-fg-disabled flex flex-col items-center gap-6 text-center text-xs">
    <div className="flex flex-col gap-1 md:flex-row md:gap-4">
      <span>
        <strong>Company Name:</strong> harpy chat(jejoon yoo)
      </span>
      <span className="hidden text-neutral-800 md:inline">|</span>
      <span>
        <strong>Address:</strong> 165, Yeoksam-ro, Gangnam-gu, Seoul, Republic
        of Korea, 06247
      </span>
    </div>
    <div className="flex flex-col gap-1 md:flex-row md:gap-4">
      <span>
        <strong>Contact:</strong> +82-10-7490-1918 or cyoo@astrsk.ai
      </span>
      <span className="hidden text-neutral-800 md:inline">|</span>
      <span>
        <strong>BRN:</strong> 299-88-02625
      </span>
    </div>
  </div>
);

interface HomePageProps {
  className?: string;
}

export function HomePage({ className }: HomePageProps) {
  const navigate = useNavigate();
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  const handleStartSession = () => {
    navigate({ to: "/sessions/new" });
  };

  const handleWatchTutorial = () => {
    setIsTutorialOpen(true);
  };

  return (
    <div
      className={cn(
        "bg-canvas flex h-full flex-col items-center gap-8 overflow-y-auto px-4 py-8 md:justify-center md:py-12",
        className,
      )}
    >
      {/* Hero Text */}
      <h1 className="text-fg-default text-center text-4xl leading-[1.1] font-extrabold tracking-tight sm:text-5xl lg:text-7xl">
        Chat Privately.
        <br />
        <span className="from-brand-400 to-brand-600 bg-gradient-to-r bg-clip-text text-transparent">
          Run Locally.
        </span>
      </h1>

      {/* Privacy Badge */}
      <div className="bg-surface-raised/50 text-fg-muted hover:border-brand-500/50 hover:bg-brand-500/5 flex items-center gap-2 rounded-full border border-neutral-800 px-4 py-2 text-xs backdrop-blur-xl transition-all sm:gap-3 sm:px-5 sm:py-2.5 sm:text-sm">
        <ShieldCheck
          size={16}
          className="text-brand-400 shrink-0 sm:size-[18px]"
        />
        <span className="text-center sm:text-left">
          Your sessions are stored locally — <br className="sm:hidden" />
          <span className="text-brand-400 font-bold">only on your device</span>
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <button
          onClick={handleStartSession}
          className="bg-brand-600 shadow-brand-600/25 hover:bg-brand-500 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:scale-95 sm:w-auto"
        >
          Start Creating Session
        </button>
        <button
          onClick={handleWatchTutorial}
          className="border-border-default text-fg-muted hover:border-brand-500 hover:text-brand-500 flex w-full items-center justify-center gap-2 rounded-xl border bg-transparent px-6 py-3 font-semibold transition-all duration-300 active:scale-95 sm:w-auto"
        >
          <Play size={18} /> Watch Tutorial
        </button>
      </div>

      {/* Tutorial Dialog */}
      <TutorialDialog open={isTutorialOpen} onOpenChange={setIsTutorialOpen} />

      {/* Chat Demo */}
      <div className="hidden w-full max-w-2xl">
        <div className="transform transition-transform duration-500 hover:scale-[1.01]">
          <ChatDemo />
        </div>
      </div>

      {/* Company Info */}
      <div className="mt-8">
        <CompanyInfo />
      </div>
    </div>
  );
}
