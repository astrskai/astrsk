import { createFileRoute } from "@tanstack/react-router";
import { AssetsPage } from "@/pages/asset/assets-page";

export const Route = createFileRoute("/_layout/assets/")({
  component: AssetsPage,
});
