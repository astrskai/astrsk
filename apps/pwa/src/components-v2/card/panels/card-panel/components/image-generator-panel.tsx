import { useState, useEffect, useCallback, useRef } from "react";
import { UniqueEntityID } from "@/shared/domain";
import { Button } from "@/components-v2/ui/button";
import { Textarea } from "@/components-v2/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components-v2/ui/select";
import { Loader2, Download, Sparkles, Upload, Image, Type, Copy, Play, Pause, Video } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components-v2/ui/tooltip";
import { Switch } from "@/components-v2/ui/switch";
import { GeneratedImageService } from "@/app/services/generated-image-service";
import { GeneratedImage } from "@/modules/generated-image/domain";
import { useAsset } from "@/app/hooks/use-asset";
import { MediaDisplay } from "@/components-v2/shared/media-display";
import { 
  CardPanelProps, 
  CardPanelLoading, 
  CardPanelError,
  useCardPanel 
} from "@/components-v2/card/panels/hooks/use-card-panel";
import { useResourceData } from "@/components-v2/right-navigation/vibe-panel/hooks/use-resource-data";
import { useAppStore, Page } from "@/app/stores/app-store";
import { CardType } from "@/modules/card/domain";
import { CardDrizzleMapper } from "@/modules/card/mappers/card-drizzle-mapper";
import { useNanoBananaGenerator, CustomImageResponse, ImageToImageResponse } from "@/app/hooks/use-nano-banana-generator";
import { useSeedreamGenerator, SeedreamImageResponse, SeedreamI2IResponse } from "@/app/hooks/use-seedream-generator";
import { useSeedanceGenerator, SeedanceVideoResponse } from "@/app/hooks/use-seedance-generator";
import { useUpdateCardIconAsset } from "@/app/queries/card/mutations";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { generatedImageQueries, generatedImageKeys } from "@/app/queries/generated-image/query-factory";
import { cn } from "@/shared/utils";
import { useModelStore, IMAGE_MODELS } from "@/app/stores/model-store";
import { toast } from "sonner";

interface ImageGeneratorPanelProps extends CardPanelProps {}

