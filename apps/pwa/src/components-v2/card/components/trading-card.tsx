import { UniqueEntityID } from "@/shared/domain";

import { useAsset } from "@/app/hooks/use-asset";
import { useCard } from "@/app/hooks/use-card";
import { Card } from "@/modules/card/domain";
import { TradingCardDisplay } from "./trading-card-display";

interface TradingCardProps {
  cardId: string;
  onClick?: (id: string) => void;
}

export const TradingCard = ({ cardId, onClick }: TradingCardProps) => {
  // Convert string ID to UniqueEntityID
  const uniqueCardId = new UniqueEntityID(cardId);

  // Fetch card data and image with metadata
  const [card] = useCard<Card>(uniqueCardId);
  const [imageUrl, isVideo] = useAsset(card?.props.iconAssetId);

  // Handle click event
  const handleClick = () => {
    if (onClick && card) {
      onClick(cardId);
    }
  };

  return (
    <TradingCardDisplay 
      card={card || null} 
      imageUrl={imageUrl} 
      isVideo={isVideo}
      isLoading={false}
      onClick={handleClick}
    />
  );
};

export default TradingCard;