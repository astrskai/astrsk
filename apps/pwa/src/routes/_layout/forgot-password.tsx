import { createFileRoute } from "@tanstack/react-router";
import { ForgotPasswordPage } from "@/pages/auth";

export const Route = createFileRoute("/_layout/forgot-password")({
  component: ForgotPasswordPage,
});
