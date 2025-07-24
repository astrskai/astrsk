"use client";

import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";

import {
  ActiveTabType,
  CardFormValues,
  CardStore,
} from "@/components-v2/card/components/edit-sheet/card-form-sheet";
import { ImageUpload } from "@/components-v2/card/components/edit-sheet/image-upload";
import { SortableBlockListV2 } from "@/components-v2/card/components/edit-sheet/sortable-block-list-v2";
import { useEntryList } from "@/components-v2/card/hooks/useEntryList";
import { Typo2XLarge } from "@/components-v2/typo";
import { Button } from "@/components-v2/ui/button";
import { FloatingLabelInput } from "@/components-v2/ui/floating-label-input";
import { FloatingLabelInputs } from "@/components-v2/ui/floating-label-inputs";
import { FloatingLabelTextarea } from "@/components-v2/ui/floating-label-textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components-v2/ui/tabs";
import { CardType, CharacterCard } from "@/modules/card/domain";
import { cn } from "@/shared/utils";

interface CharacterFormProps {
  store: CardStore;
  card: CharacterCard;
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
  setIsFormDirty: (isDirty: boolean) => void;
  tryedValidation: boolean;
  isNewCard: boolean;
  isMobile?: boolean;
}

export const CharacterForm = ({
  store,
  card,
  activeTab,
  setActiveTab,
  setIsFormDirty,
  tryedValidation,
  isNewCard,
  isMobile,
}: CharacterFormProps) => {
  const methods = useForm<CardFormValues>({
    defaultValues: {
      title: card.props.title,
      newIcon: undefined,
      tags: card.props.tags,
      creator: card.props.creator,
      cardSummary: card.props.cardSummary,
      version: card.props.version,
      conceptualOrigin: card.props.conceptualOrigin,
      name: card.props.name,
      description: card.props.description,
      exampleDialogue: card.props.exampleDialogue,
      entries: card.props.lorebook?.entries ?? [],
    },
  });

  const {
    register,
    formState: { dirtyFields, errors },
    watch,
    getValues,
    setValue,
    trigger,
  } = methods;

  const newIcon = watch("newIcon");
  const titleValue = watch("title");
  const nameValue = watch("name");
  const descriptionValue = watch("description");
  const exampleDialogueValue = watch("exampleDialogue");
  const tagsValue = watch("tags");
  const creatorValue = watch("creator");
  const cardSummaryValue = watch("cardSummary");
  const versionValue = watch("version");
  const conceptualOriginValue = watch("conceptualOrigin");
  const entriesValue = watch("entries");

  // Use the custom hook for managing character book entries
  const {
    openItems,
    setOpenItems,
    clonedItemId,
    deleteItemId,
    handleEntriesChange,
    handleEntryChange,
    handleEntryDelete,
    handleEntryClone,
    handleAddEntry,
    validateEntries,
  } = useEntryList({
    entries: entriesValue ?? [],
    formFieldName: "entries",
    setValue,
  });

  const dirtyFieldsJson = JSON.stringify(dirtyFields);
  useEffect(() => {
    setIsFormDirty(Object.keys(dirtyFields).length > 0);
  }, [dirtyFields, dirtyFieldsJson, setIsFormDirty]);

  const setTrigger = store.setTrigger();
  useEffect(() => {
    setTrigger(trigger);
  }, [setTrigger, trigger]);

  // Set the getFormValues function in the store
  const setGetValues = store.setGetFormValues();
  useEffect(() => {
    setGetValues(getValues);
  }, [getValues, setGetValues]);

  const handleTabChange = useCallback(
    (value: string) => {
      if (
        value === ActiveTabType.BasicInfo ||
        value === ActiveTabType.AdditionalInfo
      ) {
        setActiveTab(value as ActiveTabType);
      }
    },
    [setActiveTab],
  );

  return (
    <div className="w-full">
      {!isMobile && (
        <div className="flex items-center gap-2 mt-2 mb-8">
          <Typo2XLarge>
            {isNewCard ? "Create" : "Edit"} Character Card
          </Typo2XLarge>
        </div>
      )}
      <div className={isMobile ? "mb-6" : "mb-10"}>
        <FloatingLabelInput
          id="title"
          label="Card title*"
          {...register("title", {
            required: true,
            onChange: () => {
              if (errors.title) {
                trigger("title");
              }
            },
          })}
          value={titleValue}
          error={!!errors.title}
          helpText={errors.title ? "Title is required" : undefined}
        />
      </div>
      <Tabs
        defaultValue="basic-info"
        className="w-full"
        onValueChange={handleTabChange}
        value={activeTab}
      >
        <TabsList
          variant={isMobile ? "dark-mobile" : undefined}
          className={cn(
            isMobile
              ? "flex w-full overflow-x-auto"
              : "grid w-full grid-cols-2",
          )}
        >
          <TabsTrigger value="basic-info">Character info</TabsTrigger>
          <TabsTrigger value="additional-info">Card info</TabsTrigger>
        </TabsList>

        <TabsContent
          value="basic-info"
          className={cn("space-y-4 mt-10", isMobile ? "space-y-[24px]" : "")}
        >
          <div className="flex flex-col items-center mb-10">
            <div className="w-[200px] h-[200px]">
              <ImageUpload
                type={CardType.Character}
                title={card.props.title}
                iconAssetId={card.props.iconAssetId}
                newIcon={newIcon}
                newIconProps={register("newIcon")}
              />
            </div>
          </div>
          <FloatingLabelInput
            id="name"
            label="Character name*"
            {...register("name", {
              required: true,
              onChange: () => {
                if (errors.name) {
                  trigger("name");
                }
              },
            })}
            value={nameValue}
            error={!!errors.name}
            helpText={
              errors.name ? "Character name is required" : "{{char.name}}"
            }
          />
          <div className="space-y-2">
            <FloatingLabelTextarea
              label="Description*"
              {...register("description", {
                required: true,
                onChange: () => {
                  if (errors.description) {
                    trigger("description");
                  }
                },
              })}
              value={descriptionValue}
              error={!!errors.description}
              helpText={
                errors.description
                  ? "Description is required"
                  : "{{char.description}}"
              }
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <FloatingLabelTextarea
              label="Example dialogue"
              {...register("exampleDialogue", {
                onChange: () => {
                  if (errors.exampleDialogue) {
                    trigger("exampleDialogue");
                  }
                },
              })}
              value={exampleDialogueValue}
              error={!!errors.exampleDialogue}
              helpText="{{char.example_dialogue}}"
              className="min-h-[100px]"
            />
          </div>
          <div className="mt-8">
            {isMobile ? (
              <div className="space-y-2 flex flex-row items-center gap-[16px]">
                <Typo2XLarge>Lorebook</Typo2XLarge>
                <Button
                  type="button"
                variant="outline"
                size="lg"
                className="w-full h-[40px]"
                onClick={handleAddEntry}
              >
                + Add lorebook
              </Button>
            </div>
          ) : (
            <div className="mt-14">
              <div className={cn("space-y-2 mb-4")}>
                <Typo2XLarge>Lorebook</Typo2XLarge>
              </div>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full mb-4"
                onClick={handleAddEntry}
              >
                + Add lorebook
              </Button>
            </div>
          )}
          </div>
          <div className="space-y-2">
            <SortableBlockListV2
              items={entriesValue ?? []}
              onChange={handleEntriesChange}
              onEntryChange={handleEntryChange}
              onEntryDelete={handleEntryDelete}
              onEntryClone={handleEntryClone}
              clonedItemId={clonedItemId}
              deleteItemId={deleteItemId}
              openItems={openItems}
              onOpenItemsChange={setOpenItems}
              tryedValidation={tryedValidation}
            />
          </div>
        </TabsContent>

        <TabsContent value="additional-info" className="space-y-4 mt-4">
          <div className="space-y-4">
            <FloatingLabelInputs
              label="Tags"
              values={tagsValue}
              onValuesChange={(newTags) => {
                setValue("tags", newTags, { shouldDirty: true });
              }}
              helpText={
                tagsValue.length >= 5
                  ? "You can only add up to 5 tags."
                  : undefined
              }
              warning={tagsValue.length >= 5}
              maxBadgeCount={5}
              onBadgeClick={(value, index) => {}}
              error={!!errors.tags}
              badgeClassName={isMobile ? "bg-background-card" : ""}
              id="tags"
            />
            <FloatingLabelInput
              id="creator"
              label="Creator"
              {...register("creator", {
                onChange: () => {
                  if (errors.creator) {
                    trigger("creator");
                  }
                },
              })}
              value={creatorValue}
            />

            <FloatingLabelInput
              id="cardSummary"
              variant="guide"
              label="Card summary"
              {...register("cardSummary", {
                onChange: () => {
                  if (errors.cardSummary) {
                    trigger("cardSummary");
                  }
                },
              })}
              value={cardSummaryValue}
            />

            <FloatingLabelInput
              id="version"
              label="Version"
              {...register("version", {
                onChange: () => {
                  if (errors.version) {
                    trigger("version");
                  }
                },
              })}
              value={versionValue}
            />

            <FloatingLabelInput
              id="conceptualOrigin"
              label="Conceptual origin"
              {...register("conceptualOrigin", {
                onChange: () => {
                  if (errors.conceptualOrigin) {
                    trigger("conceptualOrigin");
                  }
                },
              })}
              value={conceptualOriginValue}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
