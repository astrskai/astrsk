import { UniqueEntityID } from "@/shared/domain";
import { cn } from "@/shared/lib";
import CharacterItem from "./character-item";

interface PersonaItemProps {
  characterId: UniqueEntityID;
  isEnabled?: boolean;
  onClick?: () => void;
  onToggleActive?: () => void;
  isSelected?: boolean;
  isSuggested?: boolean;
}

export default function PersonaItem({
  characterId,
  isEnabled = true,
  onClick,
  onToggleActive,
  isSelected = false,
  isSuggested = false,
}: PersonaItemProps) {
  return (
    <div className="relative">
      {/* Border overlay for selected state */}
      {isSelected && (
        <div className="absolute inset-0 rounded-lg border-2 border-brand-500 pointer-events-none z-10" />
      )}

      {/* Base CharacterItem component */}
      <CharacterItem
        characterId={characterId}
        isEnabled={isEnabled}
        onClick={onClick}
        onToggleActive={onToggleActive}
      />
    </div>
  );
}
