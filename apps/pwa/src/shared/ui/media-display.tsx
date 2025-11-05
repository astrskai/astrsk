import { useEffect, useState } from "react";
import VideoDisplay from "./video-display";

export type PlayButtonIconSize = "small" | "medium" | "large";

interface MediaDisplayProps {
  src: string | null;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  fallbackSrc?: string;
  isVideo?: boolean; // Force video detection
  showControls?: boolean; // Whether to show play/pause button for videos
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playOnHover?: boolean; // Play when hovering
  clickToToggle?: boolean; // Click to play/pause
  playButtonSize?: PlayButtonIconSize;
}

/**
 * Media Display Component
 *
 * Automatically detects and displays either an image or video based on the source.
 * For video-only use cases, consider using VideoPlayer component directly.
 *
 * @example
 * ```tsx
 * // Auto-detect media type
 * <MediaDisplay src="/media/asset.mp4" />
 *
 * // Force video mode
 * <MediaDisplay src="/media/video" isVideo />
 *
 * // Image with fallback
 * <MediaDisplay
 *   src={userAvatar}
 *   fallbackSrc="/img/default-avatar.png"
 *   alt="User avatar"
 * />
 * ```
 */
export const MediaDisplay = ({
  src,
  alt = "",
  className = "",
  width,
  height,
  fallbackSrc,
  isVideo: forceIsVideo,
  showControls = true,
  autoPlay = false,
  muted = true,
  loop = true,
  playOnHover = false,
  clickToToggle = false,
  playButtonSize,
}: MediaDisplayProps) => {
  const [isVideo, setIsVideo] = useState(forceIsVideo || false);

  // Detect if source is a video
  useEffect(() => {
    // If forceIsVideo is provided, use it
    if (forceIsVideo !== undefined) {
      setIsVideo(forceIsVideo);
      return;
    }

    if (!src) {
      setIsVideo(false);
      return;
    }

    // Check for video extensions
    const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi"];
    const hasVideoExtension = videoExtensions.some((ext) =>
      src.toLowerCase().includes(ext),
    );

    // Check for video mime type in blob URLs
    const hasVideoMime = src.includes("video/");

    setIsVideo(hasVideoExtension || hasVideoMime);
  }, [src, forceIsVideo]);

  const displaySrc = src || fallbackSrc || "";

  if (!displaySrc) {
    return null;
  }

  if (isVideo) {
    return (
      <VideoDisplay
        src={displaySrc}
        className={className}
        width={width}
        height={height}
        showControls={showControls}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playOnHover={playOnHover}
        clickToToggle={clickToToggle}
        playButtonSize={playButtonSize}
      />
    );
  }

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      width={width}
      height={height}
    />
  );
};

export default MediaDisplay;
