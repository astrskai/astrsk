import { Switch } from "@/components-v2/ui/switch";
import { MediaDisplay } from "@/shared/ui/media-display";
import { Image } from "lucide-react";
import { cn } from "@/shared/lib/cn";

interface ImageToImageSettingProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  cardImageUrl?: string;
  cardIsVideo?: boolean;
  disabled?: boolean;
  isGeneratingVideo?: boolean; // Whether the output will be video
}

export const ImageToImageSetting = ({
  enabled,
  onToggle,
  cardImageUrl,
  cardIsVideo = false,
  disabled = false,
  isGeneratingVideo = false,
}: ImageToImageSettingProps) => {
  // Three states: no image (disabled), image available (off), image available (on)
  const hasCardImage = !!cardImageUrl;
  const isDisabled = disabled || !hasCardImage;

  return (
    <div className="w-full inline-flex justify-start items-start gap-2">
      <div className="inline-flex flex-col justify-center items-center">
        <Switch
          checked={enabled && hasCardImage}
          onCheckedChange={(checked) =>
            hasCardImage && !disabled && onToggle(checked)
          }
          disabled={isDisabled}
          size="small"
          className={cn(
            // Override default off state background to match design
            "data-[state=unchecked]:bg-alpha-80/20",
          )}
        />
      </div>
      <div className="flex-1 inline-flex flex-col justify-center items-start gap-2">
        <div className="inline-flex justify-start items-center gap-2">
          <div
            className={`justify-center text-xs font-semibold leading-none ${
              isDisabled
                ? "text-text-info"
                : hasCardImage && !enabled
                  ? "text-text-primary opacity-60"
                  : "text-text-primary"
            }`}
          >
            {isGeneratingVideo ? "Image to video" : "Image to image"}
          </div>
        </div>
        <div className="self-stretch justify-start text-text-info text-xs font-normal">
          {isDisabled
            ? `Select an image to unlock ${isGeneratingVideo ? "video generation" : "transformation"}`
            : `${isGeneratingVideo ? "Generate a video from" : "Transform"} the selected image based on your prompt`}
        </div>
      </div>
      <div
        className={`w-16 h-16 rounded-lg flex items-center justify-center ${
          hasCardImage ? "overflow-hidden" : "bg-background-surface-4"
        } ${hasCardImage && !enabled ? "opacity-60" : ""}`}
      >
        {hasCardImage ? (
          <MediaDisplay
            src={cardImageUrl}
            alt="Card media"
            className="w-full h-full object-cover"
            isVideo={false} // Always show as image since we're showing thumbnails
            showControls={false}
            autoPlay={false}
            muted={true}
            loop={true}
            playOnHover={false}
            clickToToggle={false}
          />
        ) : (
          <div className="w-6 h-6 relative overflow-hidden flex items-center justify-center">
            <Image className="w-4 h-4 text-text-subtle" />
          </div>
        )}
      </div>
    </div>
  );
};
