import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useBlocker } from "@tanstack/react-router";
import { useForm, useFieldArray } from "react-hook-form";
import { Trash2, ArrowLeft, X, Save, Upload, Plus, Copy } from "lucide-react";
import { Route } from "@/routes/_layout/assets/characters/$characterId";

import { characterQueries } from "@/entities/character/api";
import { useUpdateCharacterCard } from "@/entities/card/api/mutations";

import { Loading, DropdownMenuBase } from "@/shared/ui";
import { Button } from "@/shared/ui/forms";
import { useAsset } from "@/shared/hooks/use-asset";
import { Input, Textarea } from "@/shared/ui/forms";
import { useScrollToTop } from "@/shared/hooks/use-scroll-to-top";
import { AccordionBase } from "@/shared/ui";
import { DialogConfirm } from "@/shared/ui/dialogs";
import { toastSuccess, toastError } from "@/shared/ui/toast/base";
import { AssetService } from "@/app/services/asset-service";

interface LorebookEntryFormData {
  id: string;
  name: string;
  enabled: boolean;
  keys: string[];
  recallRange: number;
  content: string;
}

interface CharacterFormData {
  // CardProps
  title: string;
  tags: string[];
  creator?: string;
  cardSummary?: string;
  version?: string;
  conceptualOrigin?: string;
  iconAssetId?: string;

  // CharacterCardProps
  name: string;
  description: string;
  exampleDialogue?: string;

  // Lorebook
  lorebookEntries: LorebookEntryFormData[];
}

const TAG_DEFAULT = [
  "Female",
  "Male",
  "Villain",
  "Fictional",
  "OC",
  "LGBTQA+",
  "Platonic",
  "Angst",
  "Dead Dove",
  "Fluff",
  "Historical",
  "Royalty",
];

const LorebookItemTitle = ({
  name,
  onDelete,
  onCopy,
}: {
  name: string;
  onDelete?: (e: React.MouseEvent) => void;
  onCopy?: (e: React.MouseEvent) => void;
}) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent accordion from toggling
    onDelete?.(e);
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent accordion from toggling
    onCopy?.(e);
  };

  const handleCopyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      onCopy?.(e as unknown as React.MouseEvent);
    }
  };

  const handleDeleteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      onDelete?.(e as unknown as React.MouseEvent);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div>{name}</div>
      <div className="flex items-center gap-2">
        <div
          role="button"
          tabIndex={0}
          onClick={handleCopy}
          onKeyDown={handleCopyKeyDown}
          className="cursor-pointer text-gray-500 hover:text-gray-400"
          aria-label="Copy lorebook entry"
        >
          <Copy className="h-4 w-4" />
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={handleDelete}
          onKeyDown={handleDeleteKeyDown}
          className="cursor-pointer text-gray-500 hover:text-gray-400"
          aria-label="Delete lorebook entry"
        >
          <Trash2 className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
};

