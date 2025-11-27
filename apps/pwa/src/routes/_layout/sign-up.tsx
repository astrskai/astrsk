import { createFileRoute } from "@tanstack/react-router";
import { SignUpPage } from "@/pages/auth";

export const Route = createFileRoute("/_layout/sign-up")({
  component: SignUpPage,
});
