import { useEffect } from "react";
import { Route } from "@/routes/_layout/cards/$cardId";
import { CardPanelMain } from "@/features/card/panels/card-panel-main";
import { useAppStore } from "@/app/stores/app-store";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import CardPanelMainMobile from "@/features/card/mobile/card-page-mobile";

export function CardDetailPage() {
  const { cardId } = Route.useParams();
  const setSelectedCardId = useAppStore.use.setSelectedCardId();
  const isMobile = useIsMobile();

  useEffect(() => {
    setSelectedCardId(cardId);
  }, [cardId, setSelectedCardId]);

  return isMobile ? <CardPanelMainMobile /> : <CardPanelMain cardId={cardId} />;
}
