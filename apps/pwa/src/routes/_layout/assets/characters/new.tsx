import { createFileRoute } from "@tanstack/react-router";
import { CreateCharacterPage } from "@/pages/assets/characters/new-character";

export const Route = createFileRoute("/_layout/assets/characters/new")({
  component: CreateCharacterPage,
});
