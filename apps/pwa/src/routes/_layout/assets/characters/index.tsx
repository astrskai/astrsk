import { createFileRoute } from "@tanstack/react-router";
import { CharactersListPage } from "@/pages/asset/characters";

export const Route = createFileRoute("/_layout/assets/characters/")({
  component: CharactersListPage,
});
