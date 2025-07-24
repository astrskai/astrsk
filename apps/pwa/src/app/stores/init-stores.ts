import { fetchBackgrounds } from "@/app/stores/background-store";

export async function initStores(): Promise<void> {
  // Background
  await fetchBackgrounds();
}
