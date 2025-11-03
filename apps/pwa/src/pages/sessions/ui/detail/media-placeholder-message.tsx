import { useState, useEffect } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { cn } from "@/shared/lib";
import { useAsset } from "@/shared/hooks/use-asset";
import { PlayButton, SvgIcon } from "@/shared/ui";
import { UniqueEntityID } from "@/shared/domain";
import { useQuery } from "@tanstack/react-query";
import { generatedImageQueries } from "@/entities/generated-image/api/query-factory";

interface MediaPlaceholderMessageProps {
  content: string; // The loading message like "🖼️ Generating image..."
  assetId?: string; // The asset ID once generated
  isVideo?: boolean; // Whether this is a video placeholder
  onDelete?: () => Promise<void>; // Delete callback
  onGenerateVideo?: () => Promise<void>; // Generate video from image callback
  isGeneratingVideo?: boolean; // Whether video is being generated
}

export const MediaPlaceholderMessage = ({
  content,
  assetId,
  isVideo = false,
  onDelete,
  onGenerateVideo,
  isGeneratingVideo = false,
}: MediaPlaceholderMessageProps) => {
  const [showVideo, setShowVideo] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [assetUrl, assetIsVideo] = useAsset(
    assetId ? new UniqueEntityID(assetId) : undefined,
  );

  // Get thumbnail for video
  const { data: generatedImageData } = useQuery({
    ...generatedImageQueries.list(),
    enabled: assetIsVideo && !!assetId,
    select: (images) => {
      // Find the generated image with matching assetId
      return images.find((img: any) => img.asset_id === assetId);
    },
  });

  // Get thumbnail URL if it's a video
  const [thumbnailUrl] = useAsset(
    assetIsVideo && generatedImageData?.thumbnail_asset_id
      ? new UniqueEntityID(generatedImageData.thumbnail_asset_id)
      : undefined,
  );

  // Use 16:9 aspect ratio for all media
  const aspectRatio = "16:9";
  const paddingBottom = `${(9 / 16) * 100}%`; // 56.25%

  const isLoading = !assetId || !assetUrl;

  // Reset loaded state when asset changes
  useEffect(() => {
    setImageLoaded(false);
    setThumbnailLoaded(false);
  }, [assetId]);

  return (
    <div className="group/media-placeholder relative px-[32px]">
      <div
        className={cn(
          "relative mx-auto w-full max-w-[890px] rounded-[8px]",
          "bg-background-container",
        )}
      >
        {isLoading ? (
          // Loading state
          <div className="relative flex flex-col items-center justify-center gap-4 p-[48px]">
            <Loader2 className="text-text-body h-8 w-8 animate-spin" />
            <div className="text-text-placeholder text-[16px] leading-[19px] font-[400]">
              {content}
            </div>

            {/* Delete button for loading state - always visible to allow canceling */}
            {onDelete && (
              <div
                className={cn(
                  "absolute top-[0px] -right-[42px] flex items-center gap-[8px]",
                  "bg-background-container/90 rounded-[6px] p-[6px] backdrop-blur-sm",
                  "shadow-lg",
                )}
              >
                <button
                  className="text-text-body hover:text-text-primary cursor-pointer transition-colors"
                  onClick={onDelete}
                  title="Cancel generation"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            )}
          </div>
        ) : (
          // Media display
          <div className="relative w-full">
            {assetIsVideo || isVideo ? (
              showVideo ? (
                // Show video when clicked
                <video
                  src={assetUrl}
                  controls
                  autoPlay
                  className="h-auto w-full rounded-[8px]"
                  style={{ maxHeight: "600px" }}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                // Show thumbnail with play button overlay
                <div
                  className="group relative cursor-pointer"
                  onClick={() => setShowVideo(true)}
                >
                  {/* Aspect ratio container 16:9 */}
                  <div
                    className="bg-background-container relative w-full overflow-hidden rounded-[8px]"
                    style={{
                      paddingBottom: "56.25%",
                      contain: "layout style paint",
                    }}
                  >
                    {/* Loading placeholder */}
                    {!thumbnailLoaded && (
                      <div className="from-background-container to-background-normal absolute inset-0 rounded-[8px] bg-gradient-to-br" />
                    )}
                    <img
                      src={thumbnailUrl || assetUrl}
                      alt="Video thumbnail"
                      className={cn(
                        "absolute inset-0 h-full w-full rounded-[8px] object-cover",
                        thumbnailLoaded ? "opacity-100" : "opacity-0",
                        "transition-opacity duration-300",
                      )}
                      loading="lazy"
                      decoding="async"
                      onLoad={() => setThumbnailLoaded(true)}
                    />
                    {/* Play button overlay - only show when thumbnail is loaded */}
                    {thumbnailLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-[8px]">
                        <PlayButton size="large" isPlaying={false} />
                      </div>
                    )}
                  </div>
                </div>
              )
            ) : (
              // Regular image with 16:9 aspect ratio container
              <div
                className="bg-background-container relative w-full overflow-hidden rounded-[8px]"
                style={{
                  paddingBottom: "56.25%",
                  contain: "layout style paint",
                }}
              >
                {/* Loading placeholder */}
                {!imageLoaded && (
                  <div className="from-background-container to-background-normal absolute inset-0 rounded-[8px] bg-gradient-to-br" />
                )}
                <img
                  src={assetUrl}
                  alt="Generated image"
                  className={cn(
                    "absolute inset-0 h-full w-full rounded-[8px] object-cover",
                    imageLoaded ? "opacity-100" : "opacity-0",
                    "transition-opacity duration-300",
                  )}
                  loading="lazy"
                  decoding="async"
                  onLoad={() => setImageLoaded(true)}
                  onError={(e) => {
                    console.error("Failed to load image:", assetUrl);
                    setImageLoaded(true); // Set to true to remove placeholder
                  }}
                />
              </div>
            )}

            {/* Action buttons on hover - positioned with offset */}
            {(onDelete || onGenerateVideo) && (
              <div
                className={cn(
                  "absolute top-[0px] -right-[42px] flex flex-col gap-[8px]",
                  "opacity-0 group-hover/media-placeholder:opacity-100",
                  "transition-opacity duration-200",
                )}
              >
                {/* Delete button */}
                {onDelete && (
                  <button
                    className={cn(
                      "text-text-body hover:text-text-primary cursor-pointer transition-colors",
                      "bg-background-container/90 rounded-[6px] p-[6px] backdrop-blur-sm",
                      "shadow-lg",
                    )}
                    onClick={onDelete}
                    title="Delete"
                  >
                    <Trash2 size={20} />
                  </button>
                )}

                {/* Generate Video button - show for both images (first generation) and videos (regeneration) */}
                {onGenerateVideo && (
                  <button
                    className={cn(
                      "text-text-body hover:text-text-primary cursor-pointer transition-colors",
                      "bg-background-container/90 rounded-[6px] p-[6px] backdrop-blur-sm",
                      "shadow-lg",
                      isGeneratingVideo && "pointer-events-none opacity-50",
                    )}
                    onClick={onGenerateVideo}
                    title={
                      assetIsVideo || isVideo
                        ? "Generate new video using original image"
                        : "Generate video from this image"
                    }
                    disabled={isGeneratingVideo}
                  >
                    {isGeneratingVideo ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <SvgIcon
                        name="video_gen"
                        className="max-h-5 max-w-5 opacity-70"
                      />
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
