import { useState, useEffect, useRef } from "react";
import { UniqueEntityID } from "@/shared/domain";
import { GeneratedImage } from "@/entities/generated-image/domain";
import { useAsset } from "@/app/hooks/use-asset";
import { Loader2, Download, Type, Copy, Video } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  PlayButton,
} from "@/shared/ui";

interface ImageItemProps {
  image: GeneratedImage;
  isGenerating?: boolean;
  isSelected?: boolean;
  onDownload: (url: string, prompt: string, isVideo: boolean) => void;
  onSelect: (imageUrl: string, assetId: UniqueEntityID) => void;
}

export const ImageItem = ({
  image,
  isGenerating,
  isSelected,
  onDownload,
  onSelect,
}: ImageItemProps) => {
  const [assetUrl] = useAsset(image.assetId);
  const [thumbnailUrl] = useAsset(image.thumbnailAssetId); // Load thumbnail for videos
  const [isVideo, setIsVideo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false); // Track if video has been loaded
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check if the asset is a video based on mediaType or URL
  useEffect(() => {
    // First check if mediaType is explicitly set
    if (image.mediaType === "video") {
      setIsVideo(true);
      return;
    }

    // Fallback to URL-based detection for older assets without mediaType
    if (assetUrl) {
      // Check common video extensions or mime types
      const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi"];
      const hasVideoExtension = videoExtensions.some((ext) =>
        assetUrl.toLowerCase().includes(ext),
      );

      // Check if it contains video mime type in URL (for blob URLs)
      const hasVideoMime = assetUrl.includes("video/");

      const detectedAsVideo = hasVideoExtension || hasVideoMime;
      setIsVideo(detectedAsVideo);
    }
  }, [assetUrl, image.mediaType]);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();

    // If video hasn't been loaded yet, load it first
    if (!videoLoaded) {
      setVideoLoaded(true);
      // After state update, the video element will be rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play();
          setIsPlaying(true);
        }
      }, 100);
    } else if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div
      className="bg-background-surface-0 relative h-32 w-16 cursor-pointer overflow-hidden"
      onClick={() => {
        if (assetUrl) {
          onSelect(assetUrl, image.assetId);
        }
      }}
    >
      {isGenerating ? (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="text-text-subtle h-8 w-8 animate-spin" />
        </div>
      ) : assetUrl ? (
        <>
          {isVideo ? (
            <>
              {/* Show thumbnail or video based on loading state */}
              {!videoLoaded && thumbnailUrl ? (
                // Show thumbnail until video is loaded
                <img
                  src={thumbnailUrl}
                  alt={image.prompt}
                  className="h-full w-full object-cover"
                />
              ) : videoLoaded ? (
                // Show actual video when loaded
                <video
                  ref={videoRef}
                  src={assetUrl}
                  className="h-full w-full object-cover"
                  loop
                  muted
                  playsInline
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              ) : (
                // Fallback if no thumbnail available
                <div className="bg-background-surface-4 flex h-full w-full items-center justify-center">
                  <Video className="text-text-subtle h-8 w-8" />
                </div>
              )}

              {/* Video play/pause button - always visible */}
              <PlayButton
                size="small"
                isPlaying={isPlaying}
                onClick={handlePlayPause}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform"
              />
            </>
          ) : (
            <img
              src={assetUrl}
              alt={image.prompt}
              className="h-full w-full object-cover"
            />
          )}

          {/* Selected border overlay using inset */}
          {isSelected && (
            <div className="border-text-primary pointer-events-none absolute inset-0 border-[3px]" />
          )}
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-text-subtle text-xs">Failed to load</div>
        </div>
      )}

      {/* Download button and Prompt tooltip */}
      <div className="absolute right-1 bottom-1 flex gap-1">
        {/* Download button (for all media types) */}
        {assetUrl && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload(assetUrl, image.prompt, isVideo);
            }}
            className="bg-background-surface-4/50 hover:bg-background-surface-4/70 rounded-md p-1 transition-colors"
            title={isVideo ? "Download video" : "Download image"}
          >
            <Download className="text-text-primary h-3 w-3" />
          </button>
        )}

        {/* Media type indicator and prompt tooltip */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-background-surface-4/50 inline-flex items-center justify-start gap-2 rounded-md p-1">
                <div className="relative h-3 w-3 overflow-hidden">
                  <Type className="text-text-primary h-3 w-3" />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="relative pr-8 pb-6">
              <p className="max-w-xs pr-2 pb-2 text-xs">{image.prompt}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(image.prompt);
                }}
                className="hover:bg-background-surface-4 absolute right-1 bottom-1 rounded p-1 transition-colors"
                title="Copy prompt"
              >
                <Copy className="text-text-primary h-3 w-3" />
              </button>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
