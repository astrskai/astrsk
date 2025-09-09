import { Result } from "@/shared/core";

import { GeneratedImage } from "../domain";

export interface SaveGeneratedImageRepo {
  save(generatedImage: GeneratedImage): Promise<Result<void>>;
}