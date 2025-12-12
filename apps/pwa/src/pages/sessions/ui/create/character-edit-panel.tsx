/**
 * Character Edit Panel
 * Full-panel editor for session characters (draft characters)
 * Replaces the Character Library when editing
 *
 * Uses react-hook-form for efficient form management:
 * - Uncontrolled inputs (no re-render on every keystroke)
 * - Debounced auto-save (500ms after changes stop)
 * - External prop sync via reset()
 */
import { useRef, useMemo, useEffect } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import {
  ArrowLeft,
  ImagePlus,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Input, Textarea, Button } from "@/shared/ui/forms";
import { toastError } from "@/shared/ui/toast";
import { useFilePreviewUrl } from "@/shared/hooks/use-file-preview-url";
import type { LorebookEntryData } from "@/entities/character/types";
import { TAG_DEFAULT } from "@/entities/card/domain/tag-constants";
import type { DraftCharacter } from "./draft-character";

export interface CharacterEditPanelProps {
  character: DraftCharacter;
  onBack: () => void;
  onSave: (updatedCharacter: DraftCharacter) => void;
}

/**
 * Lorebook entry for form editing
 * Extends LorebookEntryData but keys is comma-separated string for easier editing
 */
type LorebookFormEntry = Omit<LorebookEntryData, "keys"> & { keys: string };

/**
 * Form data structure for character editing
 * Maps to DraftCharacterData on save
 */
interface CharacterFormData {
  name: string;
  cardSummary: string;
  description: string;
  tags: string[];
  lorebook: LorebookFormEntry[];
}

/**
 * Convert DraftCharacter to form data
 */
function characterToFormData(character: DraftCharacter): CharacterFormData {
  return {
    name: character.data?.name || "",
    cardSummary: character.data?.cardSummary || "",
    description: character.data?.description || "",
    tags: character.data?.tags || [],
    lorebook:
      character.data?.lorebook?.map((entry) => ({
        id: entry.id || crypto.randomUUID(),
        name: entry.name || "",
        enabled: entry.enabled ?? true,
        keys: entry.keys?.join(", ") || "",
        recallRange: entry.recallRange ?? 1000,
        content: entry.content || "",
      })) || [],
  };
}

/**
 * Deep compare two form data objects to detect if they're the same
 * Used to distinguish our own save echoing back from external changes
 */
function isSameFormData(a: CharacterFormData, b: CharacterFormData): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Convert form data back to DraftCharacter
 */
function formDataToCharacter(
  original: DraftCharacter,
  formData: CharacterFormData,
  imageFile: File | undefined,
): DraftCharacter {
  return {
    ...original,
    data: {
      ...original.data,
      name: formData.name,
      cardSummary: formData.cardSummary,
      description: formData.description,
      tags: formData.tags,
      imageFile,
      // When imageFile exists, don't store blob URL - useFilePreviewUrl will regenerate it
      // When no imageFile, preserve existing external URL (e.g., from AI chat)
      imageUrl: imageFile ? undefined : original.data?.imageUrl,
      lorebook: formData.lorebook.map((entry) => ({
        id: entry.id,
        name: entry.name,
        enabled: entry.enabled,
        keys: entry.keys
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
        recallRange: entry.recallRange,
        content: entry.content,
      })),
    },
  };
}

