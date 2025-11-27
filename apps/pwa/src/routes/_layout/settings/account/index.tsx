import { createFileRoute } from "@tanstack/react-router";
import AccountPage from "@/pages/settings/account";

export const Route = createFileRoute("/_layout/settings/account/")({
  component: AccountPage,
});
