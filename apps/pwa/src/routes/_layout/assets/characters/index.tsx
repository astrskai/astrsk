import { createFileRoute } from "@tanstack/react-router";
import { CharactersPage } from "@/pages/assets/characters";

export const Route = createFileRoute("/_layout/assets/characters/")({
  component: CharactersPage,
});
