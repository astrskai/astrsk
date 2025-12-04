import { useEffect, useRef, useState, useCallback } from "react";
import type { MouseEvent, KeyboardEvent, ChangeEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useBlocker } from "@tanstack/react-router";
import { useForm, useFieldArray } from "react-hook-form";
import {
  Trash2,
  ArrowLeft,
  X,
  Save,
  Upload,
  Plus,
  Copy,
  Pencil,
} from "lucide-react";
import { Route } from "@/routes/_layout/assets/scenarios/{-$scenarioId}";

import {
  scenarioQueries,
  useUpdatePlotCard,
  useCreatePlotCard,
} from "@/entities/scenario/api";

import { Loading } from "@/shared/ui";
import { Button } from "@/shared/ui/forms";
import { useAsset } from "@/shared/hooks/use-asset";
import { Input, Textarea } from "@/shared/ui/forms";
import { useScrollToTop } from "@/shared/hooks/use-scroll-to-top";
import { AccordionBase } from "@/shared/ui";
import { DialogConfirm } from "@/shared/ui/dialogs";
import { toastSuccess, toastError } from "@/shared/ui/toast";
import { TAG_DEFAULT } from "@/entities/card/domain";

interface LorebookEntryFormData {
  id: string;
  name: string;
  enabled: boolean;
  keys: string[];
  recallRange: number;
  content: string;
}

interface FirstMessageFormData {
  id: string;
  name: string;
  description: string;
}

interface ScenarioFormData {
  // CardProps
  title: string;
  tags: string[];
  creator?: string;
  cardSummary?: string;
  version?: string;
  conceptualOrigin?: string;
  iconAssetId?: string;

  // PlotCardProps
  description: string;
  // scenarios stored as "first message" - DB column is scenarios but UI shows "First Message"
  firstMessages: FirstMessageFormData[];

  // Lorebook
  lorebookEntries: LorebookEntryFormData[];
}


