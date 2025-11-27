import { createFileRoute } from "@tanstack/react-router";
import AdvancedPage from "@/pages/settings/advanced";

export const Route = createFileRoute("/_layout/settings/advanced/")({
  component: AdvancedPage,
});
