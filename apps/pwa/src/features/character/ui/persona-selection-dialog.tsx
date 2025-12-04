import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { DialogBase } from "@/shared/ui/dialogs/base";
import { Button, Input, Textarea, SearchInput } from "@/shared/ui/forms";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
import { Avatar } from "@/shared/ui/avatar";
import { toastError } from "@/shared/ui/toast";
import { useCreateCharacterCard } from "@/entities/character/api";
import { cardQueries } from "@/entities/card/api/card-queries";
import { CharacterCard } from "@/entities/card/domain/character-card";
import { CardType } from "@/entities/card/domain";
import { UniqueEntityID } from "@/shared/domain";
import { useAsset } from "@/shared/hooks/use-asset";
import { cn } from "@/shared/lib";

/**
 * Persona data to return (either selected character or new persona info)
 */
export interface PersonaResult {
  type: "existing" | "new";
  /** Existing character card ID */
  characterId?: string;
  /** New persona name */
  name?: string;
  /** New persona description */
  description?: string;
}

interface PersonaSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when persona is selected or created */
  onConfirm: (result: PersonaResult | null) => void;
  /** Optional: Skip persona selection (no persona) */
  allowSkip?: boolean;
  /** Optional: Suggested persona card ID (shown at top with "Suggested" label) */
  suggestedPersonaId?: string;
}

/**
 * Persona Card - Displays a selectable character card as persona option
 */
interface PersonaCardProps {
  card: CharacterCard;
  isSelected: boolean;
  onSelect: () => void;
  isSuggested?: boolean;
}

const PersonaCard = ({
  card,
  isSelected,
  onSelect,
  isSuggested,
}: PersonaCardProps) => {
  const [imageUrl] = useAsset(card.props.iconAssetId);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full cursor-pointer items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200",
        isSelected
          ? "border-brand-500 bg-brand-900/50 shadow-lg"
          : "border-neutral-700 hover:border-brand-500 hover:bg-neutral-800/50",
      )}
    >
      {/* Avatar */}
      <Avatar
        src={imageUrl}
        alt={card.props.name || "Persona"}
        size={48}
        className="flex-shrink-0"
      />

      {/* Info */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-lg font-semibold text-white">
          {card.props.name || "Unnamed"}
          {isSuggested && (
            <span className="ml-2 text-sm text-brand-400">(Suggested)</span>
          )}
        </h3>
        <p className="truncate text-sm text-neutral-400">
          {card.props.cardSummary || card.props.description || "No description"}
        </p>
      </div>

      {/* Selected indicator */}
      {isSelected && <span className="text-brand-400">✓</span>}
    </button>
  );
};

/**
 * No Persona Card - Special option to skip persona selection
 */
interface NoPersonaCardProps {
  isSelected: boolean;
  onSelect: () => void;
}

const NoPersonaCard = ({ isSelected, onSelect }: NoPersonaCardProps) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full cursor-pointer items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200",
        isSelected
          ? "border-brand-500 bg-brand-900/50 shadow-lg"
          : "border-neutral-700 hover:border-brand-500 hover:bg-neutral-800/50",
      )}
    >
      {/* Avatar placeholder */}
      <Avatar
        src={null}
        alt="No Persona"
        size={48}
        className="flex-shrink-0"
      />

      {/* Info */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-lg font-semibold text-white">
          No persona
          <span className="ml-2 text-sm text-neutral-500">(Default)</span>
        </h3>
        <p className="truncate text-sm text-neutral-400">
          Start roleplay without defining your role
        </p>
      </div>

      {/* Selected indicator */}
      {isSelected && <span className="text-brand-400">✓</span>}
    </button>
  );
};

/**
 * Persona Selection Dialog
 *
 * Allows user to:
 * 1. Select an existing character card as their persona
 * 2. Create a new persona with just name and description
 * 3. Skip (no persona)
 */
