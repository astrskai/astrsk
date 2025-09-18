import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { Textarea } from "@/components-v2/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { debounce } from "lodash-es";
import { cardQueries } from "@/app/queries/card/query-factory";
import { useUpdateCardImagePrompt } from "@/app/queries/card/mutations";

interface ImagePromptFieldProps {
  cardId: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ImagePromptField({
  cardId,
  value,
  onChange,
  disabled = false,
}: ImagePromptFieldProps) {
  const [localValue, setLocalValue] = useState(value);

  // Mutation for updating the image prompt with cursor and editing states
  const updateImagePrompt = useUpdateCardImagePrompt(cardId);

  // Track editing state in ref to avoid triggering effects
  const isEditingRef = useRef(updateImagePrompt.isEditing);
  const hasCursorRef = useRef(updateImagePrompt.hasCursor);

  useEffect(() => {
    isEditingRef.current = updateImagePrompt.isEditing;
  }, [updateImagePrompt.isEditing]);

  // Disable query refetching while editing or cursor is active
  const queryEnabled =
    !!cardId && !updateImagePrompt.isEditing && !updateImagePrompt.hasCursor;

  // Query to get the card data
  const { data: card } = useQuery({
    ...cardQueries.detail(cardId),
    enabled: queryEnabled,
    refetchOnWindowFocus:
      !updateImagePrompt.isEditing && !updateImagePrompt.hasCursor,
    refetchOnMount: false,
  });

  // Track current card in ref to avoid recreating debounced function
  const cardRef = useRef(card);
  useEffect(() => {
    cardRef.current = card;
  }, [card]);

  // Track last cardId to detect card changes
  const lastCardIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  // Initialize and sync data - only when switching cards or initial load
  useEffect(() => {
    // Initialize on first load or card change
    if (cardId && cardId !== lastCardIdRef.current) {
      if (card) {
        const newPrompt = card.props.imagePrompt || "";
        setLocalValue(newPrompt);
        onChange(newPrompt);
        initializedRef.current = true;
      }
      lastCardIdRef.current = cardId;
    }
    // Sync with database changes ONLY if we don't have cursor and not editing
    else if (
      card &&
      initializedRef.current &&
      !hasCursorRef.current &&
      !isEditingRef.current
    ) {
      const dbPrompt = card.props.imagePrompt || "";
      // Only update if the database value is different from local
      if (dbPrompt !== localValue) {
        setLocalValue(dbPrompt);
        onChange(dbPrompt);
      }
    }
  }, [cardId, card]); // Removed onChange and localValue from deps to prevent loops

  // Debounced save function - compare against current card value
  const debouncedSave = useMemo(
    () =>
      debounce((newValue: string) => {
        const card = cardRef.current;
        if (!card) return;

        const currentPrompt = card.props.imagePrompt || "";

        // Only save if the value actually changed from what's in the card
        if (newValue !== currentPrompt) {
          updateImagePrompt.mutate(newValue);
        }
      }, 500),
    [updateImagePrompt],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
      onChange(newValue);
      // Auto-save after user stops typing
      debouncedSave(newValue);
    },
    [onChange, debouncedSave],
  );

  const handleFocus = useCallback(() => {
    updateImagePrompt.setCursorActive(true);
  }, [updateImagePrompt]);

  const handleBlur = useCallback(() => {
    updateImagePrompt.setCursorActive(false);
  }, [updateImagePrompt]);

  return (
    <div className="flex-1 flex flex-col justify-start items-start gap-2 min-h-0">
      <div className="inline-flex justify-start items-center gap-2">
        <div className="justify-start text-text-body text-[10px] font-medium leading-none">
          Image prompt
        </div>
      </div>
      <div className="flex-1 w-full flex flex-col justify-start items-start gap-1 min-h-0">
        <Textarea
          value={localValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Describe the image you want to generate..."
          className="w-full flex-1 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-primary text-xs font-normal resize-none"
          disabled={disabled}
        />
        <div className="w-full px-4 inline-flex justify-center items-center gap-2">
          <div className="flex-1 justify-start text-text-info text-[10px] font-medium leading-none">
            Describe appearance, style, setting, and mood
          </div>
        </div>
      </div>
    </div>
  );
}