const FirstMessageItemTitle = ({
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
        {name}
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        <div
          role="button"
          tabIndex={0}
          onClick={handleCopy}
          onKeyDown={handleCopyKeyDown}
          className="cursor-pointer text-neutral-500 hover:text-neutral-400"
          aria-label="Copy first message"
        >
          <Copy className="h-4 w-4" />
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={handleDelete}
          onKeyDown={handleDeleteKeyDown}
          className="cursor-pointer text-neutral-500 hover:text-neutral-400"
          aria-label="Delete first message"
        >
          <Trash2 className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
};

const FirstMessageItemContent = ({
  index,
  register,
  errors,
}: {
  index: number;
  register: ReturnType<typeof useForm<ScenarioFormData>>["register"];
  errors: ReturnType<typeof useForm<ScenarioFormData>>["formState"]["errors"];
}) => {
  return (
    <div className="space-y-4">
      <Input
        {...register(`firstMessages.${index}.name`, {
          required: "First message name is required",
        })}
        label="Name"
        labelPosition="inner"
        error={errors?.firstMessages?.[index]?.name?.message}
        isRequired
      />

      <Textarea
        {...register(`firstMessages.${index}.description`, {
          required: "First message content is required",
        })}
        label="Content"
        labelPosition="inner"
        autoResize
        error={errors?.firstMessages?.[index]?.description?.message}
        isRequired
      />
    </div>
  );
};

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
        {name}
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        <div
          role="button"
          tabIndex={0}
          onClick={handleCopy}
          onKeyDown={handleCopyKeyDown}
          className="cursor-pointer text-neutral-500 hover:text-neutral-400"
          aria-label="Copy lorebook entry"
        >
          <Copy className="h-4 w-4" />
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={handleDelete}
          onKeyDown={handleDeleteKeyDown}
          className="cursor-pointer text-neutral-500 hover:text-neutral-400"
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
  watch,
  trigger,
}: {
  index: number;
  register: ReturnType<typeof useForm<ScenarioFormData>>["register"];
  errors: ReturnType<typeof useForm<ScenarioFormData>>["formState"]["errors"];
  setValue: ReturnType<typeof useForm<ScenarioFormData>>["setValue"];
  watch: ReturnType<typeof useForm<ScenarioFormData>>["watch"];
  trigger: ReturnType<typeof useForm<ScenarioFormData>>["trigger"];
}) => {
  const [newKeyword, setNewKeyword] = useState<string>("");

  // Watch current keys for real-time updates
  const currentKeys = watch(`lorebookEntries.${index}.keys`) || [];

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
      // Check for duplicates using watched value
      if (currentKeys.includes(newKeyword.trim())) {
        return; // Don't add duplicate
      }
      // Add new keyword
      const updatedKeys = [...currentKeys, newKeyword.trim()];
      setValue(`lorebookEntries.${index}.keys`, updatedKeys, {
        shouldDirty: true,
        shouldValidate: true,
      });
      trigger(`lorebookEntries.${index}.keys`);
      setNewKeyword("");
    }
  };

  const handleRemoveKeyword = (keyIndex: number) => {
    const updatedKeys = currentKeys.filter((_, i) => i !== keyIndex);
    setValue(`lorebookEntries.${index}.keys`, updatedKeys, {
      shouldDirty: true,
      shouldValidate: true,
    });
    trigger(`lorebookEntries.${index}.keys`);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  return (
    <div className="space-y-4">
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
            disabled={!newKeyword.trim()}
            className="absolute top-2.5 right-2"
          >
            Add
          </Button>
        </div>

        {currentKeys.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {currentKeys.map((key, keyIndex) => (
              <li
                key={`${index}-${key}-${keyIndex}`}
                className="flex items-center justify-between gap-2 rounded-md bg-neutral-800 px-2 py-1 text-sm text-neutral-100"
              >
                <span className="text-xs text-neutral-200">{key}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveKeyword(keyIndex)}
                  className="text-neutral-500 hover:text-neutral-400"
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
          min: { value: 0, message: "Recall range must be at least 0" },
          max: { value: 100, message: "Recall range cannot exceed 100" },
        })}
        label="Recall range"
        labelPosition="inner"
        type="number"
        helpTooltip="Set the scan depth to determine how many messages are checked for triggers."
        caption="Min 0 / Max 100"
        error={errors?.lorebookEntries?.[index]?.recallRange?.message}
        isRequired
      />
    </div>
  );
};

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

