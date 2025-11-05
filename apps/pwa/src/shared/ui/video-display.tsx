import { useState, useRef } from "react";
import { cn } from "@/shared/lib";
import { PlayButton } from "./play-button";

export type PlayButtonIconSize = "small" | "medium" | "large";

interface VideoDisplayProps {
  /** Video source URL */
  src: string;
  /** Optional className for styling */
  className?: string;
  /** Optional width */
  width?: number;
  /** Optional height */
  height?: number;
  /** Whether to show play/pause button overlay (default: true) */
  showControls?: boolean;
  /** Auto-play on mount (default: false) */
  autoPlay?: boolean;
  /** Muted audio (default: true) */
  muted?: boolean;
  /** Loop playback (default: true) */
  loop?: boolean;
  /** Play when hovering over video (default: false) */
  playOnHover?: boolean;
  /** Click anywhere to play/pause (default: false) */
  clickToToggle?: boolean;
  /** Play button icon size */
  playButtonSize?: PlayButtonIconSize;
}

/**
 * Video Display Component
 *
 * Displays a video with interactive controls, hover-to-play, and click-to-toggle functionality.
 *
 * @example
 * ```tsx
 * // Basic usage with controls
 * <VideoDisplay src="/videos/demo.mp4" />
 *
 * // Auto-play with hover controls
 * <VideoDisplay
 *   src="/videos/preview.mp4"
 *   autoPlay
 *   playOnHover
 *   showControls={false}
 * />
 *
 * // Click to toggle playback
 * <VideoDisplay
 *   src="/videos/tutorial.mp4"
 *   clickToToggle
 *   showControls={false}
 * />
 * ```
 */
export default function VideoDisplay({
  src = "",
  className = "",
  width,
  height = 0,
  showControls = true,
  autoPlay = false,
  muted = true,
  loop = true,
  playOnHover = false,
  clickToToggle = false,
  playButtonSize = "medium",
}: VideoDisplayProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isClickPlaying, setIsClickPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (videoRef.current) {
      if (isPlaying || isClickPlaying) {
        videoRef.current.pause();
        setIsClickPlaying(false);
      } else {
        videoRef.current.play();
        setIsClickPlaying(true);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Don't handle click if showControls is enabled (play button handles it)
    if (showControls || !clickToToggle || !videoRef.current) return;

    e.stopPropagation();
    e.preventDefault();

    if (isClickPlaying) {
      videoRef.current.pause();
      setIsClickPlaying(false);
    } else {
      videoRef.current.play();
      setIsClickPlaying(true);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (!playOnHover || !videoRef.current || isClickPlaying) return;
    videoRef.current.play();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (!playOnHover || !videoRef.current || isClickPlaying) return;
    videoRef.current.pause();
  };

  return (
    <div
      className="group relative h-full w-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <video
        ref={videoRef}
        src={src}
        className={className}
        width={width}
        height={height}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      {showControls && (
        <PlayButton
          size={playButtonSize}
          isPlaying={isPlaying || isClickPlaying}
          onClick={handlePlayPause}
          className={cn(
            "pointer-events-auto absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 transform",
            "opacity-0 group-hover:opacity-100",
            isHovered && "opacity-100",
          )}
          style={{ pointerEvents: "auto" }}
        />
      )}
    </div>
  );
}
