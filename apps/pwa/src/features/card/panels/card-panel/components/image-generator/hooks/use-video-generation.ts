import { useState, useCallback, useRef, useEffect } from "react";
import { UniqueEntityID } from "@/shared/domain";
import { GeneratedImageService } from "@/app/services/generated-image-service";
import { toast } from "sonner";
import { useSeedanceGenerator } from "@/app/hooks/use-seedance-generator";
import { IMAGE_MODELS } from "@/shared/stores/model-store";
import { useAppStore, PollingContext } from "@/shared/stores/app-store";
import { pollingManager } from "@/app/services/polling-manager";

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
  const generatingContext = useAppStore.use.generatingContext();
  const setGeneratingContext = useAppStore.use.setGeneratingContext();
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
  const processedTaskIds = useRef<Set<string>>(new Set());
  const isMountedRef = useRef<boolean>(true);
  const MAX_PROCESSED_IDS = 50; // Keep only last 50 task IDs to prevent memory leak

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      // Don't stop polling on unmount - let it continue in background
      // The global polling manager will handle it
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
          useAppStore.getState().setGeneratingImageId(null);
          useAppStore.getState().setGeneratingContext(null);
          resolve(undefined);
          return;
        }

        // Check if already polling for this task
        if (pollingManager.isPolling(taskId)) {
          console.log(`Already polling for task ${taskId}, skipping duplicate`);
          // Just resolve without starting new polling
          resolve(undefined);
          return;
        }

        // Stop any existing polling for this task (shouldn't happen but just in case)
        pollingManager.stopPolling(taskId);

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
                    // Clear global state on success
                    useAppStore.getState().setGeneratingImageId(null);
                    useAppStore.getState().setGeneratingContext(null);
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
                    // Clear global state on error
                    useAppStore.getState().setGeneratingImageId(null);
                    useAppStore.getState().setGeneratingContext(null);
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

                  // Clear global state on error
                  useAppStore.getState().setGeneratingImageId(null);
                  useAppStore.getState().setGeneratingContext(null);
                  reject(videoError);
                }
                return; // Exit early, no need to poll - promise already resolved
              }
            } else if (immediateResult.status === "failed") {
              addProcessedTaskId(taskId);
              setVideoGenerationStatus("");
              useAppStore.getState().setGeneratingImageId(null);
              useAppStore.getState().setGeneratingContext(null);

              // Handle error object or string
              let errorMessage: string;
              if (
                typeof immediateResult.error === "object" &&
                immediateResult.error !== null
              ) {
                // Extract message from error object
                errorMessage =
                  (immediateResult.error as any).message ||
                  (immediateResult.error as any).code ||
                  JSON.stringify(immediateResult.error);
              } else {
                errorMessage =
                  immediateResult.error || "Video generation failed";
              }

              console.error(
                "❌ [VIDEO-GENERATOR] Video generation failed:",
                immediateResult.error,
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
              immediateResult.status === "running" ||
              immediateResult.status === "queued" // Add queued as a valid processing state
            ) {
              // Keep status as "Generating"
              setVideoGenerationStatus("Generating");
            } else {
              // Unknown status, don't poll
              console.warn(`Unknown video status: ${immediateResult.status}`);
              setVideoGenerationStatus("");
              useAppStore.getState().setGeneratingImageId(null);
              useAppStore.getState().setGeneratingContext(null);
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
        const pollingCallback = async () => {
          // Don't check mount status - polling should continue globally

          try {
            const statusResult = await checkVideoStatus({ taskId });

            // Keep status as "Generating" during polling
            setVideoGenerationStatus("Generating");

            if (statusResult.status === "succeeded" && statusResult.video) {
              // Check again if already processed (in case of race condition)
              if (processedTaskIds.current.has(taskId)) {
                pollingManager.stopPolling(taskId);
                setVideoGenerationStatus("");
                // Use global store directly
                useAppStore.getState().setGeneratingImageId(null);
                useAppStore.getState().setGeneratingContext(null);
                return;
              }

              // Mark as processed IMMEDIATELY to prevent duplicate saves
              addProcessedTaskId(taskId);

              // Video is ready!
              pollingManager.stopPolling(taskId);

              // Clear global state when done
              setVideoGenerationStatus("");
              // Use the global store methods directly to ensure state updates
              useAppStore.getState().setGeneratingImageId(null);
              useAppStore.getState().setGeneratingContext(null);

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
                  // Use global store directly
                  useAppStore.getState().setGeneratingImageId(null);
                  useAppStore.getState().setGeneratingContext(null);
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
                  // Use global store directly
                  useAppStore.getState().setGeneratingImageId(null);
                  useAppStore.getState().setGeneratingContext(null);
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
                useAppStore.getState().setGeneratingImageId(null);
                reject(videoError);
              }
            } else if (statusResult.status === "failed") {
              // Mark as processed even on failure to prevent retrying
              addProcessedTaskId(taskId);

              // Video generation failed
              pollingManager.stopPolling(taskId);
              setVideoGenerationStatus("");
              // Use global store directly
              useAppStore.getState().setGeneratingImageId(null);
              useAppStore.getState().setGeneratingContext(null);

              // Handle error object or string
              let errorMessage: string;
              if (
                typeof statusResult.error === "object" &&
                statusResult.error !== null
              ) {
                // Extract message from error object
                errorMessage =
                  (statusResult.error as any).message ||
                  (statusResult.error as any).code ||
                  JSON.stringify(statusResult.error);
              } else {
                errorMessage = statusResult.error || "Video generation failed";
              }

              console.error(
                "❌ [VIDEO-GENERATOR] Video generation failed:",
                statusResult.error,
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
        };

        // Start polling with global manager
        pollingManager.startPolling(taskId, pollingCallback, 5000);
      });
    },
    [
      cardId,
      checkVideoStatus,
      onSuccess,
      setGeneratingImageId,
      setGeneratingContext,
    ],
  );

  // Recovery logic - runs after pollVideoStatus is defined
  useEffect(() => {
    // Check if there's an active polling context to recover
    if (
      generatingContext &&
      generatingContext.generationType === "video" &&
      !pollingManager.isPolling(generatingContext.taskId) && // Check global manager
      !processedTaskIds.current.has(generatingContext.taskId)
    ) {
      // Check if this context is too old (more than 5 minutes)
      const ageInMinutes =
        (Date.now() - generatingContext.startedAt) / 1000 / 60;
      if (ageInMinutes > 5) {
        // Context is too old, clear it
        console.log("Clearing old polling context:", generatingContext.taskId);
        setGeneratingContext(null);
        setGeneratingImageId(null);
      } else {
        // First check if the video is already completed
        console.log(
          "Checking status before resuming polling for task:",
          generatingContext.taskId,
        );

        // Do a status check first
        checkVideoStatus({ taskId: generatingContext.taskId })
          .then((statusResult) => {
            if (statusResult.status === "succeeded" && statusResult.video) {
              // Video is already done, clear context without polling
              console.log(
                "Video already completed, clearing context:",
                generatingContext.taskId,
              );
              setGeneratingContext(null);
              setGeneratingImageId(null);
              // The video is already saved in backend, no need to reprocess
            } else if (statusResult.status === "failed") {
              // Task failed, clear context
              console.log(
                "Video generation failed, clearing context:",
                generatingContext.taskId,
              );
              setGeneratingContext(null);
              setGeneratingImageId(null);
            } else {
              // Still processing, resume polling
              console.log(
                "Resuming video generation polling for task:",
                generatingContext.taskId,
              );

              // Resume the polling (will skip if already polling)
              pollVideoStatus(
                generatingContext.taskId,
                generatingContext.prompt,
                generatingContext.userPrompt,
                generatingContext.style,
                generatingContext.aspectRatio,
                generatingContext.inputImageFile,
                generatingContext.isSessionGenerated,
              )
                .then((assetId) => {
                  // Clear context after completion
                  setGeneratingContext(null);
                })
                .catch((error) => {
                  console.error("Error resuming polling:", error);
                  setGeneratingContext(null);
                  setGeneratingImageId(null);
                });
            }
          })
          .catch((error) => {
            console.error("Error checking video status:", error);
            // On error, try to resume polling anyway
            pollVideoStatus(
              generatingContext.taskId,
              generatingContext.prompt,
              generatingContext.userPrompt,
              generatingContext.style,
              generatingContext.aspectRatio,
              generatingContext.inputImageFile,
              generatingContext.isSessionGenerated,
            );
          });
      }
    }
  }, [
    generatingContext,
    pollVideoStatus,
    checkVideoStatus,
    setGeneratingContext,
    setGeneratingImageId,
  ]);

  const generateVideo = useCallback(
    async (config: VideoGenerationConfig) => {
      // Check if a video is already being generated
      if (isGeneratingVideo) {
        toast.warning("A video is already generating. Please wait.");
        return;
      }

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

          // Save polling context for recovery
          const pollingContext: PollingContext = {
            taskId: taskResult.taskId,
            generationType: "video",
            prompt: config.prompt,
            userPrompt: config.userPrompt,
            cardId: cardId,
            startedAt: Date.now(),
            style: config.style,
            aspectRatio: config.aspectRatio,
            videoDuration: config.videoDuration,
            inputImageFile: generatedImageForThumbnail || inputImageFile,
            isSessionGenerated: config.isSessionGenerated,
          };
          setGeneratingContext(pollingContext);

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
        useAppStore.getState().setGeneratingImageId(null);
        useAppStore.getState().setGeneratingContext(null);
        setVideoGenerationStatus("");
      }
    },
    [
      generateSeedanceVideo,
      generateSeedanceImageToVideo,
      pollVideoStatus,
      urlToBase64,
      setGeneratingImageId,
      setGeneratingContext,
      cardId,
      isGeneratingVideo,
    ],
  );

  return {
    isGeneratingVideo,
    videoGenerationStatus,
    generateVideo,
  };
};
