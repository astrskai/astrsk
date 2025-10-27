import { createFileRoute } from "@tanstack/react-router";
import { CreateCharacterPage } from "@/pages/asset";

export const Route = createFileRoute("/_layout/assets/create/character/")({
  component: CreateCharacterPage,
});
