import { createFileRoute } from "@tanstack/react-router";
import InitializationLogsPage from "@/pages/settings/initialization-logs";

export const Route = createFileRoute(
  "/_layout/settings/advanced/initialization-logs",
)({
  component: InitializationLogsPage,
});
