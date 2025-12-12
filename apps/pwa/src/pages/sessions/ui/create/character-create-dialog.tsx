import { useState, useRef, useCallback } from "react";
import type { ChangeEvent, MouseEvent, KeyboardEvent } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { X, Upload, Pencil, Plus, Trash2, Copy, BookOpen } from "lucide-react";
import { DialogBase } from "@/shared/ui/dialogs/base";
import { Button, Input, Textarea } from "@/shared/ui/forms";
import { AccordionBase } from "@/shared/ui";
import { toastSuccess, toastError } from "@/shared/ui/toast";
import { useCreateCharacterCard } from "@/entities/character/api";
import { CharacterCard } from "@/entities/card/domain/character-card";
import { TAG_DEFAULT } from "@/entities/card/domain";

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

interface LorebookEntryFormData {
  id: string;
  name: string;
  enabled: boolean;
  keys: string[];
  recallRange: number;
  content: string;
}

interface CharacterFormData {
  name: string;
  description: string;
  cardSummary?: string;
  tags: string[];
  lorebookEntries: LorebookEntryFormData[];
}

/**
 * Pending character data - stored in memory until session is created
 * Used for deferred character creation (session-local resources)
 */
export interface PendingCharacterData {
  id: string; // Temporary ID for UI tracking
  name: string;
  description: string;
  cardSummary?: string;
  tags: string[];
  lorebookEntries: LorebookEntryFormData[];
  imageFile?: File;
  previewImageUrl?: string; // Blob URL for preview
}

interface CharacterCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when character is created (immediate mode) */
  onCharacterCreated?: (character: CharacterCard) => void;
  /** Called when character data is collected (deferred mode) */
  onPendingCharacterCreated?: (data: PendingCharacterData) => void;
  /** If true, don't save to DB - just collect data for later creation */
  deferCreation?: boolean;
}

/**
 * Lorebook Item Title with actions (delete, copy)
 */
