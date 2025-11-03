import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/assets/")({
  beforeLoad: () => {
    throw redirect({ to: "/assets/characters" });
  },
});
