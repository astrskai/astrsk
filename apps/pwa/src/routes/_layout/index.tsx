import { HomePage } from "@/pages/home";
import { createFileRoute } from "@tanstack/react-router";

// import CardV2 from "@/features/card/ui/card-v2";
// import SessionListV2 from "@/features/card/ui/session-list-v2";
import DashboardV2 from "@/features/card/ui/dashboard-v2";
// import CharacterListV2 from "@/features/card/ui/character-list-v2";
// import WorkflowListV2 from "@/features/card/ui/workflow-list-v2";
// import InitScreenV2 from "@/features/card/ui/init-screen-v2";

export const Route = createFileRoute("/_layout/")({
  component: DashboardV2,
});
