import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { createSelectors } from "@/shared/utils/zustand-utils";
import { LocalPersistStorage } from "@/app/stores/local-persist-storage";

// Language model options - using provider/modelId format for AstrskAi backend
export const LANGUAGE_MODELS = {
  GEMINI_2_5_PRO: "google/gemini-2.5-pro",
  GEMINI_2_5_FLASH: "google/gemini-2.5-flash",
  GEMINI_2_5_FLASH_LITE: "google/gemini-2.5-flash-lite",
  DEEPSEEK_V3: "deepseek/deepseek-chat-v3.1",
  DEEPSEEK_V3_0324: "deepseek/deepseek-chat-v3-0324",
} as const;

export type LanguageModel =
  (typeof LANGUAGE_MODELS)[keyof typeof LANGUAGE_MODELS];

// Image model options
export const IMAGE_MODELS = {
  NANO_BANANA: "nano-banana",
  SEEDDREAM_4_0: "seeddream-4.0",
  SEEDANCE_1_0: "seedance-1.0",
  SEEDANCE_LITE_1_0: "seedance-lite-1.0",
} as const;

export type ImageModel = (typeof IMAGE_MODELS)[keyof typeof IMAGE_MODELS];

interface ModelState {
  // Language model selection (used by vibe coding/AI assistant)
  selectedLanguageModel: LanguageModel;
  setSelectedLanguageModel: (model: LanguageModel) => void;

  // Image model selection (used by image studio)
  selectedImageModel: ImageModel;
  setSelectedImageModel: (model: ImageModel) => void;

  // Video generation settings
  videoDuration: number;
  setVideoDuration: (duration: number) => void;

  // Image-to-video toggle (whether to use card image as starting frame)
  useCardImageForVideo: boolean;
  setUseCardImageForVideo: (useImage: boolean) => void;
}

const useModelStoreBase = create<ModelState>()(
  persist(
    immer((set) => ({
      // Default language model
      selectedLanguageModel: LANGUAGE_MODELS.GEMINI_2_5_FLASH,
      setSelectedLanguageModel: (model) =>
        set((state) => {
          state.selectedLanguageModel = model;
        }),

      // Default image model
      selectedImageModel: IMAGE_MODELS.SEEDDREAM_4_0,
      setSelectedImageModel: (model) =>
        set((state) => {
          state.selectedImageModel = model;
        }),

      // Default video duration (5 seconds)
      videoDuration: 5,
      setVideoDuration: (duration) =>
        set((state) => {
          state.videoDuration = duration;
        }),

      // Default to not using card image for video
      useCardImageForVideo: false,
      setUseCardImageForVideo: (useImage) =>
        set((state) => {
          state.useCardImageForVideo = useImage;
        }),
    })),
    {
      name: "model-store",
      storage: new LocalPersistStorage<ModelState>(),
      // All model selection state should be persisted
    },
  ),
);

export const useModelStore = createSelectors(useModelStoreBase);
