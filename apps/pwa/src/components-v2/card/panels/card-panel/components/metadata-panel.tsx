import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  useUpdateCardConceptualOrigin,
} from "@/app/queries/card";
import {
  CardPanelProps,
  CardPanelLoading,
  CardPanelError,
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
  const isAnyEditing =
    updateTags.isEditing ||
    updateCreator.isEditing ||
    updateSummary.isEditing ||
    updateVersion.isEditing ||
    updateConceptualOrigin.isEditing;
  const hasCursor =
    updateTags.hasCursor ||
    updateCreator.hasCursor ||
    updateSummary.hasCursor ||
    updateVersion.hasCursor ||
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
    else if (
      card &&
      !isEditingTagsRef.current &&
      !isEditingCreatorRef.current &&
      !isEditingSummaryRef.current &&
      !isEditingVersionRef.current &&
      !isEditingOriginRef.current &&
      !hasCursor
    ) {
      const newTags = card.props.tags || [];
      const newCreator = card.props.creator || "";
      const newSummary = card.props.cardSummary || "";
      const newVersion = card.props.version || "";
      const newOrigin = card.props.conceptualOrigin || "";

      // Select result caching handles object stability
      // Only update tags if they actually changed (compare array contents)
      const tagsChanged = JSON.stringify(tags) !== JSON.stringify(newTags);
      if (tagsChanged) {
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
  }, [
    cardId,
    card,
    tags,
    creator,
    cardSummary,
    version,
    conceptualOrigin,
    hasCursor,
  ]);

  // Debounced save using fine-grained mutations
  const debouncedSaveCreator = useMemo(
    () =>
      debounce((creator: string) => {
        const card = cardRef.current;
        if (!card) return;
        const currentCreator = card.props.creator || "";
        if (creator !== currentCreator) {
          updateCreator.mutate(creator);
        }
      }, 300),
    [updateCreator],
  );

  const debouncedSaveSummary = useMemo(
    () =>
      debounce((summary: string) => {
        const card = cardRef.current;
        if (!card) return;
        const currentSummary = card.props.cardSummary || "";
        if (summary !== currentSummary) {
          updateSummary.mutate(summary);
        }
      }, 300),
    [updateSummary],
  );

  const debouncedSaveVersion = useMemo(
    () =>
      debounce((version: string) => {
        const card = cardRef.current;
        if (!card) return;
        const currentVersion = card.props.version || "";
        if (version !== currentVersion) {
          updateVersion.mutate(version);
        }
      }, 300),
    [updateVersion],
  );

  const debouncedSaveConceptualOrigin = useMemo(
    () =>
      debounce((origin: string) => {
        const card = cardRef.current;
        if (!card) return;
        const currentOrigin = card.props.conceptualOrigin || "";
        if (origin !== currentOrigin) {
          updateConceptualOrigin.mutate(origin);
        }
      }, 300),
    [updateConceptualOrigin],
  );

  // Change handlers for individual fields
  const handleCreatorChange = useCallback(
    (value: string) => {
      setCreator(value);
      debouncedSaveCreator(value);
    },
    [debouncedSaveCreator],
  );

  const handleCardSummaryChange = useCallback(
    (value: string) => {
      setCardSummary(value);
      debouncedSaveSummary(value);
    },
    [debouncedSaveSummary],
  );

  const handleVersionChange = useCallback(
    (value: string) => {
      setVersion(value);
      debouncedSaveVersion(value);
    },
    [debouncedSaveVersion],
  );

  const handleConceptualOriginChange = useCallback(
    (value: string) => {
      setConceptualOrigin(value);
      debouncedSaveConceptualOrigin(value);
    },
    [debouncedSaveConceptualOrigin],
  );

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

  const handleRemoveTag = useCallback(
    (tagToRemove: string) => {
      const newTags = tags.filter((tag) => tag !== tagToRemove);
      setTags(newTags);
      setTagError(false);
      updateTags.mutate(newTags);
    },
    [tags, updateTags],
  );

  // 7. Early returns using abstraction components
  if (isLoading) {
    return <CardPanelLoading message="Loading card info..." />;
  }

  if (!card) {
    return <CardPanelError message="Card not found" />;
  }

  // 8. Render
  return (
    <div className="bg-background-surface-2 relative flex h-full w-full flex-col gap-4 overflow-auto p-4">
      {/* Tags */}
      <div className="flex flex-col items-end justify-start gap-1 self-stretch">
        <div className="flex flex-col items-start justify-center gap-2 self-stretch">
          <div className="text-text-body justify-start text-[10px] leading-none font-medium">
            Tags
          </div>
          <div className="flex flex-col items-start justify-start gap-1 self-stretch">
            <div className="inline-flex items-center justify-start gap-1 self-stretch">
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
                className={`bg-background-surface-0 h-8 flex-1 rounded-md px-4 py-2 outline-1 outline-offset-[-1px] ${
                  tagError
                    ? "outline-status-destructive"
                    : "outline-border-normal"
                } text-text-primary text-xs font-normal`}
              />
              <button
                onClick={handleAddTag}
                className="bg-background-surface-4 outline-border-light hover:bg-background-surface-3 flex h-8 cursor-pointer items-center justify-center gap-2 rounded-full px-3 py-2 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline-1 outline-offset-[-1px] transition-colors"
              >
                <div className="text-text-primary justify-center text-xs leading-none font-semibold">
                  Add
                </div>
              </button>
            </div>
            <div className="inline-flex items-center justify-center gap-2 self-stretch px-4">
              <div
                className={`flex-1 justify-start text-[10px] leading-none font-medium ${
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
        <div className="inline-flex flex-wrap content-end items-end justify-start gap-1 self-stretch">
          {tags.map((tag, index) => (
            <div
              key={index}
              className="bg-button-chips flex items-center justify-center gap-2.5 rounded-md px-2 py-1"
            >
              <div className="text-text-body justify-start text-xs font-normal">
                {tag}
              </div>
              <button
                className="cursor-pointer opacity-50 transition-opacity hover:opacity-100"
                onClick={() => handleRemoveTag(tag)}
              >
                <X className="text-text-body h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Creator */}
      <div className="flex flex-col items-start justify-start gap-2 self-stretch">
        <div className="inline-flex items-center justify-start gap-2 self-stretch">
          <div className="text-text-body justify-start text-[10px] leading-none font-medium">
            Creator
          </div>
        </div>
        <div className="flex flex-col items-start justify-start gap-1 self-stretch">
          <Input
            value={creator}
            onChange={(e) => handleCreatorChange(e.target.value)}
            onFocus={() => updateCreator.setCursorActive(true)}
            onBlur={() => updateCreator.setCursorActive(false)}
            placeholder="Creator name"
            className="bg-background-surface-0 outline-border-normal text-text-primary h-8 self-stretch rounded-md px-4 py-2 text-xs font-normal outline-1 outline-offset-[-1px]"
          />
        </div>
      </div>

      {/* Card Summary */}
      <div className="flex flex-col items-start justify-start gap-2 self-stretch">
        <div className="inline-flex items-center justify-start gap-2 self-stretch">
          <div className="text-text-body justify-start text-[10px] leading-none font-medium">
            Card summary
          </div>
        </div>
        <div className="flex flex-col items-start justify-start gap-1 self-stretch">
          <Input
            value={cardSummary}
            onChange={(e) => handleCardSummaryChange(e.target.value)}
            onFocus={() => updateSummary.setCursorActive(true)}
            onBlur={() => updateSummary.setCursorActive(false)}
            placeholder="Brief summary of the card"
            className="bg-background-surface-0 outline-border-normal text-text-primary h-8 self-stretch rounded-md px-4 py-2 text-xs font-normal outline-1 outline-offset-[-1px]"
            maxLength={40}
          />
          <div className="inline-flex items-center justify-center gap-2 self-stretch px-4">
            <div className="text-text-info flex-1 justify-start text-right text-[10px] leading-none font-medium">
              {cardSummary.length}/40
            </div>
          </div>
        </div>
      </div>

      {/* Version */}
      <div className="flex flex-col items-start justify-start gap-2 self-stretch">
        <div className="inline-flex items-center justify-start gap-2 self-stretch">
          <div className="text-text-body justify-start text-[10px] leading-none font-medium">
            Version
          </div>
        </div>
        <div className="flex flex-col items-start justify-start gap-1 self-stretch">
          <Input
            value={version}
            onChange={(e) => handleVersionChange(e.target.value)}
            onFocus={() => updateVersion.setCursorActive(true)}
            onBlur={() => updateVersion.setCursorActive(false)}
            placeholder="e.g. V1"
            className="bg-background-surface-0 outline-border-normal text-text-primary h-8 self-stretch rounded-md px-4 py-2 text-xs font-normal outline-1 outline-offset-[-1px]"
          />
        </div>
      </div>

      {/* Conceptual Origin */}
      <div className="flex flex-col items-start justify-start gap-2 self-stretch">
        <div className="inline-flex items-center justify-start gap-2 self-stretch">
          <div className="text-text-body justify-start text-[10px] leading-none font-medium">
            Conceptual origin
          </div>
        </div>
        <div className="flex flex-col items-start justify-start gap-1 self-stretch">
          <Input
            value={conceptualOrigin}
            onChange={(e) => handleConceptualOriginChange(e.target.value)}
            onFocus={() => updateConceptualOrigin.setCursorActive(true)}
            onBlur={() => updateConceptualOrigin.setCursorActive(false)}
            placeholder="e.g. Book, Movie, Original, etc."
            className="bg-background-surface-0 outline-border-normal text-text-primary h-8 self-stretch rounded-md px-4 py-2 text-xs font-normal outline-1 outline-offset-[-1px]"
          />
        </div>
      </div>
    </div>
  );
}
