import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { UniqueEntityID } from "@/shared/domain";
import { GeneratedImageService } from "@/app/services/generated-image-service";
import { Button } from "@/components-v2/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components-v2/ui/select";
import { Loader2, Sparkles } from "lucide-react";
import { Slider } from "@/components-v2/ui/slider";
import { ScrollArea } from "@/components-v2/ui/scroll-area";
import { useAsset } from "@/app/hooks/use-asset";
import {
  CardPanelProps,
  useCardPanel,
} from "@/components-v2/card/panels/hooks/use-card-panel";
import { useResourceData } from "@/components-v2/right-navigation/vibe-panel/hooks/use-resource-data";
import { useAppStore, Page } from "@/app/stores/app-store";
import { useUpdateCardIconAsset } from "@/app/queries/card/mutations";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  generatedImageQueries,
  generatedImageKeys,
} from "@/app/queries/generated-image/query-factory";
import { useModelStore, IMAGE_MODELS } from "@/app/stores/model-store";
import { toast } from "sonner";
import { VIDEO_SETTINGS, GALLERY_LAYOUT } from "./image-generator/constants";
import { ImageItem } from "./image-generator/components/image-item";
import { ImageToImageSetting } from "./image-generator/components/image-to-image-setting";
import { ImagePromptField } from "./image-generator/components/image-prompt-field";
import { useVideoGeneration } from "./image-generator/hooks/use-video-generation";
import { useImageGeneration } from "./image-generator/hooks/use-image-generation";
import { enhancePromptWithCardContext } from "./image-generator/utils";

