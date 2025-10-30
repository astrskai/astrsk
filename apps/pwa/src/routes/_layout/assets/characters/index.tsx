import { createFileRoute } from "@tanstack/react-router";
import { CharactersListPage } from "@/pages/assets/characters";

export const Route = createFileRoute("/_layout/assets/characters/")({
  component: CharactersListPage,
});
