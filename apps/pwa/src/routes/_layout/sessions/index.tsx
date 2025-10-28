import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/sessions/")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
