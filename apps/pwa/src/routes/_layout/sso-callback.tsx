import { createFileRoute } from "@tanstack/react-router";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";

export const Route = createFileRoute("/_layout/sso-callback")({
  component: SSOCallback,
});

function SSOCallback() {
  return <AuthenticateWithRedirectCallback />;
}
