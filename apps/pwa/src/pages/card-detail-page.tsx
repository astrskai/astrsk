import { Route } from "@/routes/_layout/cards/$cardId";
import { CardPanelMain } from "@/features/card/panels/card-panel-main";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import CardPanelMainMobile from "@/features/card/mobile/card-page-mobile";

export function CardDetailPage() {
  const { cardId } = Route.useParams();
  const isMobile = useIsMobile();

  return isMobile ? <CardPanelMainMobile /> : <CardPanelMain cardId={cardId} />;
}