const ScenarioEditorPage = () => {
  const navigate = useNavigate();
  const { scenarioId } = Route.useParams();

  // Determine if we're in create mode (no scenarioId or "new")
  const isCreateMode = !scenarioId || scenarioId === "new";

  // Only fetch scenario data in edit mode
  const { data: scenario, isLoading } = useQuery({
    ...scenarioQueries.detail(scenarioId!),
    enabled: !isCreateMode,
  });

  const [imageUrl] = useAsset(scenario?.props.iconAssetId);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
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
  } = useForm<ScenarioFormData>({
    defaultValues: isCreateMode
      ? {
          title: "",
          description: "",
          tags: [],
          creator: "",
          cardSummary: "",
          version: "",
          conceptualOrigin: "",
          iconAssetId: undefined,
          firstMessages: [],
          lorebookEntries: [],
        }
      : undefined,
  });

  const cardSummary = watch("cardSummary") || "";
  const tags = watch("tags") || [];

  const {
    fields: lorebookFields,
    remove: removeLorebook,
    prepend: prependLorebook,
  } = useFieldArray({
    control,
    name: "lorebookEntries",
    keyName: "_rhfId",
  });

  const {
    fields: firstMessageFields,
    remove: removeFirstMessage,
    prepend: prependFirstMessage,
  } = useFieldArray({
    control,
    name: "firstMessages",
    keyName: "_rhfId",
  });

  // Mutations
  const updatePlotMutation = useUpdatePlotCard(scenarioId ?? "");
  const createPlotMutation = useCreatePlotCard();

  // Combined pending state
  const isSaving = updatePlotMutation.isPending || createPlotMutation.isPending;

  // Helper function to sort tags by TAG_DEFAULT order, then alphabetically for custom tags
  const sortTags = useCallback((tags: string[]) => {
    return [...tags].sort((a, b) => {
      const aIndex = TAG_DEFAULT.indexOf(a);
      const bIndex = TAG_DEFAULT.indexOf(b);

      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }

      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;

      return a.localeCompare(b);
    });
  }, []);

  // Helper to update tags with consistent sorting and defensive null handling
  const updateTags = useCallback(
    (updater: (current: string[]) => string[]) => {
      const current = getValues("tags") || [];
      const next = sortTags(updater(current));
      setValue("tags", next, { shouldDirty: true });
    },
    [getValues, setValue, sortTags],
  );

  // Block navigation when there are unsaved changes (but not during save)
  const {
    proceed,
    reset: resetBlocker,
    status,
  } = useBlocker({
    shouldBlockFn: () => isDirty && !isSaving,
    withResolver: true,
    enableBeforeUnload: isDirty && !isSaving,
  });

  // Reset form when scenario data loads
  useEffect(() => {
    if (scenario) {
      const initialTags = sortTags(scenario.props.tags || []);

      reset({
        title: scenario.props.title || "",
        tags: initialTags,
        creator: scenario.props.creator || "",
        cardSummary: scenario.props.cardSummary || "",
        version: scenario.props.version || "",
        conceptualOrigin: scenario.props.conceptualOrigin || "",
        iconAssetId: scenario.props.iconAssetId?.toString() || undefined,
        description: scenario.props.description || "",
        firstMessages:
          scenario.props.firstMessages?.map((s, idx) => ({
            id: crypto.randomUUID(),
            name: s.name || `First Message ${idx + 1}`,
            description: s.description || "",
          })) || [],
        lorebookEntries:
          scenario.props.lorebook?.props.entries.map((entry) => ({
            id: entry.id.toString(),
            name: entry.name || "",
            enabled: entry.enabled,
            keys: entry.keys || [],
            recallRange: entry.recallRange || 2,
            content: entry.content || "",
          })) || [],
      });
    }
  }, [scenario, reset, sortTags]);

  // Scroll to top when scenario changes
  useScrollToTop([scenarioId]);

  // Auto-expand accordion when new lorebook is added
  useEffect(() => {
    if (pendingLorebookId) {
      const exists = lorebookFields.some((field) => {
        const entry = field as unknown as LorebookEntryFormData;
        return entry.id === pendingLorebookId;
      });

      if (exists) {
        setOpenAccordionId(pendingLorebookId);
        setPendingLorebookId(null);
      }
    }
  }, [lorebookFields, pendingLorebookId]);

  // Cleanup: Revoke preview URL on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  const handleGoBack = () => {
    // Use browser's back button to go to previous page (usually session)
    window.history.back();
  };

  const handleUploadImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Only allow PNG, JPEG, or WebP for previews (disallow SVG for security)
      if (
        !ALLOWED_IMAGE_TYPES.includes(
          file.type as (typeof ALLOWED_IMAGE_TYPES)[number],
        )
      ) {
        toastError("Invalid file type", {
          description: "Only PNG, JPEG, or WebP images are allowed.",
        });
        // Reset file input
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

      // Mark form as dirty by setting a temporary value (file will be uploaded on submit)
      setValue("iconAssetId", `pending-upload-${Date.now()}`, {
        shouldDirty: true,
      });
    }
  };

  const handleAddTag = () => {
    const trimmed = newTag.trim();
    if (trimmed) {
      updateTags((current) =>
        current.includes(trimmed) ? current : [...current, trimmed],
      );
      setNewTag("");
    }
  };

  const handleAddLorebook = () => {
    const newId = crypto.randomUUID();

    prependLorebook({
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

      prependLorebook(copiedEntry);
      setPendingLorebookId(newId);
    }
  };

  const handleAddFirstMessage = () => {
    const newId = crypto.randomUUID();

    prependFirstMessage({
      id: newId,
      name: "New First Message",
      description: "",
    });

    setOpenAccordionId(newId);
  };

  const handleCopyFirstMessage = (index: number) => {
    const firstMessages = getValues("firstMessages");
    const entryToCopy = firstMessages[index];

    if (entryToCopy) {
      const newId = crypto.randomUUID();
      const copiedEntry = {
        ...entryToCopy,
        id: newId,
        name: `${entryToCopy.name} (Copy)`,
      };

      prependFirstMessage(copiedEntry);
      setOpenAccordionId(newId);
    }
  };

  const onSubmit = async (data: ScenarioFormData) => {
    // Convert empty strings to undefined for optional fields
    const normalizeField = (value: string | undefined) =>
      value === "" ? undefined : value;

    // Convert firstMessages to scenarios format for DB
    const scenariosForDB = data.firstMessages.map((fm) => ({
      name: fm.name,
      description: fm.description,
    }));

    // Build common mutation payload
    const payload = {
      title: data.title,
      description: data.description,
      scenarios: scenariosForDB,
      tags: data.tags,
      creator: normalizeField(data.creator),
      cardSummary: normalizeField(data.cardSummary),
      version: normalizeField(data.version),
      conceptualOrigin: normalizeField(data.conceptualOrigin),
      imageFile: imageFile ?? undefined,
      lorebookEntries: data.lorebookEntries,
    };

    try {
      if (isCreateMode) {
        await createPlotMutation.mutateAsync(payload);
        toastSuccess("Scenario created!", {
          description: "Your scenario has been created successfully.",
        });
      } else {
        await updatePlotMutation.mutateAsync({
          ...payload,
          iconAssetId: data.iconAssetId,
        });
        toastSuccess("Scenario updated!", {
          description: "Your scenario has been updated successfully.",
        });
      }

      // Clear image file state after successful save
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
      setImageFile(null);
      setPreviewImage(null);

      // Reset form to prevent navigation block
      reset({
        ...data,
        tags: sortTags(data.tags),
        creator: normalizeField(data.creator),
        cardSummary: normalizeField(data.cardSummary),
        version: normalizeField(data.version),
        conceptualOrigin: normalizeField(data.conceptualOrigin),
      });

      // Navigate back to scenarios list page
      navigate({ to: "/assets/scenarios" });
    } catch (error) {
      toastError("Failed to save scenario", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  // Only show loading in edit mode when fetching scenario data
  if (!isCreateMode && isLoading) return <Loading />;

  const displayImage = previewImage || imageUrl;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
          e.preventDefault();
        }
      }}
      className="flex w-full flex-1 flex-col"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="sticky top-0 z-10 flex items-center justify-between bg-zinc-950 px-4 py-2">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            icon={<ArrowLeft className="h-5 w-5" />}
            size="sm"
            onClick={handleGoBack}
            type="button"
          />
          <h1 className="text-base font-semibold">
            {isCreateMode ? "New Scenario" : scenario?.props.title}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {isDirty && (
            <span className="text-status-warning flex items-center gap-2 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="bg-status-warning absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
                <span className="bg-status-warning relative inline-flex h-2 w-2 rounded-full"></span>
              </span>
              <span className="hidden sm:inline">Unsaved changes</span>
            </span>
          )}
          <Button
            icon={<Save className="h-4 w-4" />}
            type="submit"
            disabled={isCreateMode ? isSaving : !isDirty || isSaving}
            loading={isSaving}
          >
            {isCreateMode ? "Create" : "Save"}
          </Button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl space-y-6 p-4">
        <section className="flex w-full flex-col items-center justify-center gap-4">
          {displayImage ? (
            <div className="relative max-w-[200px]">
              <img
                src={displayImage}
                alt={scenario?.props.title ?? ""}
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
              className="flex h-[200px] w-[200px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-neutral-600 bg-neutral-800 text-neutral-400 transition-colors hover:border-neutral-500 hover:bg-neutral-700 hover:text-neutral-300"
            >
              <Upload className="h-8 w-8" />
              <span className="text-sm">Add scenario image</span>
            </button>
          )}

          <div className="w-full space-y-4">
            <h2 className="text-base font-semibold text-neutral-100">
              Metadata
            </h2>

            <div className="space-y-4">
              <Input
                {...register("title", {
                  required: "Scenario title is required",
                })}
                label="Scenario Title"
                labelPosition="inner"
                maxLength={50}
                error={errors.title?.message}
                isRequired
              />
              <div className="space-y-1">
                <Input
                  {...register("cardSummary")}
                  label="Scenario Summary"
                  labelPosition="inner"
                  maxLength={50}
                  error={errors.cardSummary?.message}
                />
                <div className="px-2 text-left text-xs text-neutral-400">
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
                      className={`rounded-md p-1 text-xs font-medium shadow-sm transition-colors md:px-2 md:py-1 md:text-sm ${
                        isSelected
                          ? "bg-brand-500/20 text-brand-400"
                          : "bg-neutral-800 text-neutral-100 hover:bg-neutral-700"
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
                      className="bg-brand-500/20 text-brand-400 flex items-center gap-2 rounded-md p-1 text-xs font-medium md:px-2 md:py-1 md:text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() =>
                          updateTags((current) =>
                            current.filter((t) => t !== tag),
                          )
                        }
                        className="hover:text-brand-300"
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
                  disabled={!newTag.trim()}
                  className="absolute top-1/2 right-2 -translate-y-1/2"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-base font-semibold text-neutral-100">
            Scenario Info
          </h2>

          <Textarea
            {...register("description", {
              required: "Scenario description is required",
            })}
            label="Scenario Description"
            labelPosition="inner"
            autoResize
            error={errors.description?.message}
            isRequired
          />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-neutral-100">
              First Messages
            </h2>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddFirstMessage}
            >
              <Plus className="h-4 w-4" />
              Add first message
            </Button>
          </div>

          {firstMessageFields.length === 0 ? (
            <p className="text-sm text-neutral-400">
              No first messages yet. Add one to get started.
            </p>
          ) : (
            <AccordionBase
              type="single"
              collapsible
              value={openAccordionId}
              onValueChange={(value) => setOpenAccordionId(value as string)}
              items={firstMessageFields.map((field, index) => {
                const entry = field as unknown as FirstMessageFormData;
                return {
                  title: (
                    <FirstMessageItemTitle
                      name={entry.name}
                      onDelete={() => removeFirstMessage(index)}
                      onCopy={() => handleCopyFirstMessage(index)}
                    />
                  ),
                  content: (
                    <FirstMessageItemContent
                      index={index}
                      register={register}
                      errors={errors}
                    />
                  ),
                  value: entry.id,
                };
              })}
            />
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-neutral-100">
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

          {lorebookFields.length === 0 ? (
            <p className="text-sm text-neutral-400">
              No lorebook entries yet. Add one to get started.
            </p>
          ) : (
            <AccordionBase
              type="single"
              collapsible
              value={openAccordionId}
              onValueChange={(value) => setOpenAccordionId(value as string)}
              items={lorebookFields.map((field, index) => {
                const entry = field as unknown as LorebookEntryFormData;
                return {
                  title: (
                    <LorebookItemTitle
                      name={entry.name}
                      onDelete={() => removeLorebook(index)}
                      onCopy={() => handleCopyLorebook(index)}
                    />
                  ),
                  content: (
                    <LorebookItemContent
                      index={index}
                      register={register}
                      errors={errors}
                      setValue={setValue}
                      watch={watch}
                      trigger={trigger}
                    />
                  ),
                  value: entry.id,
                };
              })}
            />
          )}
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

export default ScenarioEditorPage;
