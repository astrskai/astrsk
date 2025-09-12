import { useEffect, useState, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/shared/utils';

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
}

export const MediaDisplay = ({ 
  src, 
  alt = '', 
  className = '', 
  width, 
  height, 
  fallbackSrc,
  isVideo: forceIsVideo,
  showControls = true,
  autoPlay = false,
  muted = true,
  loop = true,
  playOnHover = false,
  clickToToggle = false
}: MediaDisplayProps) => {
  const [isVideo, setIsVideo] = useState(forceIsVideo || false);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isClickPlaying, setIsClickPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    const hasVideoExtension = videoExtensions.some(ext => 
      src.toLowerCase().includes(ext)
    );
    
    // Check for video mime type in blob URLs
    const hasVideoMime = src.includes('video/');
    
    setIsVideo(hasVideoExtension || hasVideoMime);
  }, [src, forceIsVideo]);

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

  const displaySrc = src || fallbackSrc || '';

  if (!displaySrc) {
    return null;
  }

  if (isVideo) {
    return (
      <div 
        className="relative w-full h-full group"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        <video
          ref={videoRef}
          src={displaySrc}
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
          <button
            onClick={handlePlayPause}
            className={cn(
              "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
              "bg-black/60 backdrop-blur-sm rounded-full p-3",
              "hover:bg-black/70 transition-all duration-200",
              "z-10 pointer-events-auto",
              "opacity-0 group-hover:opacity-100",
              isHovered && "opacity-100"
            )}
            style={{ pointerEvents: 'auto' }}
          >
            {(isPlaying || isClickPlaying) ? (
              <Pause className="min-w-6 min-h-6 text-white" />
            ) : (
              <Play className="min-w-6 min-h-6 text-white ml-0.5" />
            )}
          </button>
        )}
      </div>
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