import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/pages/login";

export const Route = createFileRoute("/_layout/login")({
  component: LoginPage,
});
