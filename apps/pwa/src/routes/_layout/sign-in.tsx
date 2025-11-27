import { createFileRoute } from "@tanstack/react-router";
import { SignInPage } from "@/pages/auth";

export const Route = createFileRoute("/_layout/sign-in")({
  component: SignInPage,
});
