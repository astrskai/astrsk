import { createFileRoute } from "@tanstack/react-router";
import { ScenariosPage } from "@/pages/assets/scenarios";

export const Route = createFileRoute("/_layout/assets/scenarios/")({
  component: ScenariosPage,
});
