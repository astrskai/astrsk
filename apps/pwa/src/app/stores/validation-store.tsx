import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

import { UniqueEntityID } from "@/shared/domain";
import { createSelectors } from "@/shared/utils/zustand-utils";

type Resource = "sessions" | "flows";

interface ValidationState {
  invalids: Map<
    Resource,
    {
      [id: string]: boolean;
    }
  >;

  sessionIds: { [id: string]: boolean };
  flowIds: { [id: string]: boolean };
}

interface ValidationActions {
  setInvalid: (
    resource: Resource,
    id: UniqueEntityID,
    isInvalid: boolean,
  ) => void;
  setSessionIds: (ids: { [id: string]: boolean }) => void;
  setFlowIds: (ids: { [id: string]: boolean }) => void;
}

const initialState: ValidationState = {
  invalids: new Map<Resource, { [id: string]: boolean }>(),
  sessionIds: {},
  flowIds: {},
};

const useValidationStoreBase = create<ValidationState & ValidationActions>()(
  immer((set) => ({
    ...initialState,
    setInvalid: (resource, id, isInvalid) =>
      set((state) => {
        const invalids = state.invalids.get(resource) || {};
        if (isInvalid) {
          invalids[id.toString()] = true;
        } else {
          delete invalids[id.toString()];
        }
        state.invalids.set(resource, invalids);
      }),
    setSessionIds: (ids) =>
      set((state) => {
        state.sessionIds = ids;
      }),
    setFlowIds: (ids) =>
      set((state) => {
        state.flowIds = ids;
      }),
  })),
);

export const useValidationStore = createSelectors(useValidationStoreBase);
