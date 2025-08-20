import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Card } from "@/modules/card/domain";
import { Input } from "@/components-v2/ui/input";
import { X } from "lucide-react";
import { debounce } from "lodash-es";
import { useQuery } from "@tanstack/react-query";
import { 
  cardQueries, 
  useUpdateCardTags,
  useUpdateCardCreator,
  useUpdateCardSummary,
  useUpdateCardVersion,
  useUpdateCardConceptualOrigin
} from "@/app/queries/card";
import { 
  CardPanelProps, 
  CardPanelLoading, 
  CardPanelError 
} from "@/components-v2/card/panels/hooks/use-card-panel";

interface MetadataPanelProps extends CardPanelProps {}

export function MetadataPanel({ cardId }: MetadataPanelProps) {
  // Fine-grained mutations with optimistic updates
  const updateTags = useUpdateCardTags(cardId);
  const updateCreator = useUpdateCardCreator(cardId);
  const updateSummary = useUpdateCardSummary(cardId);
  const updateVersion = useUpdateCardVersion(cardId);
  const updateConceptualOrigin = useUpdateCardConceptualOrigin(cardId);
  
  // Track editing state in refs to avoid triggering effects
  const isEditingTagsRef = useRef(updateTags.isEditing);
  const isEditingCreatorRef = useRef(updateCreator.isEditing);
  const isEditingSummaryRef = useRef(updateSummary.isEditing);
  const isEditingVersionRef = useRef(updateVersion.isEditing);
  const isEditingOriginRef = useRef(updateConceptualOrigin.isEditing);
  
  useEffect(() => {
    isEditingTagsRef.current = updateTags.isEditing;
  }, [updateTags.isEditing]);
  
  useEffect(() => {
    isEditingCreatorRef.current = updateCreator.isEditing;
  }, [updateCreator.isEditing]);

  useEffect(() => {
    isEditingSummaryRef.current = updateSummary.isEditing;
  }, [updateSummary.isEditing]);

  useEffect(() => {
    isEditingVersionRef.current = updateVersion.isEditing;
  }, [updateVersion.isEditing]);

  useEffect(() => {
    isEditingOriginRef.current = updateConceptualOrigin.isEditing;
  }, [updateConceptualOrigin.isEditing]);

  // Load card data - disable refetching while editing or cursor is active
  const isAnyEditing = updateTags.isEditing || updateCreator.isEditing || 
                      updateSummary.isEditing || updateVersion.isEditing || 
                      updateConceptualOrigin.isEditing;
  const hasCursor = updateTags.hasCursor || updateCreator.hasCursor || 
                   updateSummary.hasCursor || updateVersion.hasCursor || 
                   updateConceptualOrigin.hasCursor;
  const queryEnabled = !!cardId && !isAnyEditing && !hasCursor;
  
  const { data: card, isLoading } = useQuery({
    ...cardQueries.detail(cardId),
    enabled: queryEnabled,
    refetchOnWindowFocus: !isAnyEditing && !hasCursor,
    refetchOnMount: false,
  });
  
  // UI state
  const [tagError, setTagError] = useState(false);
  
  // Local form state
  const [tags, setTags] = useState<string[]>([]);
  const [creator, setCreator] = useState("");
  const [cardSummary, setCardSummary] = useState("");
  const [version, setVersion] = useState("");
  const [conceptualOrigin, setConceptualOrigin] = useState("");
  const [newTag, setNewTag] = useState("");

  // Track initialization
  const lastCardIdRef = useRef<string | null>(null);
  
  // Track current card in ref to avoid recreating debounced functions
  const cardRef = useRef(card);
  useEffect(() => {
    cardRef.current = card;
  }, [card]);

  // Initialize and sync data
  useEffect(() => {
    // Initialize when card changes
    if (cardId && cardId !== lastCardIdRef.current && card) {
      setTags(card.props.tags || []);
      setCreator(card.props.creator || "");
      setCardSummary(card.props.cardSummary || "");
      setVersion(card.props.version || "");
      setConceptualOrigin(card.props.conceptualOrigin || "");
      lastCardIdRef.current = cardId;
    }
    // Sync when card changes externally (but not during editing or cursor active) - only if values actually differ
    else if (card && !isEditingTagsRef.current && !isEditingCreatorRef.current && 
             !isEditingSummaryRef.current && !isEditingVersionRef.current && 
             !isEditingOriginRef.current && !hasCursor) {
      const newTags = card.props.tags || [];
      const newCreator = card.props.creator || "";
      const newSummary = card.props.cardSummary || "";
      const newVersion = card.props.version || "";
      const newOrigin = card.props.conceptualOrigin || "";
      
      // Only update state if values actually changed
      if (JSON.stringify(tags) !== JSON.stringify(newTags)) {
        setTags(newTags);
      }
      if (creator !== newCreator) {
        setCreator(newCreator);
      }
      if (cardSummary !== newSummary) {
        setCardSummary(newSummary);
      }
      if (version !== newVersion) {
        setVersion(newVersion);
      }
      if (conceptualOrigin !== newOrigin) {
        setConceptualOrigin(newOrigin);
      }
    }
  }, [cardId, card, tags, creator, cardSummary, version, conceptualOrigin, hasCursor]);

  // Debounced save using fine-grained mutations
  const debouncedSaveCreator = useMemo(
    () => debounce((creator: string) => {
      const card = cardRef.current;
      if (!card) return;
      const currentCreator = card.props.creator || "";
      if (creator !== currentCreator) {
        updateCreator.mutate(creator);
      }
    }, 300),
    [updateCreator]
  );

  const debouncedSaveSummary = useMemo(
    () => debounce((summary: string) => {
      const card = cardRef.current;
      if (!card) return;
      const currentSummary = card.props.cardSummary || "";
      if (summary !== currentSummary) {
        updateSummary.mutate(summary);
      }
    }, 300),
    [updateSummary]
  );

  const debouncedSaveVersion = useMemo(
    () => debounce((version: string) => {
      const card = cardRef.current;
      if (!card) return;
      const currentVersion = card.props.version || "";
      if (version !== currentVersion) {
        updateVersion.mutate(version);
      }
    }, 300),
    [updateVersion]
  );

  const debouncedSaveConceptualOrigin = useMemo(
    () => debounce((origin: string) => {
      const card = cardRef.current;
      if (!card) return;
      const currentOrigin = card.props.conceptualOrigin || "";
      if (origin !== currentOrigin) {
        updateConceptualOrigin.mutate(origin);
      }
    }, 300),
    [updateConceptualOrigin]
  );

  // Change handlers for individual fields
  const handleCreatorChange = useCallback((value: string) => {
    setCreator(value);
    debouncedSaveCreator(value);
  }, [debouncedSaveCreator]);

  const handleCardSummaryChange = useCallback((value: string) => {
    setCardSummary(value);
    debouncedSaveSummary(value);
  }, [debouncedSaveSummary]);

  const handleVersionChange = useCallback((value: string) => {
    setVersion(value);
    debouncedSaveVersion(value);
  }, [debouncedSaveVersion]);

  const handleConceptualOriginChange = useCallback((value: string) => {
    setConceptualOrigin(value);
    debouncedSaveConceptualOrigin(value);
  }, [debouncedSaveConceptualOrigin]);

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
      updateTags.mutate(newTags);
    }
  }, [newTag, tags, updateTags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    setTagError(false);
    updateTags.mutate(newTags);
  }, [tags, updateTags]);

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
                onFocus={() => updateTags.setCursorActive(true)}
                onBlur={() => updateTags.setCursorActive(false)}
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
            onFocus={() => updateCreator.setCursorActive(true)}
            onBlur={() => updateCreator.setCursorActive(false)}
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
            onFocus={() => updateSummary.setCursorActive(true)}
            onBlur={() => updateSummary.setCursorActive(false)}
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
            onFocus={() => updateVersion.setCursorActive(true)}
            onBlur={() => updateVersion.setCursorActive(false)}
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
            onFocus={() => updateConceptualOrigin.setCursorActive(true)}
            onBlur={() => updateConceptualOrigin.setCursorActive(false)}
            placeholder="e.g. Book, Movie, Original, etc."
            className="self-stretch h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-primary text-xs font-normal"
          />
        </div>
      </div>
    </div>
  );
}