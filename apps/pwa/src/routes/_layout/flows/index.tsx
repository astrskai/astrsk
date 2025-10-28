import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/flows/")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