export function PersonaSelectionDialog({
  open,
  onOpenChange,
  onConfirm,
  allowSkip = true,
  suggestedPersonaId,
}: PersonaSelectionDialogProps) {
  const [activeTab, setActiveTab] = useState<"select" | "create">("select");
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New persona form state
  const [newPersonaName, setNewPersonaName] = useState("");
  const [newPersonaDescription, setNewPersonaDescription] = useState("");

  const createCharacterMutation = useCreateCharacterCard();

  // Fetch character cards (global only, session_id IS NULL)
  const { data: characterCards } = useQuery({
    ...cardQueries.list({ type: [CardType.Character] }),
    enabled: open,
  });

  // Fetch suggested persona card directly (may be a session-specific card not in global list)
  const { data: suggestedCard } = useQuery({
    ...cardQueries.detail<CharacterCard>(
      suggestedPersonaId ? new UniqueEntityID(suggestedPersonaId) : undefined,
    ),
    enabled: open && !!suggestedPersonaId,
  });

  // Reset state when dialog opens
  // If suggestedPersonaId is provided, pre-select it
  useEffect(() => {
    if (open) {
      setActiveTab("select");
      // Pre-select suggested persona if provided and loaded, otherwise null (no persona)
      // Use suggestedCard.id if available to ensure the ID matches what's rendered
      const preSelectedId = suggestedCard
        ? suggestedCard.id.toString()
        : suggestedPersonaId || null;
      setSelectedCharacterId(preSelectedId);
      setSearchTerm("");
      setNewPersonaName("");
      setNewPersonaDescription("");
      setIsSubmitting(false);
    }
  }, [open, suggestedPersonaId, suggestedCard]);

  // Filter characters by search term and separate suggested persona
  const { suggestedPersona, otherCharacters } = useMemo(() => {
    // Use suggestedCard from direct query (works for session-specific cards too)
    let suggested: CharacterCard | null = suggestedCard || null;

    // Filter out the suggested card from the list (to avoid showing it twice)
    let others: CharacterCard[] = [];
    if (characterCards) {
      for (const card of characterCards as CharacterCard[]) {
        if (!suggestedPersonaId || card.id.toString() !== suggestedPersonaId) {
          others.push(card);
        }
      }
    }

    // Apply search filter to others (suggested is always shown at top if exists)
    if (searchTerm.trim()) {
      const keyword = searchTerm.toLowerCase();
      others = others.filter((card: CharacterCard) => {
        const name = card.props.name?.toLowerCase() || "";
        const description = card.props.description?.toLowerCase() || "";
        return name.includes(keyword) || description.includes(keyword);
      });

      // Also filter suggested if search doesn't match
      if (suggested) {
        const name = suggested.props.name?.toLowerCase() || "";
        const description = suggested.props.description?.toLowerCase() || "";
        if (!name.includes(keyword) && !description.includes(keyword)) {
          suggested = null;
        }
      }
    }

    return { suggestedPersona: suggested, otherCharacters: others };
  }, [characterCards, searchTerm, suggestedPersonaId, suggestedCard]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleConfirm = useCallback(async () => {
    if (isSubmitting) return;

    if (activeTab === "select") {
      // No persona selected (skip)
      if (selectedCharacterId === null) {
        onConfirm(null);
        handleClose();
        return;
      }

      // Existing character selected
      onConfirm({
        type: "existing",
        characterId: selectedCharacterId,
      });
      handleClose();
    } else {
      // Create new persona - both name and description are required
      if (!newPersonaName.trim()) {
        toastError("Please enter a persona name");
        return;
      }
      if (!newPersonaDescription.trim()) {
        toastError("Please enter a persona description");
        return;
      }

      setIsSubmitting(true);
      try {
        // Create a minimal character card for the persona
        const createdCharacter = await createCharacterMutation.mutateAsync({
          name: newPersonaName.trim(),
          description: newPersonaDescription.trim(),
          tags: ["Persona"],
          version: "v1.0",
        });

        onConfirm({
          type: "existing",
          characterId: createdCharacter.id.toString(),
        });
        handleClose();
      } catch (error) {
        toastError("Failed to create persona", {
          description:
            error instanceof Error ? error.message : "An unknown error occurred",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [
    activeTab,
    selectedCharacterId,
    newPersonaName,
    newPersonaDescription,
    isSubmitting,
    createCharacterMutation,
    onConfirm,
    handleClose,
  ]);

  const isConfirmDisabled =
    isSubmitting ||
    (activeTab === "create" &&
      (!newPersonaName.trim() || !newPersonaDescription.trim())) ||
    (activeTab === "select" && !allowSkip && selectedCharacterId === null);

  return (
    <DialogBase
      open={open}
      onOpenChange={onOpenChange}
      title="Choose your persona"
      description="Select a character to represent you in this session, or create a new one."
      size="lg"
      isShowCloseButton={false}
      content={
        <div className="space-y-4">
          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "select" | "create")
            }
          >
            <TabsList variant="mobile" className="w-full">
              <TabsTrigger value="select">Select existing</TabsTrigger>
              <TabsTrigger value="create">Create new</TabsTrigger>
            </TabsList>

            {/* Select Tab Content */}
            <TabsContent value="select" className="space-y-4">
              {/* Search */}
              <SearchInput
                name="persona-search"
                placeholder="Search personas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              {/* Persona List */}
              <div className="max-h-[300px] space-y-3 overflow-y-auto pr-2">
                {/* Suggested Persona (shown at top if exists) */}
                {suggestedPersona && (
                  <PersonaCard
                    key={suggestedPersona.id.toString()}
                    card={suggestedPersona}
                    isSelected={
                      selectedCharacterId === suggestedPersona.id.toString()
                    }
                    onSelect={() =>
                      setSelectedCharacterId(suggestedPersona.id.toString())
                    }
                    isSuggested
                  />
                )}

                {/* No Persona Option */}
                {allowSkip && (
                  <NoPersonaCard
                    isSelected={selectedCharacterId === null}
                    onSelect={() => setSelectedCharacterId(null)}
                  />
                )}

                {/* Other Character Cards */}
                {otherCharacters.map((card: CharacterCard) => (
                  <PersonaCard
                    key={card.id.toString()}
                    card={card}
                    isSelected={selectedCharacterId === card.id.toString()}
                    onSelect={() =>
                      setSelectedCharacterId(card.id.toString())
                    }
                  />
                ))}

                {/* Empty state */}
                {!suggestedPersona &&
                  otherCharacters.length === 0 &&
                  searchTerm && (
                    <p className="py-10 text-center text-neutral-500">
                      No characters found matching "{searchTerm}"
                    </p>
                  )}
              </div>
            </TabsContent>

            {/* Create Tab Content */}
            <TabsContent value="create" className="space-y-4">
              <div className="space-y-4 rounded-xl border border-neutral-700 bg-neutral-900/50 p-4">
                <h3 className="border-b border-neutral-700 pb-2 text-lg font-bold text-white">
                  New persona
                </h3>

                <Input
                  label="Name"
                  labelPosition="inner"
                  placeholder="Your persona name (e.g., Alex, Writer)"
                  value={newPersonaName}
                  onChange={(e) => setNewPersonaName(e.target.value)}
                  maxLength={50}
                  isRequired
                />

                <Textarea
                  label="Description"
                  labelPosition="inner"
                  placeholder="Brief description or personality traits"
                  value={newPersonaDescription}
                  onChange={(e) => setNewPersonaDescription(e.target.value)}
                  rows={3}
                  autoResize
                  isRequired
                />

                <p className="text-xs text-neutral-500">
                  This persona will be used to represent you in conversations
                  with the AI.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      }
      footer={
        <div className="flex justify-end gap-2 border-t border-neutral-800 pt-4">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            loading={isSubmitting}
          >
            {activeTab === "create" ? "Create & Start" : "Start Session"}
          </Button>
        </div>
      }
    />
  );
}
