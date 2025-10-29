import { createFileRoute } from "@tanstack/react-router";
import { CreateSessionPage } from "@/pages/sessions/new-session";
import { z } from "zod";

const createSessionSearchSchema = z.object({
  sessionName: z.string().optional().default("New Session"),
});

export const Route = createFileRoute("/_layout/sessions/new")({
  component: CreateSessionPage,
  validateSearch: createSessionSearchSchema,
});