export function CharacterEditPanel({
  character,
  onBack,
  onSave,
}: CharacterEditPanelProps) {
  // Image file state (separate from form because File can't be serialized)
  const imageFileRef = useRef<File | undefined>(character.data?.imageFile);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track what we last saved to distinguish our own saves from external changes
  // When we save, we update this ref. When character prop changes, we compare
  // form data to detect if it's our save echoing back or an external update.
  const lastSavedDataRef = useRef<CharacterFormData | null>(null);
  const prevTempIdRef = useRef<string>(character.tempId);

  // React Hook Form setup
  const { register, control, reset, getValues, setValue, watch } =
    useForm<CharacterFormData>({
      defaultValues: characterToFormData(character),
    });

  // Field array for lorebook entries
  const {
    fields: lorebookFields,
    append: appendLorebook,
    remove: removeLorebook,
  } = useFieldArray({
    control,
    name: "lorebook",
  });

  // Watch tags for display (this is the only field we need to watch for UI)
  const watchedTags = useWatch({ control, name: "tags" });

  // Get preview URL for image
  const previewImageUrl = useFilePreviewUrl(
    imageFileRef.current,
    character.data?.imageUrl,
  );

  // Debounced save - only fires 500ms after last change
  const debouncedSave = useDebouncedCallback(() => {
    const formData = getValues();
    // Track what we're saving to distinguish from external changes
    lastSavedDataRef.current = formData;
    const updatedCharacter = formDataToCharacter(
      character,
      formData,
      imageFileRef.current,
    );
    onSave(updatedCharacter);
  }, 500);

  // Cancel pending debounced saves on character switch or unmount
  // to avoid saving stale data to the wrong character
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  // Watch form changes and trigger debounced save
  // Using watch() subscription - the official react-hook-form API
  // Note: We don't check isDirty here because the callback fires BEFORE
  // isDirty is updated. Instead, we rely on watch() only firing on actual changes.
  useEffect(() => {
    const subscription = watch(() => {
      debouncedSave();
    });
    return () => subscription.unsubscribe();
  }, [watch, debouncedSave]);

  // Sync from external changes (AI updates, different character selected)
  useEffect(() => {
    const incomingFormData = characterToFormData(character);

    // Case 1: Different character selected - always reset
    if (prevTempIdRef.current !== character.tempId) {
      reset(incomingFormData);
      imageFileRef.current = character.data?.imageFile;
      lastSavedDataRef.current = null;
      prevTempIdRef.current = character.tempId;
      return;
    }

    // Case 2: Same character - check if this is our own save echoing back
    // Use deep comparison to detect all field changes (tags, lorebook content, etc.)
    const lastSaved = lastSavedDataRef.current;
    if (lastSaved && isSameFormData(lastSaved, incomingFormData)) {
      // Our own save echoed back - don't reset
      return;
    }

    // External change detected (AI modified character) - reset form
    reset(incomingFormData);
    imageFileRef.current = character.data?.imageFile;
    lastSavedDataRef.current = null;
  }, [character, reset]);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toastError("Unsupported file type. Please use PNG, JPEG, or WebP.");
      // Reset input to allow re-selecting the same file
      e.target.value = "";
      return;
    }

    imageFileRef.current = file;
    // Reset input to allow re-selecting the same file
    e.target.value = "";
    // Trigger save for image change
    debouncedSave();
  };

  // Tag management (local state for input, form state for tags array)
  const tagInputRef = useRef<HTMLInputElement>(null);

  const handleAddTag = () => {
    const input = tagInputRef.current;
    if (!input) return;

    const newTag = input.value.trim();
    if (newTag && !watchedTags.includes(newTag)) {
      setValue("tags", [...watchedTags, newTag], { shouldDirty: true });
      input.value = "";
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setValue(
      "tags",
      watchedTags.filter((tag) => tag !== tagToRemove),
      { shouldDirty: true },
    );
  };

  // Toggle default tag (add if not present, remove if present)
  const handleToggleDefaultTag = (tag: string) => {
    if (watchedTags.includes(tag)) {
      setValue(
        "tags",
        watchedTags.filter((t) => t !== tag),
        { shouldDirty: true },
      );
    } else {
      setValue("tags", [...watchedTags, tag], { shouldDirty: true });
    }
  };

  // Add new lorebook entry
  const handleAddLorebookEntry = () => {
    appendLorebook({
      id: crypto.randomUUID(),
      name: "",
      enabled: true,
      keys: "",
      recallRange: 1000,
      content: "",
    });
  };

  // Validate image URL to prevent XSS
  const safeImageUrl = useMemo((): string | null => {
    if (!previewImageUrl) return null;
    try {
      const parsedUrl = new URL(previewImageUrl, window.location.origin);
      const isAllowedProtocol =
        parsedUrl.protocol === "blob:" || parsedUrl.protocol === "https:";
      const isSameOrigin = parsedUrl.origin === window.location.origin;

      if (isAllowedProtocol || isSameOrigin) {
        return parsedUrl.href;
      }
    } catch {
      // Invalid URL
    }
    return null;
  }, [previewImageUrl]);

  // Watch summary for character count display
  const watchedSummary = useWatch({ control, name: "cardSummary" });

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-zinc-800 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">
              Edit Character
            </h2>
            <p className="text-[10px] font-medium tracking-widest text-amber-400 uppercase">
              SESSION CHARACTER
            </p>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        <div className="space-y-6">
          {/* Image Upload */}
          <div className="flex flex-col items-center">
            {safeImageUrl ? (
              <div className="relative max-w-[160px]">
                <img
                  src={safeImageUrl}
                  alt="Character"
                  className="h-full w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -right-2 -bottom-2 flex h-8 w-8 items-center justify-center rounded-full border border-zinc-600 bg-zinc-900 text-white shadow-md transition-colors hover:bg-zinc-700"
                  aria-label="Edit image"
                >
                  <Pencil size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-[160px] w-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-600 bg-zinc-800 text-zinc-400 transition-colors hover:border-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
              >
                <ImagePlus size={32} />
                <span className="text-sm">Add image</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Metadata Section */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-zinc-200">Metadata</h2>

            <Input
              label="Character Name"
              labelPosition="inner"
              maxLength={50}
              isRequired
              {...register("name")}
            />

            <div className="space-y-1">
              <Input
                label="Character Summary"
                labelPosition="inner"
                maxLength={50}
                {...register("cardSummary")}
              />
              <div className="px-2 text-left text-xs text-zinc-400">
                {`(${watchedSummary?.length || 0}/50)`}
              </div>
            </div>
          </section>

          {/* Tags Section */}
          <section className="space-y-3">
            <h3 className="text-xs text-zinc-200">Tags</h3>

            {/* Default Tags - toggleable preset tags */}
            <div className="flex flex-wrap gap-1.5">
              {TAG_DEFAULT.map((tag) => {
                const isSelected = watchedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleDefaultTag(tag)}
                    className={`rounded-md px-2 py-1 text-xs font-medium shadow-sm transition-colors ${
                      isSelected
                        ? "bg-brand-500/20 text-brand-400"
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            {/* Custom Tags - user-added tags (excludes default tags) */}
            {watchedTags.filter((tag) => !TAG_DEFAULT.includes(tag)).length >
              0 && (
              <div className="flex flex-wrap gap-2">
                {watchedTags
                  .filter((tag) => !TAG_DEFAULT.includes(tag))
                  .map((tag) => (
                    <span
                      key={tag}
                      className="bg-brand-500/20 text-brand-400 flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-brand-300"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
              </div>
            )}

            <div className="relative">
              <Input
                ref={tagInputRef}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="pr-16"
              />
              <Button
                type="button"
                onClick={handleAddTag}
                variant="secondary"
                size="sm"
                className="absolute top-1/2 right-2 -translate-y-1/2"
              >
                Add
              </Button>
            </div>
          </section>

          {/* Character Info Section */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-zinc-200">
              Character Info
            </h2>

            <Textarea
              label="Character Description"
              labelPosition="inner"
              autoResize
              isRequired
              {...register("description")}
            />
          </section>

          {/* Lorebook Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-200">Lorebook</h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddLorebookEntry}
              >
                <Plus size={14} />
                Add lorebook
              </Button>
            </div>

            {lorebookFields.length === 0 ? (
              <p className="text-sm text-zinc-400">No lorebook entries</p>
            ) : (
              <div className="space-y-3">
                {lorebookFields.map((field, index) => (
                  <LorebookEntryForm
                    key={field.id}
                    index={index}
                    register={register}
                    onRemove={() => removeLorebook(index)}
                    control={control}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

/**
 * Lorebook Entry Form Component
 * Separated to avoid re-rendering all entries when one changes
 */
interface LorebookEntryFormProps {
  index: number;
  register: ReturnType<typeof useForm<CharacterFormData>>["register"];
  control: ReturnType<typeof useForm<CharacterFormData>>["control"];
  onRemove: () => void;
}

function LorebookEntryForm({
  index,
  register,
  control,
  onRemove,
}: LorebookEntryFormProps) {
  // Watch only this entry's name and keys for display
  const entryName = useWatch({ control, name: `lorebook.${index}.name` });
  const entryKeys = useWatch({ control, name: `lorebook.${index}.keys` });

  // Parse keys for tag display
  const keyTags = useMemo(
    () =>
      entryKeys
        ?.split(",")
        .map((k) => k.trim())
        .filter(Boolean) || [],
    [entryKeys],
  );

  return (
    <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400">
          {entryName || `Entry ${index + 1}`}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-zinc-500 hover:text-zinc-400"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <Input
        label="Lorebook name"
        labelPosition="inner"
        {...register(`lorebook.${index}.name`)}
      />

      <div className="space-y-2">
        <Input
          label="Trigger keywords"
          labelPosition="inner"
          placeholder="Comma-separated keywords"
          {...register(`lorebook.${index}.keys`)}
        />
        {keyTags.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {keyTags.map((key, keyIndex) => (
              <li
                key={keyIndex}
                className="rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-200"
              >
                {key}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Textarea
        label="Description"
        labelPosition="inner"
        autoResize
        {...register(`lorebook.${index}.content`)}
      />
    </div>
  );
}
