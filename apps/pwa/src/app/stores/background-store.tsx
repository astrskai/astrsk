import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

// import { CdnBaseURL } from "@/shared/cdn";
import { UniqueEntityID } from "@/shared/domain";
import { createSelectors } from "@/shared/lib/zustand-utils";

import { BackgroundService } from "@/app/services/background-service";
import { Background } from "@/entities/background/domain/background";

export type DefaultBackground = {
  id: UniqueEntityID;
  name: string;
  src: string;
  assetId?: UniqueEntityID;
};

export function isDefaultBackground(
  background: Background | DefaultBackground,
): background is DefaultBackground {
  return "src" in background;
}

const CdnBaseURL = "";

export const defaultBackgrounds: DefaultBackground[] = [
  {
    id: new UniqueEntityID("0195461e-76a5-7b6a-9b5b-4afc902e1e90"),
    name: "City Nightscape",
    src: `${CdnBaseURL}/backgrounds/1.jpg`,
  },
  {
    id: new UniqueEntityID("0195461e-c2c8-7122-b5e5-ce2d6539a866"),
    name: "Command Center",
    src: `${CdnBaseURL}/backgrounds/2.jpg`,
  },
  {
    id: new UniqueEntityID("0195461e-e48f-769d-8a02-a27590c42c93"),
    name: "Candle Lounge",
    src: `${CdnBaseURL}/backgrounds/3.jpg`,
  },
  {
    id: new UniqueEntityID("0195461e-fc83-740d-99de-a3de3e1f7aa9"),
    name: "Grand Aquarium",
    src: `${CdnBaseURL}/backgrounds/4.jpg`,
  },
  {
    id: new UniqueEntityID("0195461f-13f7-76f8-a117-71313fb0d2b1"),
    name: "Spring Classroom",
    src: `${CdnBaseURL}/backgrounds/5.jpg`,
  },
  {
    id: new UniqueEntityID("0195461f-2eec-7f98-85fc-00e8f76f817b"),
    name: "Village Market",
    src: `${CdnBaseURL}/backgrounds/6.jpg`,
  },
  {
    id: new UniqueEntityID("0195461f-469b-7d89-ae2d-dd5ef885f09f"),
    name: "Twilight Castle",
    src: `${CdnBaseURL}/backgrounds/7.jpg`,
  },
  {
    id: new UniqueEntityID("0195461f-5f90-7f82-aebd-095153995c03"),
    name: "Tropical Beach",
    src: `${CdnBaseURL}/backgrounds/8.jpg`,
  },
  {
    id: new UniqueEntityID("0195461f-7b37-71ab-a1d2-26b0349c20e0"),
    name: "Serene Bus Stop",
    src: `${CdnBaseURL}/backgrounds/9.jpg`,
  },
  {
    id: new UniqueEntityID("0195461f-958c-7576-8f91-0e24baffc2db"),
    name: "Knight's Passage",
    src: `${CdnBaseURL}/backgrounds/10.jpg`,
  },
  {
    id: new UniqueEntityID("0195461f-ad5c-73f3-811b-9fa82dfd1b75"),
    name: "Golden Ascent",
    src: `${CdnBaseURL}/backgrounds/11.jpg`,
  },
  {
    id: new UniqueEntityID("0195461f-c447-715b-9bb9-5e1258f8e06a"),
    name: "Neon Journey",
    src: `${CdnBaseURL}/backgrounds/12.jpg`,
  },
  {
    id: new UniqueEntityID("0195461f-f99f-7e77-91f6-c81a1d5e69ec"),
    name: "Amber Archives",
    src: `${CdnBaseURL}/backgrounds/13.jpg`,
  },
  {
    id: new UniqueEntityID("01954620-13a9-7bcf-9e51-53dfd5b26c0c"),
    name: "Cyber Skyline",
    src: `${CdnBaseURL}/backgrounds/14.jpg`,
  },
  {
    id: new UniqueEntityID("01954620-2cba-7d6d-b6a7-c2177a8f6aea"),
    name: "Sunlit Classroom",
    src: `${CdnBaseURL}/backgrounds/15.jpg`,
  },
];

interface BackgroundState {
  defaultBackgrounds: DefaultBackground[];
  backgrounds: Background[];
  backgroundMap: Map<string, Background | DefaultBackground>;
}

const useBackgroundStoreBase = create<BackgroundState>()(
  immer((set) => ({
    defaultBackgrounds: defaultBackgrounds,
    backgrounds: [],
    backgroundMap: new Map<string, Background | DefaultBackground>(
      defaultBackgrounds.map((background) => [
        background.id.toValue(),
        background,
      ]),
    ),
  })),
);

export const fetchBackgrounds = async () => {
  // Get backgrounds
  const backgroundsOrError = await BackgroundService.listBackground.execute({
    limit: 100,
  });
  if (backgroundsOrError.isFailure) {
    return;
  }
  const backgrounds = backgroundsOrError.getValue();

  // Set backgrounds to map
  useBackgroundStoreBase.setState((state) => {
    state.backgrounds = backgrounds;
    for (const background of backgrounds) {
      state.backgroundMap.set(background.id.toValue(), background);
    }
  });
};

export const useBackgroundStore = createSelectors(useBackgroundStoreBase);
