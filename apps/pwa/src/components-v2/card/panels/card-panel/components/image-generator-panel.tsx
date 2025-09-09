import { useState, useEffect, useCallback, useRef } from "react";
import { UniqueEntityID } from "@/shared/domain";
import { Button } from "@/components-v2/ui/button";
import { Textarea } from "@/components-v2/ui/textarea";
import { Loader2, Download, Sparkles, Upload, Image, Type, Copy } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components-v2/ui/tooltip";
import { Switch } from "@/components-v2/ui/switch";
import { GeneratedImageService } from "@/app/services/generated-image-service";
import { GeneratedImage } from "@/modules/generated-image/domain";
import { useAsset } from "@/app/hooks/use-asset";
import { 
  CardPanelProps, 
  CardPanelLoading, 
  CardPanelError,
  useCardPanel 
} from "@/components-v2/card/panels/hooks/use-card-panel";
import { useNanoBananaGenerator, CustomImageResponse, ImageToImageResponse } from "@/app/hooks/use-nano-banana-generator";
import { useUpdateCardIconAsset } from "@/app/queries/card/mutations";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { generatedImageQueries, generatedImageKeys } from "@/app/queries/generated-image/query-factory";
import { cn } from "@/shared/utils";

interface ImageGeneratorPanelProps extends CardPanelProps {}

