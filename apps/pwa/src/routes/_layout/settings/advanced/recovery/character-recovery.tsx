import { createFileRoute } from "@tanstack/react-router";
import CharacterRecoveryPage from "@/pages/settings/advanced/recovery/character-recovery";

export const Route = createFileRoute("/_layout/settings/advanced/recovery/character-recovery")({
  component: CharacterRecoveryPage,
});
