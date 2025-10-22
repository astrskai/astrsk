import { useState, useEffect, useRef, useCallback } from "react";
import { UseFormSetValue } from "react-hook-form";

import { UniqueEntityID } from "@/shared/domain/unique-entity-id";

import { Entry } from "@/modules/card/domain";

interface UseEntryListProps {
  entries: Entry[];
  formFieldName: string;
  setValue: UseFormSetValue<any>;
}

export const useEntryList = ({
  entries,
  formFieldName,
  setValue,
}: UseEntryListProps) => {
  // Track which entries are open in the accordion
  const [openItems, setOpenItems] = useState<string[]>([]);

  // References for tracking animations and focus
  const clonedItemRef = useRef<string | null>(null);
  const deleteItemRef = useRef<string | null>(null);

  // Initialize open items on first render only
  useEffect(() => {
    if (entries && entries.length > 0) {
      setOpenItems(entries.map((item) => item.id.toString()));
    }
  }, [entries]);

  // Handlers for entry management
  const handleEntriesChange = useCallback(
    (reorderedEntries: Entry[]) => {
      setValue(formFieldName, reorderedEntries, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [setValue, formFieldName],
  );

  const handleEntryChange = useCallback(
    (id: string, updatedEntry: Entry) => {
      const index = entries.findIndex((entry) => entry.id.toString() === id);
      if (index !== -1) {
        const newEntries = [...entries];
        newEntries[index] = updatedEntry;
        setValue(formFieldName, newEntries, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    },
    [entries, setValue, formFieldName],
  );

  const handleEntryDelete = useCallback(
    (id: string) => {
      const index = entries.findIndex((entry) => entry.id.toString() === id);
      if (index !== -1) {
        // Set the deletion reference to apply the animation
        deleteItemRef.current = id;

        // Apply delete animation before removing the item
        const element = document.getElementById(`entry-${id}`);
        if (element) {
          element.classList.add("animate-delete");

          // Wait for animation to complete before removing from state
          setTimeout(() => {
            const newEntries = [...entries];
            newEntries.splice(index, 1);
            setValue(formFieldName, newEntries, {
              shouldDirty: true,
              shouldValidate: true,
            });

            // Remove from openItems
            setOpenItems((prev) => prev.filter((itemId) => itemId !== id));

            deleteItemRef.current = null;
          }, 500); // Matches the animation duration
        } else {
          // If element not found, delete immediately
          const newEntries = [...entries];
          newEntries.splice(index, 1);
          setValue(formFieldName, newEntries, {
            shouldDirty: true,
            shouldValidate: true,
          });

          // Remove from openItems
          setOpenItems((prev) => prev.filter((itemId) => itemId !== id));
        }
      }
    },
    [entries, setValue, formFieldName],
  );

  const handleEntryClone = useCallback(
    (id: string) => {
      const index = entries.findIndex((entry) => entry.id.toString() === id);
      if (index !== -1) {
        const entry = entries[index];
        const entryJson = entry.toJSON();
        const clonedEntryResult = Entry.fromJSON({
          ...entryJson,
          id: new UniqueEntityID().toString(),
          name: `Copy of ${entry.name}`,
        });

        if (clonedEntryResult.isFailure) {
          console.error("Failed to clone entry:", clonedEntryResult.getError());
          return;
        }

        const clonedEntry = clonedEntryResult.getValue();
        // Insert cloned item after the original item
        const newEntries = [...entries];
        newEntries.splice(index, 0, clonedEntry);
        setValue(formFieldName, newEntries, {
          shouldDirty: true,
          shouldValidate: true,
        });

        // Add cloned entry to openItems
        const clonedEntryId = clonedEntry.id.toString();
        setOpenItems((prev) => [...prev, clonedEntryId]);

        // Set the ID in the ref for animation focus
        clonedItemRef.current = clonedEntryId;

        // Scroll to the cloned item
        setTimeout(() => {
          const element = document.getElementById(`entry-${clonedEntryId}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
            // Highlight animation
            element.classList.add("animate-highlight");
            // Remove highlight class after animation completes
            setTimeout(() => {
              element.classList.remove("animate-highlight");
              clonedItemRef.current = null;
            }, 2000);
          }
        }, 100);
      }
    },
    [entries, setValue, formFieldName],
  );

  const handleAddEntry = useCallback(() => {
    const newEntryResult = Entry.create({}); // Create a default entry
    if (newEntryResult.isSuccess) {
      const newEntry = newEntryResult.getValue();
      const currentEntries = entries || [];
      setValue(formFieldName, [newEntry, ...currentEntries], {
        shouldValidate: true,
      });

      // Add new entry to openItems
      const newEntryId = newEntry.id.toString();
      setOpenItems((prev) => [...prev, newEntryId]);

      // Set the ID in the ref for animation focus
      clonedItemRef.current = newEntryId;

      // Scroll to the new item
      setTimeout(() => {
        const element = document.getElementById(`entry-${newEntryId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
          // Highlight animation
          element.classList.add("animate-highlight");
          // Remove highlight class after animation completes
          setTimeout(() => {
            element.classList.remove("animate-highlight");
            clonedItemRef.current = null;
          }, 2000);
        }
      }, 100);
    }
  }, [entries, setValue, formFieldName]);

  /**
   * Check if entries are valid (all required fields are filled)
   * Returns true if all entries are valid, false otherwise
   */
  const validateEntries = useCallback(() => {
    if (!entries || entries.length === 0) return true;

    return entries.every((entry) => {
      // Check all required fields
      const isNameValid = entry.name.trim() !== "";
      const areKeysValid = entry.keys.length > 0;
      const isContentValid = entry.content.trim() !== "";
      const isRecallRangeValid = entry.recallRange > 0;

      return (
        isNameValid && areKeysValid && isContentValid && isRecallRangeValid
      );
    });
  }, [entries]);

  return {
    openItems,
    setOpenItems,
    clonedItemId: clonedItemRef.current,
    deleteItemId: deleteItemRef.current,
    handleEntriesChange,
    handleEntryChange,
    handleEntryDelete,
    handleEntryClone,
    handleAddEntry,
    validateEntries,
  };
};
