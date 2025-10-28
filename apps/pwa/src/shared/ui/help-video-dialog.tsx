import { Button } from "@/shared/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui";
import { Play, Volume2 } from "lucide-react";

interface HelpVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "sessions" | "cards" | "flows";
}

const videoConfig = {
  sessions: {
    title: "Getting Started with Sessions",
    description: "Learn how to run and manage sessions in just 30 seconds.",
    videoId: "s6selZus4ZY", // TODO: Replace with actual video ID
    fullTutorialUrl: "https://youtu.be/vO6JFL6R_mc?si=DQxLjkDoSgona_TE", // TODO: Replace with actual URL
    fullDoc: "https://docs.astrsk.ai/en/What-is-a-session",
  },
  cards: {
    title: "Working with Cards",
    description: "Discover how to create and manage cards effectively.",
    videoId: "-QVlz3H7xW0", // TODO: Replace with actual video ID
    fullTutorialUrl: "https://youtu.be/3UNGwPQTkXs?si=NGk5O4hpvsKjWwUk", // TODO: Replace with actual URL
    fullDoc: "https://docs.astrsk.ai/en/What-is-a-card",
  },
  flows: {
    title: "Understanding Flows & Agents",
    description: "Master flows and agents to automate your workflows.",
    videoId: "Zz4xBsZuvNw", // TODO: Replace with actual video ID
    fullTutorialUrl: "https://youtu.be/GQbZkqWanYY?si=wzjq9wvgSHQOshBl", // TODO: Replace with actual URL
    fullDoc: "https://docs.astrsk.ai/en/Overall-structure_of_flow",
  },
};

export const HelpVideoDialog = ({
  open,
  onOpenChange,
  type,
}: HelpVideoDialogProps) => {
  const config = videoConfig[type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background-surface-2 outline-background-surface-2 max-w-[720px] rounded-lg p-6 shadow-[0px_10px_10px_-5px_rgba(0,0,0,0.10)] shadow-[0px_10px_25px_-5px_rgba(0,0,0,0.30)] outline outline-offset-[-1px]">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-text-primary text-2xl leading-10 font-semibold">
            {config.title}
          </DialogTitle>
          <DialogDescription className="text-text-placeholder text-base leading-relaxed font-normal">
            {config.description}
          </DialogDescription>
        </DialogHeader>

        {/* Video Container */}
        <div className="relative h-80 w-full overflow-hidden rounded-lg">
          <iframe
            width="672"
            height="320"
            src={`https://www.youtube.com/embed/${config.videoId}`}
            title={config.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full"
          />

          {/* Play Button Overlay (hidden when video is loaded) */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-neutral-700/50 opacity-0 backdrop-blur-sm transition-opacity">
            <div className="rounded-full bg-neutral-700/50 p-6 backdrop-blur-sm">
              <Play size={28} className="text-text-primary" />
            </div>
          </div>

          {/* Volume Control (bottom right) */}
          <div className="absolute right-4 bottom-4 rounded-full bg-neutral-700/50 p-2 backdrop-blur-sm">
            <Volume2 size={20} className="text-text-primary" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium">
            <span className="text-text-info">Watch the full tutorial on </span>
            <button
              className="text-secondary-normal hover:underline"
              onClick={() =>
                window.open(
                  config.fullTutorialUrl,
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            >
              YouTube
            </button>
            <span className="text-text-info"> or check out our </span>
            <button
              className="text-secondary-normal hover:underline"
              onClick={() =>
                window.open(config.fullDoc, "_blank", "noopener,noreferrer")
              }
            >
              user docs
            </button>
            <span className="text-text-info">.</span>
          </div>
          <Button
            variant="ghost"
            className="min-w-20 rounded-[20px] px-3 py-2.5"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
