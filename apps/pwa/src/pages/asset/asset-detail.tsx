import { CardPanelMain } from "@/features/card/panels/card-panel-main";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import CardPanelMainMobile from "@/features/card/mobile/card-page-mobile";

interface AssetDetailPageProps {
  cardId: string;
}

export function AssetDetailPage({ cardId }: AssetDetailPageProps) {
  const isMobile = useIsMobile();

  return isMobile ? <CardPanelMainMobile /> : <CardPanelMain cardId={cardId} />;
}