// Image to Image Setting Component
const ImageToImageSetting = ({
  enabled,
  onToggle,
  cardImageUrl,
  disabled = false
}: {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  cardImageUrl?: string;
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
            Image to image
          </div>
        </div>
        <div className="self-stretch justify-start text-text-info text-xs font-normal">
          {isDisabled ? 'Select an image to unlock transformation' : 'Transform the selected image based on your prompt'}
        </div>
      </div>
      <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${
        hasCardImage ? 'bg-neutral-500/60 overflow-hidden' : 'bg-background-surface-4'
      } ${hasCardImage && !enabled ? 'opacity-60' : ''}`}>
        {hasCardImage ? (
          <img 
            src={cardImageUrl} 
            alt="Card image" 
            className="w-full h-full object-cover"
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

// Image item component
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
  onDownload: (url: string, prompt: string) => void;
  onUseAsCardImage: (imageUrl: string, assetId: UniqueEntityID) => void;
  onSelect: (imageUrl: string, assetId: UniqueEntityID) => void;
}) => {
  const [assetUrl] = useAsset(image.assetId);

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
          <img
            src={assetUrl}
            alt={image.prompt}
            className="w-full h-full object-cover"
          />
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
      
      {/* Prompt tooltip */}
      <div className="absolute bottom-1 right-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-1 bg-background-surface-4/50 rounded-md inline-flex justify-start items-center gap-2">
                <div className="w-3 h-3 relative overflow-hidden">
                  <Type className="w-3 h-3 text-text-primary" />                
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
  
  // Query client for invalidation
  const queryClient = useQueryClient();
  
  // Query for all generated images (global resource)
  const { data: generatedImages = [], isLoading, error } = useQuery({
    ...generatedImageQueries.list(),
  });

  // Debug logging for query state
  useEffect(() => {
    console.log("🖼️ [IMAGE-GENERATOR] Query state:", {
      cardId,
      imagesCount: generatedImages.length,
      isLoading,
      error: error?.message,
    });
  }, [cardId, generatedImages.length, isLoading, error]);

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
  
  // Card icon asset mutation
  const updateCardIconAsset = useUpdateCardIconAsset(cardId);
  
  // Card icon asset hook
  const [cardIconAssetUrl] = useAsset(card?.props?.iconAssetId);

  // Debug logging
  // useEffect(() => {
  //   console.log("🖼️ [IMAGE-GENERATOR] Card debug:", {
  //     cardId,
  //     cardExists: !!card,
  //     iconAssetId: card?.props?.iconAssetId?.toString(),
  //     cardIconAssetUrl,
  //     hasCardImage: !!cardIconAssetUrl
  //   });
  // }, [cardId, card, cardIconAssetUrl]);
  
  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("photorealistic"); // Hidden but functional
  const [selectedAspectRatio, setSelectedAspectRatio] = useState("2:3"); // Hidden but functional
  const [useCardImage, setUseCardImage] = useState(false); // Switch to use card image as input
  
  // Local form state
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatingImages, setGeneratingImages] = useState<Set<string>>(new Set());
  const [selectedImageAssetId, setSelectedImageAssetId] = useState<string | undefined>(undefined);
  
  // Image-to-image state
  const [inputImage, setInputImage] = useState<File | null>(null);
  const [inputImagePreview, setInputImagePreview] = useState<string | null>(null);
  const [generationMode, setGenerationMode] = useState<'text-to-image' | 'image-to-image'>('text-to-image');
  
  // Panel height tracking
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelHeight, setPanelHeight] = useState<number>(0);

  // Track panel height and recalculate when content changes
  useEffect(() => {
    const updateHeight = () => {
      if (panelRef.current) {
        setPanelHeight(panelRef.current.clientHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Recalculate layout when images or loading state changes
  useEffect(() => {
    // Small delay to ensure DOM has updated
    const timer = setTimeout(() => {
      if (panelRef.current) {
        setPanelHeight(panelRef.current.clientHeight);
        // Force a re-render to recalculate image layout
        const event = new Event('resize');
        window.dispatchEvent(event);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [generatedImages.length, isLoading, isGenerating]);

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
        const MAX_SIZE = 256;
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
              
              console.log(`🖼️ [IMAGE-RESIZE] Resized from ${img.width}x${img.height} to ${width}x${height}, size: ${Math.round(compressedBlob.size/1024)}KB`);
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
      alert("Card image is required but not available. Please upload an image to the card first.");
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log("🍌 [IMAGE-GENERATOR] Calling nano banana with prompt:", imagePrompt);
      console.log("🍌 [IMAGE-GENERATOR] Using card image:", useCardImage);
      
      let result: CustomImageResponse | ImageToImageResponse;

      if (useCardImage && cardIconAssetUrl) {
        // Image-to-image generation using card image
        console.log("🖼️ [IMAGE-GENERATOR] Converting card image to base64...");
        const { base64, mimeType } = await urlToBase64(cardIconAssetUrl);
        
        console.log("🖼️ [IMAGE-GENERATOR] Calling generateImageToImage with:", {
          hasBase64: !!base64,
          base64Length: base64.length,
          mimeType,
          prompt: imagePrompt,
          style: selectedStyle,
          aspectRatio: selectedAspectRatio
        });
        
        result = await generateImageToImage({
          inputImageBase64: base64,
          inputImageMimeType: mimeType,
          prompt: imagePrompt,
          style: selectedStyle,
          aspectRatio: selectedAspectRatio,
        });
      } else {
        // Regular text-to-image generation
        result = await generateCustomImage({
          prompt: imagePrompt,
          style: selectedStyle,
          aspectRatio: selectedAspectRatio,
        });
      }

      console.log("🍌 [IMAGE-GENERATOR] Nano banana response:", {
        success: result.success,
        imagesGenerated: result.images?.length || 0,
        textContent: result.textContent?.substring(0, 100) + "...",
      });

      if (result.success && result.images && result.images.length > 0) {
        // Process each generated image - now they come with URLs from file storage
        for (const imageData of result.images) {
          try {
            console.log("🖼️ [IMAGE-GENERATOR] Processing image from file storage:", {
              id: imageData.id,
              storageId: imageData.storageId,
              url: imageData.url,
              size: imageData.size,
              mimeType: imageData.mimeType
            });

            // Fetch the image from the storage URL to convert to File for GeneratedImageService
            const response = await fetch(imageData.url);
            const blob = await response.blob();
            const file = new File([blob], `nano-banana-${imageData.id}.png`, { type: imageData.mimeType || "image/png" });

            // Save to GeneratedImageService with card association
            const saveResult = await GeneratedImageService.saveFileToGeneratedImage.execute({
              file,
              prompt: imageData.originalPrompt || imageData.prompt,
              style: imageData.style || selectedStyle,
              aspectRatio: imageData.aspectRatio || selectedAspectRatio,
              associatedCardId: cardId ? new UniqueEntityID(cardId) : undefined,
            });

            if (saveResult.isSuccess) {
              console.log("✅ [IMAGE-GENERATOR] Image saved successfully");
              // Invalidate queries to refresh the image list
              await refreshGlobalImages();
            } else {
              console.error("❌ [IMAGE-GENERATOR] Failed to save image:", saveResult.getError());
            }
          } catch (imageError) {
            console.error("❌ [IMAGE-GENERATOR] Error processing image:", imageError);
          }
        }
      } else {
        console.error("❌ [IMAGE-GENERATOR] No images generated or generation failed:", result.error);
        // Show user-friendly error message
        alert(`Image generation failed: ${result.error || "No images were generated. This may be due to content policy restrictions or technical issues."}`);
      }
      
    } catch (error) {
      console.error("❌ [IMAGE-GENERATOR] Error generating image:", error);
      // Show user-friendly error message
      alert(`Image generation failed: ${error instanceof Error ? error.message : "An unexpected error occurred. Please try again."}`);
    } finally {
      setIsGenerating(false);
    }
  }, [imagePrompt, selectedStyle, selectedAspectRatio, generateCustomImage, generateImageToImage, useCardImage, cardIconAssetUrl, urlToBase64]);


  const handleDownloadImage = useCallback((imageUrl: string, prompt: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `generated-${prompt.slice(0, 20)}-${Date.now()}.png`;
    link.click();
  }, []);

  const handleSelectImage = useCallback(async (imageUrl: string, assetId: UniqueEntityID) => {
    try {
      // Set the selected state
      setSelectedImageAssetId(assetId.toString());
      
      // Update card icon to use the selected image
      updateCardIconAsset.mutate(assetId.toString(), {
        onSuccess: () => {
          console.log("✅ Card image updated to use gallery asset");
          // Could add a toast notification here
        },
        onError: (error) => {
          console.error("❌ Failed to update card image:", error);
          alert("Failed to set card image: " + (error instanceof Error ? error.message : "Unknown error"));
          // Reset selection on error
          setSelectedImageAssetId(undefined);
        }
      });
      
    } catch (error) {
      console.error("❌ Error setting card image:", error);
      alert("Failed to set card image: " + (error instanceof Error ? error.message : "Unknown error"));
      // Reset selection on error
      setSelectedImageAssetId(undefined);
    }
  }, [updateCardIconAsset]);

  const handleUseAsCardImage = useCallback(async (imageUrl: string, assetId: UniqueEntityID) => {
    // This is now handled by handleSelectImage when clicking on the image
    // Keep this for the button click (if we want to keep the button)
    await handleSelectImage(imageUrl, assetId);
  }, [handleSelectImage]);

  // Calculate dynamic sizing based on number of images or generating state
  const hasImagesOrGenerating = generatedImages.length > 0 || isGenerating;
  const totalImages = generatedImages.length + (isGenerating ? 1 : 0);
  
  // Calculate dynamic sizing for images section
  const imageHeight = 128; // h-32 for each image
  const gapSize = 0; // gap-0 - no gap between images
  const imageWidth = 64; // w-16 for each image
  const maxImageSectionHeight = 800; // Maximum height for images section
  
  // Calculate how many images per row based on available width
  const availableWidth = panelRef.current?.clientWidth || 400;
  const imagesPerRow = Math.max(1, Math.floor((availableWidth - 32) / imageWidth)); // 32px for padding, no gap
  
  // Calculate needed height based on actual content
  const totalRows = Math.ceil(totalImages / imagesPerRow);
  const neededImageHeight = totalImages > 0 ? totalRows * imageHeight + 32 : 0; // +32 for padding, no gap between rows
  
  // Determine if images section should be scrollable
  const shouldCapImageHeight = neededImageHeight > maxImageSectionHeight;
  const actualImageHeight = shouldCapImageHeight ? maxImageSectionHeight : neededImageHeight;
  
  let promptSectionClass: string;
  let imagesSectionClass: string;
  let imagesSectionStyle: React.CSSProperties = {};
  
  if (!hasImagesOrGenerating) {
    // No images - prompt takes all space
    promptSectionClass = "flex-1 min-h-0";
    imagesSectionClass = "flex-shrink-0";
  } else {
    // Images present - fit content up to max height
    promptSectionClass = "flex-1 min-h-0";
    imagesSectionClass = "flex-shrink-0";
    imagesSectionStyle = {
      height: `${actualImageHeight}px`,
      maxHeight: `${maxImageSectionHeight}px`,
      overflow: shouldCapImageHeight ? 'auto' : 'visible'
    };
  }

  return (
    <div ref={panelRef} className="h-full w-full p-4 bg-background-surface-2 flex flex-col gap-4">
      
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
            disabled={!cardIconAssetUrl}
          />
        </div>

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
            {isGenerating ? "Generating..." : "Generate"}
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
                  onDownload={(url, prompt) => handleDownloadImage(url, prompt)}
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