import { fetchBackgrounds } from "@/shared/stores/background-store";

export async function initStores(): Promise<void> {
  // Background
  await fetchBackgrounds();
}
