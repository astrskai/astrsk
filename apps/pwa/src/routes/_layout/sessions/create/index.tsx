import { createFileRoute } from "@tanstack/react-router";
import { CreateSessionPage } from "@/pages/session";
import { z } from "zod";

const createSessionSearchSchema = z.object({
  sessionName: z.string().optional().default("New Session"),
});

export const Route = createFileRoute("/_layout/sessions/create/")({
  component: CreateSessionPage,
  validateSearch: createSessionSearchSchema,
});