const LorebookItemContent = ({
  index,
  register,
  errors,
  setValue,
  getValues,
  trigger,
}: {
  index: number;
  register: ReturnType<typeof useForm<CharacterFormData>>["register"];
  errors: ReturnType<typeof useForm<CharacterFormData>>["formState"]["errors"];
  setValue: ReturnType<typeof useForm<CharacterFormData>>["setValue"];
  getValues: ReturnType<typeof useForm<CharacterFormData>>["getValues"];
  trigger: ReturnType<typeof useForm<CharacterFormData>>["trigger"];
}) => {
  const [newKeyword, setNewKeyword] = useState<string>("");

  // Get current keys from form state
  const currentKeys = getValues(`lorebookEntries.${index}.keys`) || [];

  // Register the keys field with validation
  useEffect(() => {
    register(`lorebookEntries.${index}.keys`, {
      validate: (value) =>
        value && value.length > 0
          ? true
          : "At least one trigger keyword is required",
    });
  }, [index, register]);

  const handleAddKeyword = () => {
    if (newKeyword.trim()) {
      // Get current keys from form (fresh value)
      const keys = getValues(`lorebookEntries.${index}.keys`) || [];
      // Check for duplicates
      if (keys.includes(newKeyword.trim())) {
        return; // Don't add duplicate
      }
      // Add new keyword
      const updatedKeys = [...keys, newKeyword.trim()];
      // Update the entire keys array
      setValue(`lorebookEntries.${index}.keys`, updatedKeys, {
        shouldDirty: true,
        shouldValidate: true,
      });
      // Trigger validation for this field
      trigger(`lorebookEntries.${index}.keys`);
      setNewKeyword("");
    }
  };

  const handleRemoveKeyword = (keyIndex: number) => {
    // Get current keys from form (fresh value)
    const keys = getValues(`lorebookEntries.${index}.keys`) || [];
    const updatedKeys = [...keys];
    updatedKeys.splice(keyIndex, 1);
    // Update the entire keys array
    setValue(`lorebookEntries.${index}.keys`, updatedKeys, {
      shouldDirty: true,
      shouldValidate: true,
    });
    // Trigger validation for this field
    trigger(`lorebookEntries.${index}.keys`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  return (
    <div className="space-y-2">
      <Input
        {...register(`lorebookEntries.${index}.name`, {
          required: "Lorebook name is required",
        })}
        label="Lorebook name"
        labelPosition="inner"
        error={errors?.lorebookEntries?.[index]?.name?.message}
      />

      <div className="space-y-2">
        <div className="relative">
          <Input
            label="Trigger keywords"
            labelPosition="inner"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            error={errors?.lorebookEntries?.[index]?.keys?.message}
            isRequired
            className="pr-20"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddKeyword}
            className="absolute right-2 bottom-2"
          >
            Add
          </Button>
        </div>

        {currentKeys.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {currentKeys.map((key, keyIndex) => (
              <li
                key={`${index}-${key}-${keyIndex}`}
                className="bg-background-primary flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm text-gray-50"
              >
                <span className="text-xs text-gray-200">{key}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveKeyword(keyIndex)}
                  className="text-gray-500 hover:text-gray-400"
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Textarea
        {...register(`lorebookEntries.${index}.content`, {
          required: "Lorebook description is required",
        })}
        label="Description"
        labelPosition="inner"
        autoResize
        error={errors?.lorebookEntries?.[index]?.content?.message}
      />

      <Input
        {...register(`lorebookEntries.${index}.recallRange`, {
          valueAsNumber: true,
          required: "Recall range is required",
        })}
        label="Recall range"
        labelPosition="inner"
        type="number"
        helpTooltip="Set the scan depth to determine how many messages are checked for triggers."
        caption="Min 0 / Max 10"
        error={errors?.lorebookEntries?.[index]?.recallRange?.message}
        isRequired
      />
    </div>
  );
};

const CharacterDetailPage = () => {
  const navigate = useNavigate();
  const { characterId } = Route.useParams();

  const { data: character, isLoading } = useQuery(
    characterQueries.detail(characterId),
  );

  const [imageUrl] = useAsset(character?.props.iconAssetId);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isImageRemoved, setIsImageRemoved] = useState<boolean>(false);
  const [newTag, setNewTag] = useState<string>("");
  const [openAccordionId, setOpenAccordionId] = useState<string>("");
  const [pendingLorebookId, setPendingLorebookId] = useState<string | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    getValues,
    trigger,
    watch,
    formState: { errors, isDirty },
  } = useForm<CharacterFormData>();

  const cardSummary = watch("cardSummary") || "";
  const tags = watch("tags") || [];

  const { fields, remove, prepend } = useFieldArray({
    control,
    name: "lorebookEntries",
    keyName: "_rhfId", // Use custom key name to avoid conflict with our 'id' field
  });

  const updateCharacterMutation = useUpdateCharacterCard(characterId);

  // Block navigation when there are unsaved changes (but not during save)
  const {
    proceed,
    reset: resetBlocker,
    status,
  } = useBlocker({
    shouldBlockFn: () => isDirty && !updateCharacterMutation.isPending,
    withResolver: true,
    enableBeforeUnload: isDirty && !updateCharacterMutation.isPending,
  });

  // Reset form when character data loads
  useEffect(() => {
    if (character) {
      reset({
        title: character.props.title || "",
        tags: character.props.tags || [],
        creator: character.props.creator || "",
        cardSummary: character.props.cardSummary || "",
        version: character.props.version || "",
        conceptualOrigin: character.props.conceptualOrigin || "",
        iconAssetId: character.props.iconAssetId?.toString() || undefined,
        name: character.props.name || "",
        description: character.props.description || "",
        exampleDialogue: character.props.exampleDialogue || "",
        lorebookEntries:
          character.props.lorebook?.props.entries.map((entry) => ({
            id: entry.id.toString(),
            name: entry.name || "",
            enabled: entry.enabled,
            keys: entry.keys || [],
            recallRange: entry.recallRange || 2,
            content: entry.content || "",
          })) || [],
      });
    }
  }, [character, reset]);

  // Scroll to top when character changes
  useScrollToTop([characterId]);

  // Auto-expand accordion when new lorebook is added
  useEffect(() => {
    if (pendingLorebookId) {
      // Check if the pending lorebook ID exists in fields
      const exists = fields.some((field) => {
        const entry = field as unknown as LorebookEntryFormData;
        return entry.id === pendingLorebookId;
      });

      if (exists) {
        setOpenAccordionId(pendingLorebookId);
        setPendingLorebookId(null);
      }
    }
  }, [fields, pendingLorebookId]);

  // Cleanup: Revoke preview URL on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  const handleGoBack = () => {
    navigate({ to: "/assets/characters" });
  };

  const handleUploadImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Only allow PNG, JPEG, or WebP for previews (disallow SVG for security)
      const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        toastError("Invalid file type", {
          description: "Only PNG, JPEG, or WebP images are allowed.",
        });
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      // Revoke previous preview URL to prevent memory leak
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewImage(url);
      setImageFile(file);
      setIsImageRemoved(false);

      // Mark form as dirty
      setValue(
        "iconAssetId",
        character?.props.iconAssetId?.toString() || undefined,
        {
          shouldDirty: true,
        },
      );
    }
  };

  const handleRemoveImage = () => {
    // Revoke preview URL to prevent memory leak
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
    }

    setPreviewImage(null);
    setImageFile(null);
    setIsImageRemoved(true);
    setValue("iconAssetId", "", { shouldDirty: true });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      // Don't add duplicate tags
      if (!tags.includes(newTag.trim())) {
        setValue("tags", [...tags, newTag.trim()], {
          shouldDirty: true,
        });
      }
      setNewTag("");
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

    setPendingLorebookId(newId);
  };

  const handleCopyLorebook = (index: number) => {
    const lorebookEntries = getValues("lorebookEntries");
    const entryToCopy = lorebookEntries[index];

    if (entryToCopy) {
      const newId = crypto.randomUUID();
      const copiedEntry = {
        ...entryToCopy,
        id: newId,
        name: `${entryToCopy.name} (Copy)`,
      };

      prepend(copiedEntry);
      setPendingLorebookId(newId);
    }
  };

  const onSubmit = async (data: CharacterFormData) => {
    try {
      // Upload new image if user selected one
      let uploadedAssetId = data.iconAssetId;

      if (imageFile) {
        const assetResult = await AssetService.saveFileToAsset.execute({
          file: imageFile,
        });

        if (assetResult.isSuccess) {
          const asset = assetResult.getValue();
          uploadedAssetId = asset.id.toString();
        } else {
          toastError("Failed to upload image", {
            description: "Please try again",
          });
          return;
        }
      }

      // Convert empty strings to undefined for optional fields
      const normalizeField = (value: string | undefined) =>
        value === "" ? undefined : value;

      await updateCharacterMutation.mutateAsync({
        title: data.name, // Use name as title (unified)
        name: data.name,
        description: data.description,
        exampleDialogue: normalizeField(data.exampleDialogue),
        tags: data.tags,
        creator: normalizeField(data.creator),
        cardSummary: normalizeField(data.cardSummary),
        version: normalizeField(data.version),
        conceptualOrigin: normalizeField(data.conceptualOrigin),
        iconAssetId: uploadedAssetId,
        lorebookEntries: data.lorebookEntries,
      });

      // Clear image file state after successful save
      // Revoke preview URL to prevent memory leak
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
      setImageFile(null);
      setPreviewImage(null);

      // Reset form to mark as not dirty after successful save
      // Normalize empty strings to undefined to match initial state
      reset({
        ...data,
        exampleDialogue: normalizeField(data.exampleDialogue),
        creator: normalizeField(data.creator),
        cardSummary: normalizeField(data.cardSummary),
        version: normalizeField(data.version),
        conceptualOrigin: normalizeField(data.conceptualOrigin),
        iconAssetId: uploadedAssetId,
      });

      toastSuccess("Character updated!", {
        description: "Your character has been updated successfully.",
      });

      // Navigate back to characters list page
      navigate({ to: "/assets/characters" });
    } catch (error) {
      toastError("Failed to save character", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  if (isLoading) return <Loading />;

  const displayImage = isImageRemoved ? null : previewImage || imageUrl;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full bg-gray-900">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="sticky top-0 z-10 flex items-center justify-between bg-gray-800 px-4 py-2">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            icon={<ArrowLeft className="h-5 w-5" />}
            size="sm"
            onClick={handleGoBack}
            type="button"
          />
          <h1 className="text-base font-semibold">{character?.props.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          {isDirty && (
            <span className="flex items-center gap-2 text-xs text-yellow-500">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-yellow-500"></span>
              </span>
              <span className="hidden sm:inline">Unsaved changes</span>
            </span>
          )}
          <Button
            icon={<Save className="h-4 w-4" />}
            type="submit"
            disabled={!isDirty || updateCharacterMutation.isPending}
            loading={updateCharacterMutation.isPending}
          >
            Save
          </Button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl space-y-6 p-4">
        <section className="flex w-full flex-col items-center justify-center gap-4">
          <div className="max-w-[200px] space-y-2 overflow-hidden rounded-lg">
            <DropdownMenuBase
              trigger={
                <img
                  src={
                    displayImage ?? "/img/placeholder/character-placeholder.png"
                  }
                  alt={character?.props.title ?? ""}
                  className="h-full w-full cursor-pointer object-cover"
                />
              }
              items={[
                {
                  label: "Upload image",
                  icon: <Upload className="h-4 w-4" />,
                  onClick: handleUploadImage,
                },
                {
                  label: "Remove image",
                  icon: <Trash2 className="h-4 w-4" />,
                  onClick: handleRemoveImage,
                  disabled: !displayImage,
                },
              ]}
              align="center"
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-text-primary text-base font-semibold">
              Metadata
            </h2>

            <div className="space-y-4">
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
              <div className="space-y-1">
                <Input
                  {...register("cardSummary")}
                  label="Character Summary"
                  labelPosition="inner"
                  maxLength={50}
                  error={errors.cardSummary?.message}
                />
                <div className="text-text-secondary px-2 text-left text-xs">
                  {`(${cardSummary.length}/50)`}
                </div>
              </div>

              <div className="flex flex-col gap-4 md:flex-row">
                <Input
                  {...register("version")}
                  label="Version"
                  labelPosition="inner"
                  maxLength={10}
                  error={errors.version?.message}
                />
                <Input
                  {...register("conceptualOrigin")}
                  label="Conceptual Origin"
                  labelPosition="inner"
                  maxLength={50}
                  error={errors.conceptualOrigin?.message}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-xs text-gray-200">Tags</h3>

              <div className="flex flex-wrap gap-2">
                {TAG_DEFAULT.map((tag, index) => {
                  const isSelected = tags.includes(tag);
                  return (
                    <button
                      key={`${tag}-${index}`}
                      type="button"
                      onClick={() => {
                        const currentTags = tags;
                        if (isSelected) {
                          // Remove tag
                          setValue(
                            "tags",
                            currentTags.filter((t) => t !== tag),
                            { shouldDirty: true },
                          );
                        } else {
                          // Add tag
                          setValue("tags", [...currentTags, tag], {
                            shouldDirty: true,
                          });
                        }
                      }}
                      className={`rounded-md p-2 text-sm font-medium shadow-sm transition-colors ${
                        isSelected
                          ? "bg-blue-200 text-blue-900"
                          : "bg-gray-800 text-gray-50 hover:bg-gray-700"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}

                {/* Custom tags (can be deleted) */}
                {tags
                  .filter((tag) => !TAG_DEFAULT.includes(tag))
                  .map((tag, index) => (
                    <span
                      key={`custom-${tag}-${index}`}
                      className="flex items-center gap-2 rounded-md bg-blue-200 p-2 text-sm font-medium text-blue-900"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => {
                          setValue(
                            "tags",
                            tags.filter((t) => t !== tag),
                            { shouldDirty: true },
                          );
                        }}
                        className="hover:text-gray-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
              </div>

              <div className="relative">
                <Input
                  labelPosition="inner"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="pr-20"
                />
                <Button
                  type="button"
                  onClick={handleAddTag}
                  variant="secondary"
                  size="sm"
                  className="absolute right-2 bottom-2"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-text-primary text-base font-semibold">
            Character Info
          </h2>

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
          <Textarea
            {...register("exampleDialogue")}
            label="Example Dialogue"
            labelPosition="inner"
            autoResize
            error={errors.exampleDialogue?.message}
          />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-text-primary text-base font-semibold">
              Lorebook
            </h2>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddLorebook}
            >
              <Plus className="h-4 w-4" />
              Add lorebook
            </Button>
          </div>

          <AccordionBase
            type="single"
            collapsible
            value={openAccordionId}
            onValueChange={(value) => setOpenAccordionId(value as string)}
            items={fields.map((field, index) => {
              // Cast to get the actual lorebook entry data
              const entry = field as unknown as LorebookEntryFormData;
              return {
                title: (
                  <LorebookItemTitle
                    name={entry.name}
                    onDelete={() => remove(index)}
                    onCopy={() => handleCopyLorebook(index)}
                  />
                ),
                content: (
                  <LorebookItemContent
                    index={index}
                    register={register}
                    errors={errors}
                    setValue={setValue}
                    getValues={getValues}
                    trigger={trigger}
                  />
                ),
                value: entry.id, // Use actual lorebook entry ID
              };
            })}
          />
        </section>
      </div>

      {/* Navigation Confirmation Dialog */}
      {status === "blocked" && (
        <DialogConfirm
          open={true}
          onOpenChange={(open) => {
            if (!open) resetBlocker();
          }}
          title="You've got unsaved changes!"
          description="Are you sure you want to leave? Your changes will be lost."
          cancelLabel="Go back"
          confirmLabel="Yes, leave"
          confirmVariant="destructive"
          onConfirm={proceed}
        />
      )}
    </form>
  );
};

export default CharacterDetailPage;
