import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { createSelectors } from "@/shared/utils/zustand-utils";
import { LocalPersistStorage } from "@/app/stores/local-persist-storage";

// Language model options
export const LANGUAGE_MODELS = {
  GEMINI_2_5_PRO: 'gemini-2.5-pro',
  GEMINI_2_5_FLASH: 'gemini-2.5-flash',
  GEMINI_2_5_FLASH_LITE: 'gemini-2.5-flash-lite',
  CLAUDE_SONNET_4: 'claude-sonnet-4-20250514',
  GPT_5_CHAT_LATEST: 'gpt-5-chat-latest',
  DEEPSEEK_V3: 'deepseek-v3',
  DEEPSEEK_R1: 'deepseek-r1',
} as const;

export type LanguageModel = typeof LANGUAGE_MODELS[keyof typeof LANGUAGE_MODELS];

// Image model options
export const IMAGE_MODELS = {
  NANO_BANANA: 'nano-banana',
  SEEDDREAM_4_0: 'seeddream-4.0',
} as const;

export type ImageModel = typeof IMAGE_MODELS[keyof typeof IMAGE_MODELS];

interface ModelState {
  // Language model selection (used by vibe coding/AI assistant)
  selectedLanguageModel: LanguageModel;
  setSelectedLanguageModel: (model: LanguageModel) => void;

  // Image model selection (used by image studio)
  selectedImageModel: ImageModel;
  setSelectedImageModel: (model: ImageModel) => void;
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
      selectedImageModel: IMAGE_MODELS.NANO_BANANA,
      setSelectedImageModel: (model) =>
        set((state) => {
          state.selectedImageModel = model;
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