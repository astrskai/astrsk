import { Plus } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { CharacterCard } from "@/entities/card/domain/character-card";
import { CreateItemCard } from "@/shared/ui";
import { Button } from "@/shared/ui/forms";
import CharacterPreview from "@/features/character/ui/character-preview";

interface CharactersGridProps {
  characters: CharacterCard[];
  showNewCharacterCard: boolean;
}

/**
 * Characters grid component
 * Displays character cards in a responsive grid with optional New Character Card
 *
 * Layout:
 * - Mobile: Button above grid + 1 column per row
 * - Desktop: New card inside grid + 2 columns per row
 */
export function CharactersGrid({
  characters,
  showNewCharacterCard,
}: CharactersGridProps) {
  const navigate = useNavigate();

  const handleCharacterClick = (characterId: string) => {
    navigate({
      to: "/assets/characters/$characterId",
      params: { characterId },
    });
  };

  const handleCreateCharacter = () => {
    navigate({ to: "/assets/characters/new" });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Mobile: Create Button (outside grid) */}
      {showNewCharacterCard && (
        <Button
          onClick={handleCreateCharacter}
          icon={<Plus size={16} />}
          className="w-full md:hidden"
        >
          Create new character
        </Button>
      )}

      {/* Characters Grid */}
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 justify-center gap-4 md:grid-cols-2">
        {/* Desktop: New Character Card (inside grid) */}
        {showNewCharacterCard && (
          <CreateItemCard
            title="New Character"
            description="Create a new character"
            onClick={handleCreateCharacter}
            className="hidden aspect-[3/1] md:flex"
          />
        )}

        {/* Existing Characters */}
        {characters.map((character) => (
          <CharacterPreview
            key={character.id.toString()}
            cardId={character.id}
            iconAssetId={character.props.iconAssetId}
            title={character.props.title}
            summary={character.props.cardSummary}
            tags={character.props.tags || []}
            tokenCount={character.props.tokenCount}
            onClick={() => handleCharacterClick(character.id.toString())}
            isShowActions={true}
          />
        ))}
      </div>
    </div>
  );
}