export function ImageGeneratorPanel({ cardId }: CardPanelProps) {
  // Card data hook
  const { card } = useCardPanel({ cardId });

  // Get app state for resource gathering
  const activePage = useAppStore((state) => state.activePage);
  const generatingImageId = useAppStore((state) => state.generatingImageId);
  const isCardPage = activePage === Page.Cards || activePage === Page.CardPanel;

  // Resource data gathering (same pattern as AI panel)
  const { selectedCard } = useResourceData({
    selectedCardId: cardId,
    selectedFlowId: null,
    isCardPage,
    isFlowPage: false,
  });

  // Query client for invalidation
  const queryClient = useQueryClient();

  // Query for all generated images (global resource)
  const { data: allGeneratedImages = [], isLoading } = useQuery({
    ...generatedImageQueries.list(),
  });

  // Filter out session-generated images from gallery
  const generatedImages = useMemo(() => {
    const filtered = allGeneratedImages.filter((image) => {
      // Explicitly check for true to filter out session-generated images
      // Treat undefined/null as false (not session-generated) for backward compatibility
      return image.isSessionGenerated !== true;
    });

    return filtered;
  }, [allGeneratedImages]);

  // Sync selected state with current card icon
  useEffect(() => {
    if (card?.props?.iconAssetId) {
      setSelectedImageAssetId(card.props.iconAssetId.toString());
    } else {
      setSelectedImageAssetId(undefined);
    }
  }, [card?.props?.iconAssetId]);

  // Function to invalidate and refresh global images
  const refreshGlobalImages = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: generatedImageKeys.lists(),
    });
  }, [queryClient]);

  // Custom generation hooks
  const { isGeneratingVideo, generateVideo } = useVideoGeneration({
    cardId,
    onSuccess: refreshGlobalImages,
  });

  const { isGeneratingImage, generateImage } = useImageGeneration({
    cardId,
    onSuccess: refreshGlobalImages,
  });

  // Card icon asset mutation
  const updateCardIconAsset = useUpdateCardIconAsset(cardId);

  // Card icon asset hook - returns [url, isVideo]
  const [cardIconAssetUrl, cardIconIsVideo] = useAsset(
    card?.props?.iconAssetId,
  );

  // Find the selected generated image to get its thumbnail if it's a video
  const selectedGeneratedImage = generatedImages.find(
    (img) =>
      card?.props?.iconAssetId &&
      img.assetId.toString() === card.props.iconAssetId.toString(),
  );

  // Use thumbnail for videos, otherwise use the main asset
  const [thumbnailAssetUrl] = useAsset(
    selectedGeneratedImage?.thumbnailAssetId,
  );
  const imageToUseForGeneration =
    selectedGeneratedImage?.mediaType === "video" && thumbnailAssetUrl
      ? thumbnailAssetUrl
      : cardIconAssetUrl;

  // UI state
  // Check both hook-based loading and global store loading state
  const isGenerating =
    isGeneratingVideo || isGeneratingImage || generatingImageId !== null;
  const [selectedAspectRatio] = useState("2:3"); // Hidden but functional

  // Use global model store for persisted settings
  const selectedModel = useModelStore.use.selectedImageModel();
  const setSelectedModel = useModelStore.use.setSelectedImageModel();
  const videoDuration = useModelStore.use.videoDuration();
  const setVideoDuration = useModelStore.use.setVideoDuration();
  const useCardImage = useModelStore.use.useCardImageForVideo();
  const setUseCardImage = useModelStore.use.setUseCardImageForVideo();

  // Local form state
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatingImages] = useState<Set<string>>(new Set());
  const [selectedImageAssetId, setSelectedImageAssetId] = useState<
    string | undefined
  >(undefined);

  // Change handlers
  const handlePromptChange = useCallback((value: string) => {
    setImagePrompt(value);
  }, []);

  // File upload handler
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file) return;

      try {
        const result =
          await GeneratedImageService.saveFileToGeneratedImage.execute({
            file,
            prompt: file.name.replace(/\.[^/.]+$/, ""), // Use filename without extension as prompt
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
    },
    [selectedAspectRatio, cardId, refreshGlobalImages],
  );

  // Unified generation function
  const handleGenerateImage = useCallback(async () => {
    if (!imagePrompt.trim()) return;

    // Check if we need card image but it's not available
    if (useCardImage && !imageToUseForGeneration) {
      toast(
        "Card image is required but not available. Please upload an image to the card first.",
      );
      return;
    }

    // Generate enhanced prompt with card data
    const enhancedPrompt = enhancePromptWithCardContext(
      imagePrompt,
      selectedCard,
    );

    // Check if we should generate video
    const isVideoModel =
      selectedModel === IMAGE_MODELS.SEEDANCE_1_0 ||
      selectedModel === IMAGE_MODELS.SEEDANCE_LITE_1_0;

    if (isVideoModel) {
      // Use video generation hook
      await generateVideo({
        prompt: enhancedPrompt,
        userPrompt: imagePrompt, // Pass original user prompt for display
        aspectRatio: selectedAspectRatio,
        imageToImage: useCardImage,
        imageUrl: useCardImage
          ? imageToUseForGeneration || undefined
          : undefined, // Only pass image if toggle is on
        selectedModel,
        videoDuration,
      });
    } else {
      // Use image generation hook
      await generateImage({
        prompt: enhancedPrompt,
        userPrompt: imagePrompt, // Pass original user prompt for display
        aspectRatio: selectedAspectRatio,
        imageToImage: useCardImage,
        imageUrl: useCardImage
          ? imageToUseForGeneration || undefined
          : undefined, // Only pass image if toggle is on
        selectedModel,
      });
    }
  }, [
    imagePrompt,
    selectedAspectRatio,
    useCardImage,
    imageToUseForGeneration,
    selectedModel,
    selectedCard,
    videoDuration,
    generateVideo,
    generateImage,
  ]);

  const handleDownloadImage = useCallback(
    (imageUrl: string, prompt: string, isVideo: boolean) => {
      // Set extension based on media type
      let extension = isVideo ? "mp4" : "webp"; // Default to mp4 for video, webp for images

      // Try to detect actual extension from URL if available
      if (!imageUrl.startsWith("blob:")) {
        // For non-blob URLs, try to extract extension
        const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi"];
        const imageExtensions = [".png", ".jpg", ".jpeg", ".webp", ".gif"];

        const extensions = isVideo ? videoExtensions : imageExtensions;
        for (const ext of extensions) {
          if (imageUrl.toLowerCase().includes(ext)) {
            extension = ext.substring(1); // Remove the dot
            break;
          }
        }
      }

      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `generated-${prompt.slice(0, 20).replace(/[^a-zA-Z0-9]/g, "-")}-${Date.now()}.${extension}`;
      link.click();
    },
    [],
  );

  const handleSelectImage = useCallback(
    async (_imageUrl: string, assetId: UniqueEntityID) => {
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
              description:
                error instanceof Error
                  ? error.message
                  : "Unknown error occurred",
            });
            // Reset selection on error
            setSelectedImageAssetId(undefined);
          },
        });
      } catch (error) {
        console.error("❌ Error setting card image:", error);
        toast.error("Failed to set card image", {
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
        // Reset selection on error
        setSelectedImageAssetId(undefined);
      }
    },
    [updateCardIconAsset],
  );

  // Fixed gallery sizing - max 3 rows then scroll
  const hasImagesOrGenerating = generatedImages.length > 0 || isGenerating;
  const galleryHeight = GALLERY_LAYOUT.FIXED_HEIGHT; // Fixed height for 3 rows

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
      overflow: "auto", // Always scrollable if content exceeds
    };
  }

  return (
    <div className="h-full w-full p-4 bg-background-surface-2 flex flex-col gap-4">
      {/* Dynamic Prompt Section */}
      <div className={`${promptSectionClass} flex flex-col gap-4`}>
        {/* Image Prompt */}
        <ImagePromptField
          cardId={cardId}
          value={imagePrompt}
          onChange={handlePromptChange}
          disabled={isGenerating}
        />

        {/* Image to Image Setting */}
        <div className="flex-shrink-0">
          <ImageToImageSetting
            enabled={useCardImage}
            onToggle={setUseCardImage}
            cardImageUrl={imageToUseForGeneration || undefined}
            cardIsVideo={Boolean(cardIconIsVideo)}
            disabled={!imageToUseForGeneration}
            isGeneratingVideo={
              selectedModel === IMAGE_MODELS.SEEDANCE_1_0 ||
              selectedModel === IMAGE_MODELS.SEEDANCE_LITE_1_0
            }
          />
        </div>

        {/* Duration Slider - Show only for Seedance models */}
        {(selectedModel === IMAGE_MODELS.SEEDANCE_1_0 ||
          selectedModel === IMAGE_MODELS.SEEDANCE_LITE_1_0) && (
          <div className="flex flex-col gap-3 flex-shrink-0">
            <label className="text-sm font-medium text-text-primary">
              Duration
            </label>
            <Slider
              value={[videoDuration]}
              onValueChange={(value) => setVideoDuration(value[0])}
              min={VIDEO_SETTINGS.MIN_DURATION}
              max={VIDEO_SETTINGS.MAX_DURATION}
              step={1}
              showValue={true}
            />
          </div>
        )}

        {/* Model Selection */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <label className="text-sm font-medium text-text-primary">Model</label>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="h-9 bg-background-surface-0 border-border-normal">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent side="top">
              <SelectItem value={IMAGE_MODELS.SEEDDREAM_4_0}>
                Seeddream 4.0 (Images)
              </SelectItem>
              <SelectItem value={IMAGE_MODELS.NANO_BANANA}>
                Nano Banana (Images)
              </SelectItem>
              <SelectItem value={IMAGE_MODELS.SEEDANCE_1_0}>
                Seedance 1.0 Pro (Videos)
              </SelectItem>
              <SelectItem value={IMAGE_MODELS.SEEDANCE_LITE_1_0}>
                Seedance 1.0 Lite (Videos)
              </SelectItem>
            </SelectContent>
          </Select>
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
            {isGenerating
              ? "Generating..."
              : selectedModel === IMAGE_MODELS.SEEDANCE_1_0 ||
                  selectedModel === IMAGE_MODELS.SEEDANCE_LITE_1_0
                ? "Generate Video"
                : "Generate Image"}
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
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-text-subtle" />
            <span className="ml-2 text-text-subtle text-sm">
              Loading images...
            </span>
          </div>
        ) : (
          <ScrollArea className="h-full w-full">
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
                  onDownload={(url, prompt, isVideo) =>
                    handleDownloadImage(url, prompt, isVideo)
                  }
                  onSelect={handleSelectImage}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
