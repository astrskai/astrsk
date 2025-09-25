import { createFileRoute, redirect } from "@tanstack/react-router";
import { CardPanelMain } from "@/components-v2/card/panels/card-panel-main";
import { useAppStore } from "@/app/stores/app-store";
import { useEffect } from "react";
import { useIsMobile } from "@/components-v2/hooks/use-mobile";
import CardPanelMainMobile from "@/components-v2/card/mobile/card-page-mobile";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { CardService } from "@/app/services";

export const Route = createFileRoute("/_layout/cards/$cardId")({
  component: CardDetailPage,
  beforeLoad: async ({ params }) => {
    const { cardId } = params;

    if (UniqueEntityID.isValidUUID(cardId)) {
      const result = await CardService.getCard.execute(
        new UniqueEntityID(cardId),
      );

      if (result.isFailure) throw redirect({ to: "/", replace: true });
    } else {
      throw redirect({ to: "/", replace: true });
    }
  },
});

function CardDetailPage() {
  const { cardId } = Route.useParams();
  const setSelectedCardId = useAppStore.use.setSelectedCardId();
  const isMobile = useIsMobile();

  useEffect(() => {
    setSelectedCardId(cardId);
  }, [cardId, setSelectedCardId]);

  return isMobile ? <CardPanelMainMobile /> : <CardPanelMain cardId={cardId} />;
}
