import { useState, useCallback, useRef, useEffect } from "react";
import { UniqueEntityID } from "@/shared/domain";
import { GeneratedImageService } from "@/app/services/generated-image-service";
import { toast } from "sonner";
import { useSeedanceGenerator } from "@/app/hooks/use-seedance-generator";
import { IMAGE_MODELS } from "@/app/stores/model-store";
import { useAppStore } from "@/app/stores/app-store";

interface VideoGenerationConfig {
  prompt: string;
  userPrompt?: string; // Original user prompt for display
  style?: string;
  aspectRatio?: string;
  imageToImage: boolean;
  imageUrl?: string; // Single image URL for backward compatibility
  imageUrls?: string[]; // Array of image URLs for multiple reference images
  imageMode?: "starting" | "ending" | "reference" | "start-end"; // How to use the images (default: 'starting')
  selectedModel: string;
  videoDuration: number;
  ratio?: string; // Video aspect ratio (16:9, 4:3, etc.)
  resolution?: string; // Video resolution (480p, 720p, 1080p)
  isSessionGenerated?: boolean; // True for videos generated in sessions
}

interface UseVideoGenerationProps {
  cardId?: string;
  onSuccess?: () => void;
}

interface UseVideoGenerationReturn {
  isGeneratingVideo: boolean;
  videoGenerationStatus: string;
  generateVideo: (config: VideoGenerationConfig) => Promise<string | undefined>;
}

