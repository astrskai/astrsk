import { useState, useEffect, useCallback, useMemo } from "react";
import { Card } from "@/modules/card/domain";
import { Input } from "@/components-v2/ui/input";
import { X } from "lucide-react";
import { debounce } from "lodash-es";
import { 
  useCardPanel, 
  CardPanelProps, 
  CardPanelLoading, 
  CardPanelError 
} from "@/components-v2/card/panels/hooks/use-card-panel";

interface MetadataPanelProps extends CardPanelProps {}

export function MetadataPanel({ cardId }: MetadataPanelProps) {
  // 1. Use abstraction hook for card panel functionality
  const { card, isLoading, lastInitializedCardId, saveCard } = useCardPanel<Card>({
    cardId,
  });
  
  // 2. UI state
  const [tagError, setTagError] = useState(false);
  
  // 3. Local form state
  const [tags, setTags] = useState<string[]>([]);
  const [creator, setCreator] = useState("");
  const [cardSummary, setCardSummary] = useState("");
  const [version, setVersion] = useState("");
  const [conceptualOrigin, setConceptualOrigin] = useState("");
  const [newTag, setNewTag] = useState("");

  // 4. SINGLE initialization useEffect (right after state)
  useEffect(() => {
    if (cardId !== lastInitializedCardId.current && card) {
      setTags(card.props.tags || []);
      setCreator(card.props.creator || "");
      setCardSummary(card.props.cardSummary || "");
      setVersion(card.props.version || "");
      setConceptualOrigin(card.props.conceptualOrigin || "");
      lastInitializedCardId.current = cardId;
    }
  }, [cardId, card, lastInitializedCardId]);

  // 5. Debounced save with parameters (NOT closures!)
  const debouncedSave = useMemo(
    () => debounce((newTags: string[], newCreator: string, newCardSummary: string, newVersion: string, newConceptualOrigin: string) => {
      if (!card) return;

      // Check for actual changes before saving
      if (
        JSON.stringify(newTags) === JSON.stringify(card.props.tags || []) &&
        newCreator === (card.props.creator || "") &&
        newCardSummary === (card.props.cardSummary || "") &&
        newVersion === (card.props.version || "") &&
        newConceptualOrigin === (card.props.conceptualOrigin || "")
      ) return;

      const updateResult = card.update({
        tags: newTags,
        creator: newCreator,
        cardSummary: newCardSummary,
        version: newVersion,
        conceptualOrigin: newConceptualOrigin,
      });

      if (updateResult.isSuccess) {
        saveCard(card);
      }
    }, 300),
    [card, saveCard]
  );

  // 6. Change handlers that pass current values
  const handleCreatorChange = useCallback((value: string) => {
    setCreator(value);
    debouncedSave(tags, value, cardSummary, version, conceptualOrigin);
  }, [debouncedSave, tags, cardSummary, version, conceptualOrigin]);

  const handleCardSummaryChange = useCallback((value: string) => {
    setCardSummary(value);
    debouncedSave(tags, creator, value, version, conceptualOrigin);
  }, [debouncedSave, tags, creator, version, conceptualOrigin]);

  const handleVersionChange = useCallback((value: string) => {
    setVersion(value);
    debouncedSave(tags, creator, cardSummary, value, conceptualOrigin);
  }, [debouncedSave, tags, creator, cardSummary, conceptualOrigin]);

  const handleConceptualOriginChange = useCallback((value: string) => {
    setConceptualOrigin(value);
    debouncedSave(tags, creator, cardSummary, version, value);
  }, [debouncedSave, tags, creator, cardSummary, version]);

  // Tag management functions
  const handleAddTag = useCallback(() => {
    if (tags.length >= 5) {
      setTagError(true);
      return;
    }

    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const newTags = [...tags, newTag.trim()];
      setTags(newTags);
      setNewTag("");
      setTagError(false);
      debouncedSave(newTags, creator, cardSummary, version, conceptualOrigin);
    }
  }, [newTag, tags, creator, cardSummary, version, conceptualOrigin, debouncedSave]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    setTagError(false);
    debouncedSave(newTags, creator, cardSummary, version, conceptualOrigin);
  }, [tags, creator, cardSummary, version, conceptualOrigin, debouncedSave]);

  // 7. Early returns using abstraction components
  if (isLoading) {
    return <CardPanelLoading message="Loading card info..." />;
  }

  if (!card) {
    return <CardPanelError message="Card not found" />;
  }

  // 8. Render
  return (
    <div className="h-full w-full p-4 bg-background-surface-2 flex flex-col gap-4 overflow-auto relative">

      {/* Tags */}
      <div className="self-stretch flex flex-col justify-start items-end gap-1">
        <div className="self-stretch flex flex-col justify-center items-start gap-2">
          <div className="justify-start text-text-body text-[10px] font-medium leading-none">
            Tags
          </div>
          <div className="self-stretch flex flex-col justify-start items-start gap-1">
            <div className="self-stretch inline-flex justify-start items-center gap-1">
              <Input
                value={newTag}
                onChange={(e) => {
                  setNewTag(e.target.value);
                  if (tagError) setTagError(false);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                placeholder="Add a tag"
                className={`flex-1 h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] ${
                  tagError
                    ? "outline-status-destructive"
                    : "outline-border-normal"
                } text-text-primary text-xs font-normal`}
              />
              <button
                onClick={handleAddTag}
                className="h-8 px-3 py-2 bg-background-surface-4 rounded-full shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline-1 outline-offset-[-1px] outline-border-light flex justify-center items-center gap-2 cursor-pointer hover:bg-background-surface-3 transition-colors"
              >
                <div className="justify-center text-text-primary text-xs font-semibold leading-none">
                  Add
                </div>
              </button>
            </div>
            <div className="self-stretch px-4 inline-flex justify-center items-center gap-2">
              <div
                className={`flex-1 justify-start text-[10px] font-medium leading-none ${
                  tagError ? "text-status-destructive" : "text-text-subtle"
                }`}
              >
                {tagError
                  ? "Maximum of 5 tags allowed"
                  : "You can add up to 5 tags"}
              </div>
            </div>
          </div>
        </div>
        <div className="self-stretch inline-flex justify-start items-end gap-1 flex-wrap content-end">
          {tags.map((tag, index) => (
            <div
              key={index}
              className="px-2 py-1 bg-button-chips rounded-md flex justify-center items-center gap-2.5"
            >
              <div className="justify-start text-text-body text-xs font-normal">
                {tag}
              </div>
              <button
                className="opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => handleRemoveTag(tag)}
              >
                <X className="w-3 h-3 text-text-body" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Creator */}
      <div className="self-stretch flex flex-col justify-start items-start gap-2">
        <div className="self-stretch inline-flex justify-start items-center gap-2">
          <div className="justify-start text-text-body text-[10px] font-medium leading-none">
            Creator
          </div>
        </div>
        <div className="self-stretch flex flex-col justify-start items-start gap-1">
          <Input
            value={creator}
            onChange={(e) => handleCreatorChange(e.target.value)}
            placeholder="Creator name"
            className="self-stretch h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-primary text-xs font-normal"
          />
        </div>
      </div>

      {/* Card Summary */}
      <div className="self-stretch flex flex-col justify-start items-start gap-2">
        <div className="self-stretch inline-flex justify-start items-center gap-2">
          <div className="justify-start text-text-body text-[10px] font-medium leading-none">
            Card summary
          </div>
        </div>
        <div className="self-stretch flex flex-col justify-start items-start gap-1">
          <Input
            value={cardSummary}
            onChange={(e) => handleCardSummaryChange(e.target.value)}
            placeholder="Brief summary of the card"
            className="self-stretch h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-primary text-xs font-normal"
            maxLength={40}
          />
          <div className="self-stretch px-4 inline-flex justify-center items-center gap-2">
            <div className="flex-1 text-right justify-start text-text-info text-[10px] font-medium leading-none">
              {cardSummary.length}/40
            </div>
          </div>
        </div>
      </div>

      {/* Version */}
      <div className="self-stretch flex flex-col justify-start items-start gap-2">
        <div className="self-stretch inline-flex justify-start items-center gap-2">
          <div className="justify-start text-text-body text-[10px] font-medium leading-none">
            Version
          </div>
        </div>
        <div className="self-stretch flex flex-col justify-start items-start gap-1">
          <Input
            value={version}
            onChange={(e) => handleVersionChange(e.target.value)}
            placeholder="e.g. V1"
            className="self-stretch h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-primary text-xs font-normal"
          />
        </div>
      </div>

      {/* Conceptual Origin */}
      <div className="self-stretch flex flex-col justify-start items-start gap-2">
        <div className="self-stretch inline-flex justify-start items-center gap-2">
          <div className="justify-start text-text-body text-[10px] font-medium leading-none">
            Conceptual origin
          </div>
        </div>
        <div className="self-stretch flex flex-col justify-start items-start gap-1">
          <Input
            value={conceptualOrigin}
            onChange={(e) => handleConceptualOriginChange(e.target.value)}
            placeholder="e.g. Book, Movie, Original, etc."
            className="self-stretch h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-primary text-xs font-normal"
          />
        </div>
      </div>
    </div>
  );
}