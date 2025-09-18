import { Button } from "@/components-v2/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components-v2/ui/dialog";
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
      <DialogContent className="max-w-[720px] p-6 bg-background-surface-2 rounded-lg shadow-[0px_10px_10px_-5px_rgba(0,0,0,0.10)] shadow-[0px_10px_25px_-5px_rgba(0,0,0,0.30)] outline outline-1 outline-offset-[-1px] outline-background-surface-2">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-text-primary text-2xl font-semibold leading-10">
            {config.title}
          </DialogTitle>
          <DialogDescription className="text-text-placeholder text-base font-normal leading-relaxed">
            {config.description}
          </DialogDescription>
        </DialogHeader>

        {/* Video Container */}
        <div className="w-full h-80 relative rounded-lg overflow-hidden">
          <iframe
            width="672"
            height="320"
            src={`https://www.youtube.com/embed/${config.videoId}`}
            title={config.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full"
          />

          {/* Play Button Overlay (hidden when video is loaded) */}
          <div className="absolute inset-0 bg-neutral-700/50 backdrop-blur-sm flex items-center justify-center pointer-events-none opacity-0 transition-opacity">
            <div className="p-6 bg-neutral-700/50 rounded-full backdrop-blur-sm">
              <Play size={28} className="text-text-primary" />
            </div>
          </div>

          {/* Volume Control (bottom right) */}
          <div className="absolute bottom-4 right-4 p-2 bg-neutral-700/50 rounded-full backdrop-blur-sm">
            <Volume2 size={20} className="text-text-primary" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center">
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
            className="min-w-20 px-3 py-2.5 rounded-[20px]"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
