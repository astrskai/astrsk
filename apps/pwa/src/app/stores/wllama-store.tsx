// import { Wllama } from "@wllama/wllama";
// import WasmFromCDN from "@wllama/wllama/esm/wasm-from-cdn";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

import { createSelectors } from "@/shared/utils/zustand-utils";

interface WllamaState {
  wllama: any;

  loadedModelUrl: string | null;
  setLoadedModelUrl: (model: string | null) => void;
}

const useWllamaStoreBase = create<WllamaState>()(
  immer((set) => ({
    wllama: null,

    loadedModelUrl: null,
    setLoadedModelUrl: (modelUrl: string | null) => {
      set((state) => {
        state.loadedModelUrl = modelUrl;
      });
    },
  })),
);

export const useWllamaStore = createSelectors(useWllamaStoreBase);
