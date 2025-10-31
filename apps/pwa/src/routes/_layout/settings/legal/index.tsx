import { createFileRoute } from "@tanstack/react-router";
import LegalPage from "@/pages/settings/legal";

export const Route = createFileRoute("/_layout/settings/legal/")({
  component: LegalPage,
});
