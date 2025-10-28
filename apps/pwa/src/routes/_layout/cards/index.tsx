import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/cards/")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
