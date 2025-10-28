import { createFileRoute, redirect } from "@tanstack/react-router";
import { CardDetailPage } from "@/pages/card-detail-page";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";

export const Route = createFileRoute("/_layout/cards/$cardId")({
  component: CardDetailPage,
  beforeLoad: async ({ params }) => {
    const { cardId } = params;

    if (!UniqueEntityID.isValidUUID(cardId)) {
      throw redirect({ to: "/", replace: true });
    }
  },
});