const LorebookItemTitle = ({
  name,
  onDelete,
  onCopy,
}: {
  name: string;
  onDelete?: (e: MouseEvent | KeyboardEvent) => void;
  onCopy?: (e: MouseEvent | KeyboardEvent) => void;
}) => {
  const handleDelete = (e: MouseEvent | KeyboardEvent) => {
    e.stopPropagation();
    onDelete?.(e);
  };

  const handleCopy = (e: MouseEvent | KeyboardEvent) => {
    e.stopPropagation();
    onCopy?.(e);
  };

  const handleCopyKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      onCopy?.(e);
    }
  };

  const handleDeleteKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      onDelete?.(e);
    }
  };

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="max-w-[200px] truncate sm:max-w-sm md:max-w-full">
        {name || "Untitled"}
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        {onCopy && (
          <button
            type="button"
            onClick={handleCopy}
            onKeyDown={handleCopyKeyDown}
            className="cursor-pointer text-neutral-500 hover:text-neutral-400"
            aria-label="Copy lorebook entry"
          >
            <Copy className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={handleDelete}
          onKeyDown={handleDeleteKeyDown}
          className="cursor-pointer text-neutral-500 hover:text-neutral-400"
          aria-label="Delete lorebook entry"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export function CharacterCreateDialog({
  open,
  onOpenChange,
  onCharacterCreated,
  onPendingCharacterCreated,
  deferCreation = false,
}: CharacterCreateDialogProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [openAccordionId, setOpenAccordionId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createCharacterMutation = useCreateCharacterCard();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    control,
    formState: { errors },
  } = useForm<CharacterFormData>({
    defaultValues: {
      name: "",
      description: "",
      cardSummary: "",
      tags: [],
      lorebookEntries: [],
    },
  });

  const { fields, remove, prepend } = useFieldArray({
    control,
    name: "lorebookEntries",
    keyName: "_rhfId",
  });

  const tags = watch("tags") || [];
  const cardSummary = watch("cardSummary") || "";
  const lorebookEntries = watch("lorebookEntries") || [];

  const updateTags = useCallback(
    (updater: (current: string[]) => string[]) => {
      const current = tags;
      const next = updater(current);
      setValue("tags", next, { shouldDirty: true });
    },
    [tags, setValue],
  );

  const handleUploadImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (
        !ALLOWED_IMAGE_TYPES.includes(
          file.type as (typeof ALLOWED_IMAGE_TYPES)[number],
        )
      ) {
        toastError("Invalid file type", {
          description: "Only PNG, JPEG, or WebP images are allowed.",
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }

      const url = URL.createObjectURL(file);
      setPreviewImage(url);
      setImageFile(file);
    }
  };

  const handleAddLorebook = () => {
    const newId = crypto.randomUUID();
    prepend({
      id: newId,
      name: "New Entry",
      enabled: true,
      keys: [],
      recallRange: 2,
      content: "",
    });
    setOpenAccordionId(newId);
  };

  const handleCopyLorebook = (index: number) => {
    const entries = getValues("lorebookEntries");
    const entryToCopy = entries[index];

    if (entryToCopy) {
      const newId = crypto.randomUUID();
      const copiedEntry = {
        ...entryToCopy,
        id: newId,
        name: `${entryToCopy.name} (Copy)`,
      };
      prepend(copiedEntry);
      setOpenAccordionId(newId);
    }
  };

  const handleClose = () => {
    reset();
    setPreviewImage(null);
    setImageFile(null);
    setOpenAccordionId("");
    onOpenChange(false);
  };

  const onSubmit = async (data: CharacterFormData) => {
    const normalizeField = (value: string | undefined) =>
      value === "" ? undefined : value;

    // Deferred creation mode - just collect data, don't save to DB
    if (deferCreation && onPendingCharacterCreated) {
      const pendingData: PendingCharacterData = {
        id: crypto.randomUUID(), // Temporary ID for UI tracking
        name: data.name,
        description: data.description,
        cardSummary: normalizeField(data.cardSummary),
        tags: data.tags,
        lorebookEntries: data.lorebookEntries,
        imageFile: imageFile ?? undefined,
        previewImageUrl: previewImage ?? undefined, // Keep the blob URL for preview
      };

      onPendingCharacterCreated(pendingData);
      toastSuccess("Character added!", {
        description: "Character will be created when session is saved.",
      });

      // Reset form but don't revoke preview URL (it's stored in pendingData)
      reset();
      setImageFile(null);
      setPreviewImage(null);
      setOpenAccordionId("");
      onOpenChange(false);
      return;
    }

    // Immediate creation mode - save to DB now
    const payload = {
      name: data.name,
      description: data.description,
      tags: data.tags,
      cardSummary: normalizeField(data.cardSummary),
      imageFile: imageFile ?? undefined,
      lorebookEntries: data.lorebookEntries,
    };

    try {
      const createdCharacter = await createCharacterMutation.mutateAsync(payload);
      toastSuccess("Character created!", {
        description: "Your character has been created successfully.",
      });

      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }

      reset();
      setImageFile(null);
      setPreviewImage(null);
      setOpenAccordionId("");

      if (onCharacterCreated && createdCharacter) {
        onCharacterCreated(createdCharacter);
      }
      onOpenChange(false);
    } catch (error) {
      toastError("Failed to create character", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  // Build accordion items for Lorebook
  const lorebookItems = fields.map((field, index) => {
    const entry = lorebookEntries[index];
    return {
      value: field.id,
      title: (
        <LorebookItemTitle
          name={entry?.name || "Untitled"}
          onDelete={() => remove(index)}
          onCopy={() => handleCopyLorebook(index)}
        />
      ),
      content: (
        <div className="space-y-4">
          <Input
            {...register(`lorebookEntries.${index}.name`)}
            label="Lorebook name"
            labelPosition="inner"
            isRequired
          />
          <Input
            {...register(`lorebookEntries.${index}.keys`, {
              setValueAs: (v) => (typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) : v),
            })}
            label="Trigger keywords"
            labelPosition="inner"
            isRequired
            placeholder="e.g. City, Rain"
            defaultValue={entry?.keys?.join(", ") || ""}
          />
          <Textarea
            {...register(`lorebookEntries.${index}.content`)}
            label="Description"
            labelPosition="inner"
            isRequired
            autoResize
          />
          <Input
            {...register(`lorebookEntries.${index}.recallRange`, {
              valueAsNumber: true,
            })}
            label="Recall range"
            labelPosition="inner"
            isRequired
            type="number"
            helpTooltip="Set the scan depth to determine how many messages are checked for triggers."
            caption="Min 0 / Max 100"
          />
        </div>
      ),
    };
  });

  return (
    <DialogBase
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleClose();
        }
      }}
      size="xl"
      isShowCloseButton={false}
      title="Create Character"
      description="Create a new character for your session"
      content={
        <form
          id="character-create-form"
          onSubmit={handleSubmit(onSubmit)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
              e.preventDefault();
            }
          }}
          className="space-y-6"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Image Upload */}
          <div className="flex justify-center">
            {previewImage ? (
              <div className="relative max-w-[150px]">
                <img
                  src={previewImage}
                  alt="Character preview"
                  className="h-full w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={handleUploadImage}
                  className="absolute -right-2 -bottom-2 flex h-8 w-8 items-center justify-center rounded-full border border-neutral-600 bg-neutral-900 text-white shadow-md transition-colors hover:bg-neutral-700"
                  aria-label="Edit image"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleUploadImage}
                className="flex h-[150px] w-[150px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-neutral-600 bg-neutral-800 text-neutral-400 transition-colors hover:border-neutral-500 hover:bg-neutral-700 hover:text-neutral-300"
              >
                <Upload className="h-6 w-6" />
                <span className="text-xs">Add image</span>
              </button>
            )}
          </div>

          {/* Character Name */}
          <Input
            {...register("name", {
              required: "Character name is required",
            })}
            label="Character Name"
            labelPosition="inner"
            maxLength={50}
            error={errors.name?.message}
            isRequired
          />

          {/* Character Summary */}
          <div className="space-y-1">
            <Input
              {...register("cardSummary")}
              label="Character Summary"
              labelPosition="inner"
              maxLength={50}
              error={errors.cardSummary?.message}
            />
            <div className="px-2 text-left text-xs text-neutral-400">
              {`(${cardSummary.length}/50)`}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <h3 className="text-xs text-neutral-200">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {TAG_DEFAULT.map((tag, index) => {
                const isSelected = tags.includes(tag);
                return (
                  <button
                    key={`${tag}-${index}`}
                    type="button"
                    onClick={() =>
                      updateTags((current) =>
                        isSelected
                          ? current.filter((t) => t !== tag)
                          : [...current, tag],
                      )
                    }
                    className={`rounded-md px-2 py-1 text-xs font-medium shadow-sm transition-colors ${
                      isSelected
                        ? "bg-brand-500/20 text-brand-400"
                        : "bg-neutral-800 text-neutral-100 hover:bg-neutral-700"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Character Description */}
          <Textarea
            {...register("description", {
              required: "Character description is required",
            })}
            label="Character Description"
            labelPosition="inner"
            autoResize
            error={errors.description?.message}
            isRequired
          />

          {/* Lorebook Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-neutral-200">Lorebook</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddLorebook}
                icon={<Plus className="h-4 w-4" />}
              >
                Add
              </Button>
            </div>

            {fields.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-900/50 p-6 text-center">
                <BookOpen size={28} className="mx-auto mb-2 text-neutral-600" />
                <p className="text-xs text-neutral-500">No lorebook entries</p>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={handleAddLorebook}
                  className="mt-2"
                >
                  Add your first entry
                </Button>
              </div>
            ) : (
              <AccordionBase
                type="single"
                collapsible
                value={openAccordionId}
                onValueChange={(value) => setOpenAccordionId(value as string)}
                items={lorebookItems}
              />
            )}
          </div>
        </form>
      }
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="character-create-form"
            loading={createCharacterMutation.isPending}
          >
            Create Character
          </Button>
        </div>
      }
    />
  );
}
