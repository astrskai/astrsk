import { createFileRoute } from "@tanstack/react-router";
import { EmailVerificationPage } from "@/pages/auth";

export const Route = createFileRoute("/_layout/email-verification")({
  component: EmailVerificationPage,
});
