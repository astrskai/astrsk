import { createFileRoute } from "@tanstack/react-router";
import MigrationHistoryPage from "@/pages/settings/migration-history";

export const Route = createFileRoute(
  "/_layout/settings/advanced/migration-history",
)({
  component: MigrationHistoryPage,
});