// Image to Image Setting Component
const ImageToImageSetting = ({
  enabled,
  onToggle,
  cardImageUrl,
  cardIsVideo = false,
  disabled = false
}: {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  cardImageUrl?: string;
  cardIsVideo?: boolean;
  disabled?: boolean;
}) => {
  // Three states: no image (disabled), image available (off), image available (on)
  const hasCardImage = !!cardImageUrl;
  const isDisabled = disabled || !hasCardImage;

  return (
    <div className="w-full inline-flex justify-start items-start gap-2">
      <div className="inline-flex flex-col justify-center items-center">
        <Switch
          checked={enabled && hasCardImage}
          onCheckedChange={(checked) => hasCardImage && !disabled && onToggle(checked)}
          disabled={isDisabled}
          size="small"
          className={cn(
            // Override default off state background to match design
            "data-[state=unchecked]:bg-alpha-80/20"
          )}
        />
      </div>
      <div className="flex-1 inline-flex flex-col justify-center items-start gap-2">
        <div className="inline-flex justify-start items-center gap-2">
          <div className={`justify-center text-xs font-semibold leading-none ${
            isDisabled 
              ? 'text-text-info' 
              : hasCardImage && !enabled 
                ? 'text-text-primary opacity-60'
                : 'text-text-primary'
          }`}>
            {cardIsVideo ? 'Video to video' : 'Image to image'}
          </div>
        </div>
        <div className="self-stretch justify-start text-text-info text-xs font-normal">
          {isDisabled ? `Select ${cardIsVideo ? 'a video' : 'an image'} to unlock transformation` : `Transform the selected ${cardIsVideo ? 'video' : 'image'} based on your prompt`}
        </div>
      </div>
      <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${
        hasCardImage ? 'overflow-hidden' : 'bg-background-surface-4'
      } ${hasCardImage && !enabled ? 'opacity-60' : ''}`}>
        {hasCardImage ? (
          <MediaDisplay
            src={cardImageUrl}
            alt="Card media"
            className="w-full h-full object-cover"
            isVideo={cardIsVideo}
            showControls={true}
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

// Media item component (supports both images and videos)
const ImageItem = ({ 
  image, 
  isGenerating,
  isSelected,
  onDownload,
  onUseAsCardImage,
  onSelect
}: { 
  image: GeneratedImage; 
  isGenerating?: boolean;
  isSelected?: boolean;
  onDownload: (url: string, prompt: string, isVideo: boolean) => void;
  onUseAsCardImage: (imageUrl: string, assetId: UniqueEntityID) => void;
  onSelect: (imageUrl: string, assetId: UniqueEntityID) => void;
}) => {
  const [assetUrl] = useAsset(image.assetId);
  const [thumbnailUrl] = useAsset(image.thumbnailAssetId); // Load thumbnail for videos
  const [isVideo, setIsVideo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false); // Track if video has been loaded
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check if the asset is a video based on mediaType or URL
  useEffect(() => {
    // First check if mediaType is explicitly set
    if (image.mediaType === 'video') {
      setIsVideo(true);
      return;
    }
    
    // Fallback to URL-based detection for older assets without mediaType
    if (assetUrl) {
      // Check common video extensions or mime types
      const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
      const hasVideoExtension = videoExtensions.some(ext => assetUrl.toLowerCase().includes(ext));
      
      // Check if it contains video mime type in URL (for blob URLs)
      const hasVideoMime = assetUrl.includes('video/');
      
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
      className="relative bg-background-surface-0 overflow-hidden w-16 h-32 cursor-pointer"
      onClick={() => {
        if (assetUrl) {
          onSelect(assetUrl, image.assetId);
        }
      }}
    >
      {isGenerating ? (
        <div className="w-full h-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-text-subtle" />
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
                  className="w-full h-full object-cover"
                />
              ) : videoLoaded ? (
                // Show actual video when loaded
                <video
                  ref={videoRef}
                  src={assetUrl}
                  className="w-full h-full object-cover"
                  loop
                  muted
                  playsInline
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              ) : (
                // Fallback if no thumbnail available
                <div className="w-full h-full bg-background-surface-4 flex items-center justify-center">
                  <Video className="w-8 h-8 text-text-subtle" />
                </div>
              )}
              
              {/* Video play/pause button - always visible */}
              <button
                onClick={handlePlayPause}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white/90 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-black/80" />
                ) : (
                  <Play className="w-4 h-4 text-black/80" />
                )}
              </button>
            </>
          ) : (
            <img
              src={assetUrl}
              alt={image.prompt}
              className="w-full h-full object-cover"
            />
          )}
          {/* Selected border overlay using inset */}
          {isSelected && (
            <div className="absolute inset-0 border-[3px] border-text-primary pointer-events-none" />
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-text-subtle text-xs">Failed to load</div>
        </div>
      )}
      
      {/* Download button and Prompt tooltip */}
      <div className="absolute bottom-1 right-1 flex gap-1">
        {/* Download button (for all media types) */}
        {assetUrl && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload(assetUrl, image.prompt, isVideo);
            }}
            className="p-1 bg-background-surface-4/50 rounded-md hover:bg-background-surface-4/70 transition-colors"
            title={isVideo ? "Download video" : "Download image"}
          >
            <Download className="w-3 h-3 text-text-primary" />
          </button>
        )}
        
        {/* Media type indicator and prompt tooltip */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-1 bg-background-surface-4/50 rounded-md inline-flex justify-start items-center gap-2">
                <div className="w-3 h-3 relative overflow-hidden">
                  {isVideo ? (
                    <Video className="w-3 h-3 text-text-primary" />
                  ) : (
                    <Type className="w-3 h-3 text-text-primary" />
                  )}                
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="relative pr-8 pb-6">
              <p className="text-xs max-w-xs pr-2 pb-2">{image.prompt}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(image.prompt);
                }}
                className="absolute bottom-1 right-1 p-1 hover:bg-background-surface-4 rounded transition-colors"
                title="Copy prompt"
              >
                <Copy className="w-3 h-3 text-text-subtle hover:text-text-primary transition-colors" />
              </button>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export function ImageGeneratorPanel({ cardId }: ImageGeneratorPanelProps) {
  // Card data hook
  const { card } = useCardPanel({ cardId });
  
  // Get app state for resource gathering
  const activePage = useAppStore((state) => state.activePage);
  const isCardPage = activePage === Page.Cards || activePage === Page.CardPanel;
  
  // Resource data gathering (same pattern as AI panel)
  const {
    resourceType,
    resourceName,
    editableData,
    selectedCard,
  } = useResourceData({
    selectedCardId: cardId,
    selectedFlowId: null,
    isCardPage,
    isFlowPage: false,
  });
  
  // Query client for invalidation
  const queryClient = useQueryClient();
  
  // Query for all generated images (global resource)
  const { data: generatedImages = [], isLoading, error } = useQuery({
    ...generatedImageQueries.list(),
  });

  // Sync selected state with current card icon
  useEffect(() => {
    if (card?.props?.iconAssetId) {
      setSelectedImageAssetId(card.props.iconAssetId.toString());
    } else {
      setSelectedImageAssetId(undefined);
    }
  }, [card?.props?.iconAssetId]);
  
  // Nano banana generator hook
  const { generateCustomImage, generateImageToImage } = useNanoBananaGenerator();
  
  // Seedream generator hook
  const { generateSeedreamImage, generateSeedreamImageToImage } = useSeedreamGenerator();
  
  // Seedance video generator hook
  const { generateSeedanceVideo, generateSeedanceImageToVideo, checkVideoStatus } = useSeedanceGenerator();
  
  // Card icon asset mutation
  const updateCardIconAsset = useUpdateCardIconAsset(cardId);
  
  // Card icon asset hook - returns [url, isVideo]
  const [cardIconAssetUrl, cardIconIsVideo] = useAsset(card?.props?.iconAssetId);
  
  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("photorealistic"); // Hidden but functional
  const [selectedAspectRatio, setSelectedAspectRatio] = useState("2:3"); // Hidden but functional
  const [useCardImage, setUseCardImage] = useState(false); // Switch to use card image as input
  
  // Use global model store instead of local state
  const selectedModel = useModelStore.use.selectedImageModel();
  const setSelectedModel = useModelStore.use.setSelectedImageModel();
  
  // Local form state
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatingImages, setGeneratingImages] = useState<Set<string>>(new Set());
  const [selectedImageAssetId, setSelectedImageAssetId] = useState<string | undefined>(undefined);
  
  // Video generation polling state
  const [videoGenerationStatus, setVideoGenerationStatus] = useState<string>("");
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const processedTaskIds = useRef<Set<string>>(new Set()); // Track processed tasks to prevent duplicates
  
  // Video-specific settings
  const [videoDuration, setVideoDuration] = useState<number>(3); // Default 3 seconds
  const [videoLoop, setVideoLoop] = useState<boolean>(false); // For image-to-video loop option
  
  // Image-to-image state
  const [inputImage, setInputImage] = useState<File | null>(null);
  const [inputImagePreview, setInputImagePreview] = useState<string | null>(null);
  const [generationMode, setGenerationMode] = useState<'text-to-image' | 'image-to-image'>('text-to-image');

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Function to invalidate and refresh global images
  const refreshGlobalImages = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: generatedImageKeys.lists(),
    });
  }, [queryClient]);

  // Change handlers
  const handlePromptChange = useCallback((value: string) => {
    setImagePrompt(value);
  }, []);

  // Style options (hidden but functional)
  const styleOptions = [
    { value: "photorealistic", label: "Photorealistic" },
    { value: "artistic", label: "Artistic" },
    { value: "cartoon", label: "Cartoon" },
    { value: "anime", label: "Anime" },
    { value: "oil painting", label: "Oil Painting" },
    { value: "watercolor", label: "Watercolor" },
    { value: "digital art", label: "Digital Art" },
    { value: "vintage", label: "Vintage" },
    { value: "minimalist", label: "Minimalist" },
    { value: "abstract", label: "Abstract" },
  ];

  const aspectRatioOptions = [
    { value: "2:3", label: "Card Size (2:3)" },
    { value: "1:1", label: "Square (1:1)" },
    { value: "16:9", label: "Widescreen (16:9)" },
    { value: "9:16", label: "Portrait (9:16)" },
    { value: "4:3", label: "Classic (4:3)" },
    { value: "3:4", label: "Portrait Classic (3:4)" },
    { value: "2:1", label: "Panoramic (2:1)" },
    { value: "1:2", label: "Tall Portrait (1:2)" },
  ];


  // File upload handler
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;

    try {
      const result = await GeneratedImageService.saveFileToGeneratedImage.execute({
        file,
        prompt: file.name.replace(/\.[^/.]+$/, ""), // Use filename without extension as prompt
        style: selectedStyle,
        aspectRatio: selectedAspectRatio,
        associatedCardId: cardId ? new UniqueEntityID(cardId) : undefined,
      });

      if (result.isSuccess) {
        // Invalidate queries to refresh the image list
        await refreshGlobalImages();
      } else {
        console.error("Failed to upload file:", result.getError());
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  }, [selectedStyle, selectedAspectRatio, cardId, refreshGlobalImages]);

  // Poll for video generation status
  const pollVideoStatus = useCallback(async (taskId: string) => {
    // Check if this task has already been processed
    if (processedTaskIds.current.has(taskId)) {
      return;
    }
    
    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Start polling every 5 seconds
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const statusResult = await checkVideoStatus({ taskId });
        setVideoGenerationStatus(statusResult.status);

        if (statusResult.status === "succeeded" && statusResult.video) {
          // Check again if already processed (in case of race condition)
          if (processedTaskIds.current.has(taskId)) {
            clearInterval(pollingIntervalRef.current!);
            pollingIntervalRef.current = null;
            setCurrentTaskId(null);
            setVideoGenerationStatus("");
            setIsGenerating(false);
            return;
          }
          
          // Mark as processed IMMEDIATELY to prevent duplicate saves
          processedTaskIds.current.add(taskId);
          
          // Video is ready!
          clearInterval(pollingIntervalRef.current!);
          pollingIntervalRef.current = null;
          setCurrentTaskId(null);
          setVideoGenerationStatus("");
          
          // Process the video
          try {
            const videoData = statusResult.video;
            // Fetch the video from the storage URL to convert to File
            const response = await fetch(videoData.url);
            const blob = await response.blob();
            const file = new File([blob], `seedance-${videoData.id}.mp4`, { type: videoData.mimeType || "video/mp4" });

            // Save to GeneratedImageService (it handles all media types)
            const saveResult = await GeneratedImageService.saveFileToGeneratedImage.execute({
              file,
              prompt: imagePrompt,
              style: selectedStyle,
              aspectRatio: selectedAspectRatio,
              associatedCardId: cardId ? new UniqueEntityID(cardId) : undefined,
            });

            if (saveResult.isSuccess) {
              await refreshGlobalImages();
              toast.success("Video generated and saved successfully!");
            } else {
              console.error("❌ [VIDEO-GENERATOR] Failed to save video:", saveResult.getError());
              toast.error("Failed to save video", {
                description: saveResult.getError()
              });
            }
          } catch (videoError) {
            console.error("❌ [VIDEO-GENERATOR] Error processing video:", videoError);
            toast.error("Error processing video", {
              description: videoError instanceof Error ? videoError.message : "Unknown error occurred"
            });
          }
          
          setIsGenerating(false);
        } else if (statusResult.status === "failed") {
          // Mark as processed even on failure to prevent retrying
          processedTaskIds.current.add(taskId);
          
          // Video generation failed
          clearInterval(pollingIntervalRef.current!);
          pollingIntervalRef.current = null;
          setCurrentTaskId(null);
          setVideoGenerationStatus("");
          
          console.error("❌ [VIDEO-GENERATOR] Video generation failed:", statusResult.error);
          toast.error("Video generation failed", {
            description: statusResult.error || "Video generation failed. Please try again."
          });
          
          setIsGenerating(false);
        }
        // If status is "queued" or "running", keep polling...
      } catch (error) {
        console.error("❌ [VIDEO-POLLING] Error checking status:", error);
        // Keep polling unless it's a critical error
      }
    }, 5000); // Poll every 5 seconds
  }, [checkVideoStatus, imagePrompt, selectedStyle, selectedAspectRatio, cardId, refreshGlobalImages, setIsGenerating]);

  // Helper function to convert image URL to base64 with aggressive size reduction
  const urlToBase64 = useCallback(async (url: string): Promise<{ base64: string; mimeType: string }> => {
    const response = await fetch(url);
    const blob = await response.blob();
    
    // Create canvas to resize image very aggressively
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      
      img.onload = () => {
        // Set small dimensions - max 256px for better quality while staying under token limit
        const MAX_SIZE = 256*4;
        let { width, height } = img;
        
        if (width > height) {
          if (width > MAX_SIZE) {
            height = (height * MAX_SIZE) / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = (width * MAX_SIZE) / height;
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress very aggressively
        ctx!.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with very high compression (0.1 quality)
        canvas.toBlob(
          (compressedBlob) => {
            if (!compressedBlob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              const base64 = result.split(',')[1];
              const mimeType = 'image/jpeg';
              
              resolve({ base64, mimeType });
            };
            reader.onerror = reject;
            reader.readAsDataURL(compressedBlob);
          },
          'image/jpeg',
          0.1 // Very low quality for maximum compression
        );
      };
      
      img.onerror = reject;
      img.crossOrigin = 'anonymous'; // Handle CORS
      img.src = url;
    });
  }, []);

  // Nano banana image generation function
  const handleGenerateImage = useCallback(async () => {
    if (!imagePrompt.trim()) return;

    // Check if we need card image but it's not available
    if (useCardImage && !cardIconAssetUrl) {
      toast("Card image is required but not available. Please upload an image to the card first.");
      return;
    }

    setIsGenerating(true);
    
    try {
      // Generate enhanced prompt with card data
      let enhancedPrompt = imagePrompt;
      
      if (selectedCard) {
        // Convert card to JSON using drizzle mapper
        const cardJson = CardDrizzleMapper.toPersistence(selectedCard);
        
        // Add card context to prompt
        enhancedPrompt = `This is the card data in JSON format:
${JSON.stringify(cardJson, null, 2)}

Based on this card data and the user's request, generate an image: ${imagePrompt}`;
      }
      
      let result: CustomImageResponse | ImageToImageResponse | SeedreamImageResponse | SeedreamI2IResponse | SeedanceVideoResponse;

      // Check if we should generate video (Seedance Pro or Lite)
      const isVideoModel = selectedModel === IMAGE_MODELS.SEEDANCE_1_0 || selectedModel === IMAGE_MODELS.SEEDANCE_LITE_1_0;
      
      if (isVideoModel) {
        let taskResult;
        
        // Determine the model to use based on selection
        const modelId = selectedModel === IMAGE_MODELS.SEEDANCE_LITE_1_0 
          ? (useCardImage ? "seedance-1-0-lite-i2v-250428" : "seedance-1-0-lite-t2v-250428")
          : "seedance-1-0-pro-250528"; // Pro model for both t2v and i2v
        
        if (useCardImage && cardIconAssetUrl) {
          // Image-to-video generation - convert to base64 for blob URLs
          const { base64, mimeType } = await urlToBase64(cardIconAssetUrl);
          
          // Call image-to-video endpoint with base64 image
          // Only pass loop parameter for Lite model (Pro doesn't support it)
          const i2vParams: {
            image: string;
            prompt?: string;
            model: string;
            duration: number;
            loop?: boolean;
          } = {
            image: `data:${mimeType};base64,${base64}`,
            prompt: enhancedPrompt || undefined,
            model: modelId,
            duration: videoDuration,
          };
          
          // Only add loop parameter for Lite model
          if (selectedModel === IMAGE_MODELS.SEEDANCE_LITE_1_0) {
            i2vParams.loop = videoLoop;
          }
          
          taskResult = await generateSeedanceImageToVideo(i2vParams);
          
          const modelName = selectedModel === IMAGE_MODELS.SEEDANCE_LITE_1_0 ? "Lite" : "Pro";
          toast.info(`Image-to-video generation started (${modelName})`, {
            description: "Transforming your image into a video. This may take a few minutes..."
          });
        } else {
          // Text-to-video generation
          taskResult = await generateSeedanceVideo({
            prompt: enhancedPrompt,
            model: modelId, // Pass the appropriate model
            duration: videoDuration, // Pass the duration setting
          });
          
          const modelName = selectedModel === IMAGE_MODELS.SEEDANCE_LITE_1_0 ? "Lite" : "Pro";
          toast.info(`Video generation started (${modelName})`, {
            description: "Your video is being generated. This may take a few minutes..."
          });
        }

        if (taskResult.success && taskResult.taskId) {
          // Start polling for video status
          setCurrentTaskId(taskResult.taskId);
          setVideoGenerationStatus("queued");
          
          // Start polling in the background
          pollVideoStatus(taskResult.taskId); // Don't await - let it run in background
          
          // Return early - polling will handle the rest
          // IMPORTANT: Don't process the result further to avoid duplicate saves
          // NOTE: We don't set isGenerating to false here - polling will handle it
          return;
        } else {
          // Handle immediate error
          result = taskResult;
          setIsGenerating(false); // Set to false for immediate errors
        }
      } else if (selectedModel === IMAGE_MODELS.SEEDDREAM_4_0) {
        // Use Seedream model
        if (useCardImage && cardIconAssetUrl) {
          // Seedream image-to-image - convert to base64 for blob URLs
          const { base64, mimeType } = await urlToBase64(cardIconAssetUrl);
          
          // Send as base64 data URL
          result = await generateSeedreamImageToImage({
            prompt: enhancedPrompt,
            image: `data:${mimeType};base64,${base64}`,
            size: "1368x2048",
            watermark: true,
          });
        } else {
          // Seedream text-to-image
          result = await generateSeedreamImage({
            prompt: enhancedPrompt,
            size: "1368x2048",
            watermark: true,
            sequentialImageGeneration: "disabled",
          });
        }
      } else {
        // Use Nano Banana model (default)
        if (useCardImage && cardIconAssetUrl) {
          // Image-to-image generation using card image
          const { base64, mimeType } = await urlToBase64(cardIconAssetUrl);

          result = await generateImageToImage({
            inputImageBase64: base64,
            inputImageMimeType: mimeType,
            prompt: enhancedPrompt,
            style: selectedStyle,
            aspectRatio: selectedAspectRatio,
          });
        } else {
          // Regular text-to-image generation
          result = await generateCustomImage({
            prompt: enhancedPrompt,
            style: selectedStyle,
            aspectRatio: selectedAspectRatio,
          });
        }
      }

      // Note: Videos are always handled through polling (see above), never immediately
      // Only process immediate image results here
      if (result.success && ('images' in result && result.images && result.images.length > 0)) {
        if ('images' in result && result.images) {
          // Process each generated image
          for (const imageData of result.images) {
            try {
            // Fetch the image from the storage URL to convert to File for GeneratedImageService
            const response = await fetch(imageData.url);
            const blob = await response.blob();
            const file = new File([blob], `nano-banana-${imageData.id}.png`, { type: imageData.mimeType || "image/png" });

            // Save to GeneratedImageService with card association
            // Always use the original user prompt (not the enhanced prompt with card context)
            const saveResult = await GeneratedImageService.saveFileToGeneratedImage.execute({
              file,
              prompt: imagePrompt, // Always use the original user input
              style: 'style' in imageData ? (imageData.style || selectedStyle) : selectedStyle,
              aspectRatio: 'aspectRatio' in imageData ? (imageData.aspectRatio || selectedAspectRatio) : selectedAspectRatio,
              associatedCardId: cardId ? new UniqueEntityID(cardId) : undefined,
            });

            if (saveResult.isSuccess) {
              // Invalidate queries to refresh the image list
              await refreshGlobalImages();
            } else {
              console.error("❌ [IMAGE-GENERATOR] Failed to save image:", saveResult.getError());
              toast.error("Failed to save image", {
                description: saveResult.getError()
              });
            }
            } catch (imageError) {
              console.error("❌ [IMAGE-GENERATOR] Error processing image:", imageError);
              toast.error("Error processing image", {
                description: imageError instanceof Error ? imageError.message : "Unknown error occurred"
              });
            }
          }
          // Only set isGenerating to false for successful image generation
          setIsGenerating(false);
        }
      } else {
        const isVideo = selectedModel === IMAGE_MODELS.SEEDANCE_1_0 || selectedModel === IMAGE_MODELS.SEEDANCE_LITE_1_0;
        const mediaType = isVideo ? "Video" : "Image";
        console.error(`❌ [${mediaType.toUpperCase()}-GENERATOR] No ${mediaType.toLowerCase()}s generated or generation failed:`, result.error);
        // Show detailed error message
        toast.error(`${mediaType} generation failed`, {
          description: result.error || `No ${mediaType.toLowerCase()}s were generated. This may be due to content policy restrictions or technical issues.`
        });
        // Set isGenerating to false for failed generation
        setIsGenerating(false);
      }
      
    } catch (error) {
      const isVideo = selectedModel === IMAGE_MODELS.SEEDANCE_1_0 || selectedModel === IMAGE_MODELS.SEEDANCE_LITE_1_0;
      const mediaType = isVideo ? "Video" : "Image";
      console.error(`❌ [${mediaType.toUpperCase()}-GENERATOR] Error generating ${mediaType.toLowerCase()}:`, error);
      // Show detailed error message
      toast.error(`${mediaType} generation failed`, {
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again."
      });
      // Set isGenerating to false for exceptions
      setIsGenerating(false);
    }
  }, [imagePrompt, selectedStyle, selectedAspectRatio, generateCustomImage, generateImageToImage, generateSeedreamImage, generateSeedreamImageToImage, generateSeedanceVideo, pollVideoStatus, useCardImage, cardIconAssetUrl, urlToBase64, selectedModel, selectedCard, cardId, refreshGlobalImages]);


  const handleDownloadImage = useCallback((imageUrl: string, prompt: string, isVideo: boolean) => {
    // Set extension based on media type
    let extension = isVideo ? 'mp4' : 'webp'; // Default to mp4 for video, webp for images
    
    // Try to detect actual extension from URL if available
    if (!imageUrl.startsWith('blob:')) {
      // For non-blob URLs, try to extract extension
      const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
      const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
      
      const extensions = isVideo ? videoExtensions : imageExtensions;
      for (const ext of extensions) {
        if (imageUrl.toLowerCase().includes(ext)) {
          extension = ext.substring(1); // Remove the dot
          break;
        }
      }
    }
    
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `generated-${prompt.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.${extension}`;
    link.click();
  }, []);

  const handleSelectImage = useCallback(async (_imageUrl: string, assetId: UniqueEntityID) => {
    try {
      // Set the selected state
      setSelectedImageAssetId(assetId.toString());
      
      // Update card icon to use the selected image
      updateCardIconAsset.mutate(assetId.toString(), {
        onSuccess: () => {
          // Could add a toast notification here
        },
        onError: (error) => {
          console.error("❌ Failed to update card image:", error);
          toast.error("Failed to set card image", {
            description: error instanceof Error ? error.message : "Unknown error occurred"
          });
          // Reset selection on error
          setSelectedImageAssetId(undefined);
        }
      });
      
    } catch (error) {
      console.error("❌ Error setting card image:", error);
      toast.error("Failed to set card image", {
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
      // Reset selection on error
      setSelectedImageAssetId(undefined);
    }
  }, [updateCardIconAsset]);

  const handleUseAsCardImage = useCallback(async (_imageUrl: string, assetId: UniqueEntityID) => {
    // This is now handled by handleSelectImage when clicking on the image
    // Keep this for the button click (if we want to keep the button)
    await handleSelectImage(_imageUrl, assetId);
  }, [handleSelectImage]);

  // Fixed gallery sizing - max 3 rows then scroll
  const hasImagesOrGenerating = generatedImages.length > 0 || isGenerating;
  const imageHeight = 128; // h-32 for each image
  const maxRows = 3; // Maximum 3 rows before scrolling
  const galleryHeight = maxRows * imageHeight; // Fixed height for 3 rows (384px)
  
  let promptSectionClass: string;
  let imagesSectionClass: string;
  let imagesSectionStyle: React.CSSProperties = {};
  
  if (!hasImagesOrGenerating) {
    // No images - prompt takes all space
    promptSectionClass = "flex-1 min-h-0";
    imagesSectionClass = "hidden"; // Hide gallery when empty
  } else {
    // Images present - fixed height gallery
    promptSectionClass = "flex-1 min-h-0";
    imagesSectionClass = "flex-shrink-0";
    imagesSectionStyle = {
      height: `${galleryHeight}px`, // Fixed height for exactly 3 rows
      overflow: 'auto' // Always scrollable if content exceeds
    };
  }

  return (
    <div className="h-full w-full p-4 bg-background-surface-2 flex flex-col gap-4">
      
      {/* Dynamic Prompt Section */}
      <div className={`${promptSectionClass} flex flex-col gap-4`}>
        {/* Image Prompt */}
        <div className="flex-1 flex flex-col justify-start items-start gap-2 min-h-0">
          <div className="inline-flex justify-start items-center gap-2">
            <div className="justify-start text-text-body text-[10px] font-medium leading-none">
              Image prompt
            </div>
          </div>
          <div className="flex-1 w-full flex flex-col justify-start items-start gap-1 min-h-0">
            <Textarea
              value={imagePrompt}
              onChange={(e) => handlePromptChange(e.target.value)}
              placeholder="Describe the image you want to generate..."
              className="w-full flex-1 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-primary text-xs font-normal resize-none"
            />
            <div className="w-full px-4 inline-flex justify-center items-center gap-2">
              <div className="flex-1 justify-start text-text-info text-[10px] font-medium leading-none">
                Describe appearance, style, setting, and mood
              </div>
            </div>
          </div>
        </div>

        {/* Image to Image Setting */}
        <div className="flex-shrink-0">
          <ImageToImageSetting
            enabled={useCardImage}
            onToggle={setUseCardImage}
            cardImageUrl={cardIconAssetUrl || undefined}
            cardIsVideo={cardIconIsVideo}
            disabled={!cardIconAssetUrl}
          />
        </div>

        {/* Model Selection */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <label className="text-sm font-medium text-text-primary">Model</label>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="h-9 bg-background-surface-0 border-border-normal">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent side="top">
              <SelectItem value={IMAGE_MODELS.NANO_BANANA}>Nano Banana (Images)</SelectItem>
              <SelectItem value={IMAGE_MODELS.SEEDDREAM_4_0}>Seeddream 4.0 (Images)</SelectItem>
              <SelectItem value={IMAGE_MODELS.SEEDANCE_1_0}>Seedance 1.0 Pro (Videos)</SelectItem>
              <SelectItem value={IMAGE_MODELS.SEEDANCE_LITE_1_0}>Seedance 1.0 Lite (Videos)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Video Settings - Show only for Seedance models */}
        {(selectedModel === IMAGE_MODELS.SEEDANCE_1_0 || selectedModel === IMAGE_MODELS.SEEDANCE_LITE_1_0) && (
          <div className="flex gap-4 flex-shrink-0">
            {/* Duration Setting */}
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-sm font-medium text-text-primary">Duration (seconds)</label>
              <input
                type="number"
                min={3}
                max={12}
                value={videoDuration}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value)) {
                    setVideoDuration(Math.max(3, Math.min(12, value)));
                  }
                }}
                className="h-9 px-3 bg-background-surface-0 border border-border-normal rounded-md text-sm text-text-primary"
              />
            </div>
            
            {/* Loop Setting - Show only for Lite model with image-to-video (Pro doesn't support loop) */}
            {useCardImage && selectedModel === IMAGE_MODELS.SEEDANCE_LITE_1_0 && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-primary">Loop Video</label>
                <div className="flex items-center h-9">
                  <Switch
                    checked={videoLoop}
                    onCheckedChange={setVideoLoop}
                    size="small"
                    className="data-[state=unchecked]:bg-alpha-80/20"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 flex-shrink-0">
          <Button
            onClick={handleGenerateImage}
            disabled={isGenerating || !imagePrompt.trim()}
            className="w-full"
            variant="secondary"
            size="lg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isGenerating ? 
              "Generating..." : 
              (selectedModel === IMAGE_MODELS.SEEDANCE_1_0 || selectedModel === IMAGE_MODELS.SEEDANCE_LITE_1_0) ? "Generate Video" : "Generate Image"
            }
          </Button>
          
          {/* Hidden file input - keeping for future use */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileUpload(file);
                e.target.value = "";
              }
            }}
            className="hidden"
          />
        </div>
      </div>

      {/* Dynamic Images Section */}
      <div 
        className={`${imagesSectionClass} flex flex-col gap-2`}
        style={imagesSectionStyle}
      >
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-text-subtle" />
              <span className="ml-2 text-text-subtle text-sm">Loading images...</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-0 h-fit justify-start">
              {/* Loading placeholder when generating */}
              {isGenerating && (
                <div className="w-16 h-32 relative">
                  <div className="w-16 h-32 left-0 top-[-0.25px] absolute bg-background-surface-4"></div>
                  <div className="w-6 h-6 left-[23.25px] top-[53.25px] absolute overflow-hidden">
                    <Loader2 className="w-4 h-4 left-[3px] top-[3px] absolute animate-spin text-text-primary" />
                  </div>
                </div>
              )}
              
              {generatedImages.map((image) => (
                <ImageItem
                  key={image.id.toString()}
                  image={image}
                  isGenerating={generatingImages.has(image.id.toString())}
                  isSelected={selectedImageAssetId === image.assetId.toString()}
                  onDownload={(url, prompt, isVideo) => handleDownloadImage(url, prompt, isVideo)}
                  onUseAsCardImage={handleUseAsCardImage}
                  onSelect={handleSelectImage}
                />
              ))}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}