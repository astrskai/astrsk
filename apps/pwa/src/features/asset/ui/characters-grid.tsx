import { Plus } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { CharacterCard } from "@/entities/card/domain/character-card";
import CardDisplay from "@/features/card/ui/card-display";
import { NewCharacter } from "./new-character";
import { Button } from "@/shared/ui/forms";

interface CharactersGridProps {
  characters: CharacterCard[];
  showNewCharacterCard: boolean;
}

/**
 * Characters grid component
 * Displays character cards in a responsive grid with optional New Character Card
 *
 * Layout:
 * - Mobile: Button above grid + 2 columns per row
 * - Desktop: New card inside grid + up to 5 columns per row
 */
export function CharactersGrid({
  characters,
  showNewCharacterCard,
}: CharactersGridProps) {
  const navigate = useNavigate();

  const handleCharacterClick = (characterId: string) => {
    navigate({ to: "/cards/$cardId", params: { cardId: characterId } });
  };

  const handleCreateCharacter = () => {
    navigate({ to: "/assets/create/character" });
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
      <div className="mx-auto grid w-full max-w-7xl grid-cols-2 justify-center gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {/* Desktop: New Character Card (inside grid) */}
        {showNewCharacterCard && (
          <NewCharacter
            onClick={handleCreateCharacter}
            className="hidden md:flex"
          />
        )}

        {/* Existing Characters */}
        {characters.map((character) => (
          <div key={character.id.toString()} className="group">
            <CardDisplay
              card={character}
              isSelected={false}
              showActions={true}
              onClick={() => handleCharacterClick(character.id.toString())}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