export const useVideoGeneration = ({
  cardId,
  onSuccess,
}: UseVideoGenerationProps): UseVideoGenerationReturn => {
  // Use global store for loading state
  const generatingImageId = useAppStore.use.generatingImageId();
  const setGeneratingImageId = useAppStore.use.setGeneratingImageId();
  const isGeneratingVideo =
    generatingImageId !== null && generatingImageId.startsWith("video-");
  const [videoGenerationStatus, setVideoGenerationStatus] = useState("");

  // Seedance generator hook with all video generation methods
  const {
    generateSeedanceVideo,
    generateSeedanceImageToVideo,
    checkVideoStatus,
  } = useSeedanceGenerator();

  // Refs for polling management
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const processedTaskIds = useRef<Set<string>>(new Set());
  const isMountedRef = useRef<boolean>(true);
  const MAX_PROCESSED_IDS = 50; // Keep only last 50 task IDs to prevent memory leak

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      // Clear the processed task IDs on unmount
      processedTaskIds.current.clear();
    };
  }, []);

  // Helper to add task ID with size limit
  const addProcessedTaskId = (taskId: string) => {
    processedTaskIds.current.add(taskId);
    // If set grows too large, remove oldest entries
    if (processedTaskIds.current.size > MAX_PROCESSED_IDS) {
      const idsArray = Array.from(processedTaskIds.current);
      // Keep only the last MAX_PROCESSED_IDS entries
      processedTaskIds.current = new Set(idsArray.slice(-MAX_PROCESSED_IDS));
    }
  };

  // Helper to convert URL to base64 with aggressive size reduction
  const urlToBase64 = useCallback(
    async (url: string): Promise<{ base64: string; mimeType: string }> => {
      let tempBlobUrl: string | null = null;

      // If the URL is already a base64 data URL, extract and reprocess it
      if (url.startsWith("data:")) {
        // Extract the actual base64 data
        const base64Match = url.match(/base64,(.+)/);
        if (base64Match) {
          // Convert base64 back to blob to reprocess
          const base64 = base64Match[1];
          const byteCharacters = atob(base64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: "image/jpeg" });
          tempBlobUrl = URL.createObjectURL(blob);
          url = tempBlobUrl;
        }
      }

      // Create canvas to resize image very aggressively
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      return new Promise((resolve, reject) => {
        const img = document.createElement("img");

        img.onload = () => {
          // Clean up temporary blob URL if it was created
          if (tempBlobUrl) {
            URL.revokeObjectURL(tempBlobUrl);
            tempBlobUrl = null;
          }
          // Set reasonable dimensions - max 1280px to preserve quality while managing token usage
          const MAX_SIZE = 1280;
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

          // Draw and compress with balanced quality - ensure white background for JPEG
          ctx!.fillStyle = "#FFFFFF";
          ctx!.fillRect(0, 0, width, height);
          ctx!.drawImage(img, 0, 0, width, height);

          // Convert to base64 with very high compression (0.1 quality) - ALWAYS as JPEG
          canvas.toBlob(
            (compressedBlob) => {
              if (!compressedBlob) {
                reject(new Error("Failed to compress image"));
                return;
              }

              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string;
                const base64 = result.split(",")[1];
                const mimeType = "image/jpeg"; // Always return JPEG

                resolve({ base64, mimeType });
              };
              reader.onerror = reject;
              reader.readAsDataURL(compressedBlob);
            },
            "image/jpeg", // Force JPEG output
            0.7, // Balanced quality (70%) for good visual quality with reasonable file size
          );
        };

        img.onerror = (error) => {
          // Clean up temporary blob URL on error
          if (tempBlobUrl) {
            URL.revokeObjectURL(tempBlobUrl);
            tempBlobUrl = null;
          }
          reject(error);
        };
        img.crossOrigin = "anonymous"; // Handle CORS

        // Store reference to temp blob URL if we created one
        if (url.startsWith("data:") && tempBlobUrl) {
          img.src = tempBlobUrl;
        } else {
          img.src = url;
        }
      });
    },
    [],
  );

  // Poll for video generation status - returns a promise that resolves with asset ID
  const pollVideoStatus = useCallback(
    (
      taskId: string,
      prompt: string,
      userPrompt?: string,
      style?: string,
      aspectRatio?: string,
      inputImageFile?: File,
      isSessionGenerated?: boolean,
    ): Promise<string | undefined> => {
      return new Promise((resolve, reject) => {
        // Check if this task has already been processed
        if (processedTaskIds.current.has(taskId)) {
          setGeneratingImageId(null);
          resolve(undefined);
          return;
        }

        // Clear any existing polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }

        // Do an immediate check first
        (async () => {
          try {
            const immediateResult = await checkVideoStatus({ taskId });

            // If already succeeded, process immediately without polling
            if (
              immediateResult.status === "succeeded" &&
              immediateResult.video
            ) {
              if (!processedTaskIds.current.has(taskId)) {
                addProcessedTaskId(taskId);
                setVideoGenerationStatus("");

                // Process the video
                try {
                  const videoData = immediateResult.video;

                  const response = await fetch(videoData.url);
                  if (!response.ok) {
                    throw new Error(
                      `Failed to fetch video: ${response.statusText}`,
                    );
                  }
                  const blob = await response.blob();
                  const file = new File(
                    [blob],
                    `seedance-${videoData.id || Date.now()}.mp4`,
                    { type: videoData.mimeType || "video/mp4" },
                  );

                  // Save to GeneratedImageService
                  const saveResult =
                    await GeneratedImageService.saveFileToGeneratedImage.execute(
                      {
                        file,
                        prompt: userPrompt || prompt,
                        style,
                        aspectRatio,
                        associatedCardId: cardId
                          ? new UniqueEntityID(cardId)
                          : undefined,
                        inputImageFile,
                        isSessionGenerated: isSessionGenerated === true, // Ensure boolean
                      },
                    );

                  if (saveResult.isSuccess) {
                    const savedVideo = saveResult.getValue();
                    onSuccess?.();
                    toast.success("Video generated and saved successfully!");
                    // Resolve the promise with the asset ID
                    const assetId = savedVideo.props.assetId?.toString();

                    // Only update state if still mounted
                    if (isMountedRef.current) {
                      setGeneratingImageId(null);
                    }
                    resolve(assetId);
                    return assetId;
                  } else {
                    console.error(
                      "❌ [VIDEO-GENERATOR] Failed to save video:",
                      saveResult.getError(),
                    );
                    toast.error("Failed to save video", {
                      description: saveResult.getError(),
                    });
                    if (isMountedRef.current) {
                      setGeneratingImageId(null);
                    }
                    reject(
                      new Error(
                        saveResult.getError() || "Failed to save video",
                      ),
                    );
                  }
                } catch (videoError) {
                  toast.error("Error processing video", {
                    description:
                      videoError instanceof Error
                        ? videoError.message
                        : "Unknown error occurred",
                  });

                  if (isMountedRef.current) {
                    setGeneratingImageId(null);
                  }
                  reject(videoError);
                }
                return; // Exit early, no need to poll - promise already resolved
              }
            } else if (immediateResult.status === "failed") {
              addProcessedTaskId(taskId);
              setVideoGenerationStatus("");
              setGeneratingImageId(null);

              const errorMessage =
                immediateResult.error || "Video generation failed";
              console.error(
                "❌ [VIDEO-GENERATOR] Video generation failed:",
                errorMessage,
              );
              toast.error("Video generation failed", {
                description: errorMessage,
              });
              reject(new Error(errorMessage));
              return; // Exit early, no need to poll
            }

            // Only set up polling if status is still processing
            if (
              immediateResult.status === "processing" ||
              immediateResult.status === "pending" ||
              immediateResult.status === "running"
            ) {
              // Keep status as "Generating"
              setVideoGenerationStatus("Generating");
            } else {
              // Unknown status, don't poll
              console.warn(`Unknown video status: ${immediateResult.status}`);
              setVideoGenerationStatus("");
              setGeneratingImageId(null);
              resolve(undefined);
              return;
            }
          } catch (error) {
            console.error(
              "❌ [VIDEO-GENERATOR] Error checking initial video status:",
              error,
            );
            // Continue to set up polling in case of error
          }
        })();

        // Start polling every 5 seconds only if needed
        pollingIntervalRef.current = setInterval(async () => {
          // Check if component is still mounted
          if (!isMountedRef.current) {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            return;
          }

          try {
            const statusResult = await checkVideoStatus({ taskId });

            // Check again if still mounted before updating state
            if (!isMountedRef.current) return;

            // Keep status as "Generating" during polling
            setVideoGenerationStatus("Generating");

            if (statusResult.status === "succeeded" && statusResult.video) {
              // Check again if already processed (in case of race condition)
              if (processedTaskIds.current.has(taskId)) {
                clearInterval(pollingIntervalRef.current!);
                pollingIntervalRef.current = null;
                setVideoGenerationStatus("");
                setGeneratingImageId(null);
                return;
              }

              // Mark as processed IMMEDIATELY to prevent duplicate saves
              addProcessedTaskId(taskId);

              // Video is ready!
              clearInterval(pollingIntervalRef.current!);
              pollingIntervalRef.current = null;

              // Only update state if still mounted
              if (isMountedRef.current) {
                setVideoGenerationStatus("");
              }

              // Process the video
              try {
                const videoData = statusResult.video;
                // Fetch video from Convex storage URL

                const response = await fetch(videoData.url);
                if (!response.ok) {
                  throw new Error(
                    `Failed to fetch video: ${response.statusText}`,
                  );
                }
                const blob = await response.blob();
                const file = new File(
                  [blob],
                  `seedance-${videoData.id || Date.now()}.mp4`,
                  { type: videoData.mimeType || "video/mp4" },
                );

                // Save to GeneratedImageService (it handles all media types)
                const saveResult =
                  await GeneratedImageService.saveFileToGeneratedImage.execute({
                    file,
                    prompt: userPrompt || prompt, // Use original user prompt if provided
                    style,
                    aspectRatio,
                    associatedCardId: cardId
                      ? new UniqueEntityID(cardId)
                      : undefined,
                    inputImageFile, // Pass the original input image for thumbnail
                    isSessionGenerated: isSessionGenerated === true, // Ensure boolean
                  });

                if (saveResult.isSuccess) {
                  const savedVideo = saveResult.getValue();
                  onSuccess?.();
                  toast.success("Video generated and saved successfully!");
                  // Resolve the promise with the asset ID
                  const assetId = savedVideo.props.assetId?.toString();
                  setGeneratingImageId(null);
                  resolve(assetId);
                  return assetId;
                } else {
                  console.error(
                    "❌ [VIDEO-GENERATOR] Failed to save video:",
                    saveResult.getError(),
                  );
                  toast.error("Failed to save video", {
                    description: saveResult.getError(),
                  });
                  setGeneratingImageId(null);
                  reject(
                    new Error(saveResult.getError() || "Failed to save video"),
                  );
                }
              } catch (videoError) {
                console.error(
                  "❌ [VIDEO-GENERATOR] Error processing video:",
                  videoError,
                );
                toast.error("Error processing video", {
                  description:
                    videoError instanceof Error
                      ? videoError.message
                      : "Unknown error occurred",
                });
                setGeneratingImageId(null);
                reject(videoError);
              }
            } else if (statusResult.status === "failed") {
              // Mark as processed even on failure to prevent retrying
              addProcessedTaskId(taskId);

              // Video generation failed
              clearInterval(pollingIntervalRef.current!);
              pollingIntervalRef.current = null;
              setVideoGenerationStatus("");
              setGeneratingImageId(null);

              const errorMessage =
                statusResult.error || "Video generation failed";
              console.error(
                "❌ [VIDEO-GENERATOR] Video generation failed:",
                errorMessage,
              );
              toast.error("Video generation failed", {
                description: errorMessage,
              });
              reject(new Error(errorMessage));
            }
          } catch (error) {
            console.error(
              "❌ [VIDEO-GENERATOR] Error checking video status:",
              error,
            );
            // Don't clear interval here - let it retry
          }
        }, 5000);
      });
    },
    [cardId, checkVideoStatus, onSuccess, setGeneratingImageId],
  );

  const generateVideo = useCallback(
    async (config: VideoGenerationConfig) => {
      // Generate a unique ID for this video generation
      const generationId = `video-${Date.now()}`;
      setGeneratingImageId(generationId);
      setVideoGenerationStatus("Generating");

      try {
        const isVideoModel =
          config.selectedModel === IMAGE_MODELS.SEEDANCE_1_0 ||
          config.selectedModel === IMAGE_MODELS.SEEDANCE_LITE_1_0;

        if (!isVideoModel) {
          throw new Error("Selected model does not support video generation");
        }

        // Determine the model to use based on selection
        const modelId =
          config.selectedModel === IMAGE_MODELS.SEEDANCE_LITE_1_0
            ? config.imageToImage
              ? "seedance-1-0-lite-i2v-250428"
              : "seedance-1-0-lite-t2v-250428"
            : "seedance-1-0-pro-250528"; // Pro model for both t2v and i2v

        let taskResult;
        let inputImageFile: File | undefined;
        let generatedImageForThumbnail: File | undefined;

        // Determine which images to use (prefer imageUrls array over single imageUrl)
        const imagesToUse =
          config.imageUrls || (config.imageUrl ? [config.imageUrl] : []);

        if (config.imageToImage && imagesToUse.length > 0) {
          // Image-to-video generation - convert to base64 for blob URLs
          const imageMode = config.imageMode || "starting";

          // Validate image count based on mode
          // Note: For session video generation, we allow multiple images
          // Backend will handle the actual limits
          if (imageMode === "reference" && imagesToUse.length > 4) {
            throw new Error("Maximum 4 reference images supported");
          }

          // Convert all images to base64
          const base64Images = await Promise.all(
            imagesToUse.map(async (url) => {
              const { base64, mimeType } = await urlToBase64(url);
              return `data:${mimeType};base64,${base64}`;
            }),
          );

          // Create a File object from the first image for thumbnail
          const response = await fetch(imagesToUse[0]);
          const blob = await response.blob();
          inputImageFile = new File([blob], "input-image.jpg", {
            type: "image/jpeg",
          });

          // Call image-to-video endpoint with images array
          const i2vParams: {
            images: string | string[]; // Backend expects 'images' (plural)
            imageMode?: string;
            prompt?: string;
            model: string;
            duration: number;
            loop?: boolean;
            ratio?: string;
            resolution?: string;
          } = {
            images: base64Images.length === 1 ? base64Images[0] : base64Images,
            imageMode: imageMode,
            prompt: config.prompt || undefined,
            model: modelId,
            duration: config.videoDuration,
          };

          // Add ratio and resolution if provided
          if (config.ratio) {
            i2vParams.ratio = config.ratio;
          }
          if (config.resolution) {
            i2vParams.resolution = config.resolution;
          }

          taskResult = await generateSeedanceImageToVideo(i2vParams);
        } else {
          // Text-to-video generation
          const t2vParams: {
            prompt: string;
            model: string;
            duration: number;
            loop?: boolean;
            ratio?: string;
            resolution?: string;
          } = {
            prompt: config.prompt,
            model: modelId,
            duration: config.videoDuration,
          };

          // Add ratio and resolution if provided
          if (config.ratio) {
            t2vParams.ratio = config.ratio;
          }
          if (config.resolution) {
            t2vParams.resolution = config.resolution;
          }

          taskResult = await generateSeedanceVideo(t2vParams);
        }

        if (taskResult && taskResult.taskId) {
          setVideoGenerationStatus("Generating");
          // Return the promise from polling
          // Use the generated image as thumbnail if available, otherwise use input image
          const thumbnailFile = generatedImageForThumbnail || inputImageFile;

          return await pollVideoStatus(
            taskResult.taskId,
            config.prompt,
            config.userPrompt,
            config.style,
            config.aspectRatio,
            thumbnailFile,
            config.isSessionGenerated,
          );
        } else {
          throw new Error("Failed to start video generation");
        }
      } catch (error) {
        console.error("Error generating video:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to generate video",
        );
        setGeneratingImageId(null);
        setVideoGenerationStatus("");
      }
    },
    [
      generateSeedanceVideo,
      generateSeedanceImageToVideo,
      pollVideoStatus,
      urlToBase64,
      setGeneratingImageId,
    ],
  );

  return {
    isGeneratingVideo,
    videoGenerationStatus,
    generateVideo,
  };
};
