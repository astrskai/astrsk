import { create } from "zustand";
import { createSelectors } from "@/shared/lib/zustand-utils";
import { LocalPersistStorage } from "./local-persist-storage";

/**
 * Store for API connection-related state
 *
 * - v1Required: Cache of which base URLs require /v1 suffix for OpenAI-compatible endpoints
 *   Key: base URL (e.g., "https://openrouter.ai/api")
 *   Value: true if /v1 is required, false otherwise
 */
interface ApiConnectionState {
  // V1 requirement cache
  v1Required: Record<string, boolean>;
  setV1Required: (baseUrl: string, required: boolean) => void;
  getV1Required: (baseUrl: string) => boolean | undefined;
  clearV1Cache: () => void;
}

const useApiConnectionStoreBase = create<ApiConnectionState>()(
  (set, get) => ({
    v1Required: {},

    setV1Required: (baseUrl: string, required: boolean) => {
      set((state) => ({
        v1Required: {
          ...state.v1Required,
          [baseUrl]: required,
        },
      }));
    },

    getV1Required: (baseUrl: string) => {
      return get().v1Required[baseUrl];
    },

    clearV1Cache: () => {
      set({ v1Required: {} });
    },
  }),
);

// Enable persistence with LocalPersistStorage
const storage = new LocalPersistStorage<ApiConnectionState>();

// Create persisted store
export const useApiConnectionStore = createSelectors(
  create<ApiConnectionState>()(
    (set, get) => ({
      ...useApiConnectionStoreBase.getState(),

      // Load from localStorage on initialization
      ...(() => {
        try {
          const stored = storage.getItem("api-connection-store");
          if (stored?.state?.v1Required) {
            return { v1Required: stored.state.v1Required };
          }
        } catch (error) {
          console.error("[API Connection Store] Failed to load from storage:", error);
        }
        return {};
      })(),

      setV1Required: (baseUrl: string, required: boolean) => {
        set((state) => {
          const newState = {
            ...state,
            v1Required: {
              ...state.v1Required,
              [baseUrl]: required,
            },
          };

          // Persist to localStorage
          try {
            storage.setItem("api-connection-store", {
              state: newState,
              version: 0,
            });
          } catch (error) {
            console.error("[API Connection Store] Failed to save to storage:", error);
          }

          return newState;
        });
      },

      getV1Required: (baseUrl: string) => {
        return get().v1Required[baseUrl];
      },

      clearV1Cache: () => {
        set((state) => ({ ...state, v1Required: {} }));
        try {
          const stored = storage.getItem("api-connection-store");
          if (stored) {
            storage.setItem("api-connection-store", {
              state: { ...stored.state, v1Required: {} },
              version: 0,
            });
          }
        } catch (error) {
          console.error("[API Connection Store] Failed to clear v1 cache from storage:", error);
        }
      },
    }),
  ),
);
