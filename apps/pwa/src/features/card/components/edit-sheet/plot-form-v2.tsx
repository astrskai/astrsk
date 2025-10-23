"use client";

import { ChevronDown, ChevronUp, Copy, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import {
  ActiveTabType,
  CardStore,
} from "@/features/card/components/edit-sheet/card-form-sheet";
import { CardFormValues } from "@/features/card/types/card-form";
import { ImageUpload } from "@/features/card/components/edit-sheet/image-upload";
import { SortableBlockListV2 } from "@/features/card/components/edit-sheet/sortable-block-list-v2";
import { useEntryList } from "@/features/card/hooks/useEntryList";

import {
  Button,
  FloatingLabelInput,
  FloatingLabelInputs,
  FloatingLabelTextarea,
  Typo2XLarge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/ui";
import { CardType, PlotCard } from "@/modules/card/domain";
import { cn } from "@/shared/lib";

interface PlotFormV2Props {
  store: CardStore;
  card: PlotCard;
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
  setIsFormDirty: (isDirty: boolean) => void;
  tryedValidation: boolean;
  isNewCard: boolean;
  isMobile?: boolean;
}

export const PlotForm = ({
  store,
  card,
  activeTab,
  setActiveTab,
  setIsFormDirty,
  tryedValidation,
  isNewCard,
  isMobile,
}: PlotFormV2Props) => {
  const methods = useForm<CardFormValues>({
    defaultValues: {
      title: card.props.title || "",
      description: card.props.description || "",
      tags: card.props.tags || [],
      creator: card.props.creator || "",
      cardSummary: card.props.cardSummary || "",
      version: card.props.version || "",
      conceptualOrigin: card.props.conceptualOrigin || "",
      newIcon: undefined,
      entries: card.props.lorebook?.entries || [],
      scenarios: card.props.scenarios || [],
    },
  });

  // Initialize expandedMessages with all true
  const [expandedMessages, setExpandedMessages] = useState<
    Record<number, boolean>
  >(
    card.props.scenarios?.reduce(
      (acc, _, index) => {
        acc[index] = true;
        return acc;
      },
      {} as Record<number, boolean>,
    ) || {},
  );

  const {
    register,
    formState: { dirtyFields, errors },
    watch,
    getValues,
    setValue,
    trigger,
  } = methods;

  const newIcon = watch("newIcon");
  const entriesValue = watch("entries");
  const titleValue = watch("title");
  const descriptionValue = watch("description");
  const scenariosValue = watch("scenarios");

  const tagsValue = watch("tags");
  const creatorValue = watch("creator");
  const cardSummaryValue = watch("cardSummary");
  const versionValue = watch("version");
  const conceptualOriginValue = watch("conceptualOrigin");

  // Use the custom hook for managing lore book entries
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
    entries: entriesValue || [],
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

  const handleAddScenarios = () => {
    // Add new message at the beginning
    setValue(
      "scenarios",
      [{ name: "", description: "" }, ...(scenariosValue || [])],
      {
        shouldDirty: true,
      },
    );

    // Set only the new message (index 0) to expanded, keep others as they were
    setExpandedMessages((prev) => ({
      0: true, // New message is expanded
      ...Object.keys(prev).reduce(
        (acc, key) => {
          // Shift all previous keys by 1
          acc[Number(key) + 1] = prev[Number(key)];
          return acc;
        },
        {} as Record<number, boolean>,
      ),
    }));
  };

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

  const toggleOpen = (index: number) => {
    setExpandedMessages((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="w-full">
      {!isMobile && (
        <div className="mt-2 mb-8 flex items-center gap-2">
          <Typo2XLarge>{isNewCard ? "Create" : "Edit"} Plot Card</Typo2XLarge>
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
          <TabsTrigger value="basic-info">Plot info</TabsTrigger>
          <TabsTrigger value="additional-info">Card info</TabsTrigger>
        </TabsList>

        <TabsContent
          value="basic-info"
          className={cn("mt-10 space-y-4", isMobile ? "space-y-[24px]" : "")}
        >
          <div className="mb-10 flex flex-col items-center">
            <div className="h-[200px] w-[200px]">
              <ImageUpload
                type={CardType.Plot}
                title={card.props.title}
                iconAssetId={card.props.iconAssetId}
                newIcon={newIcon}
                newIconProps={register("newIcon")}
              />
            </div>
          </div>

          <FloatingLabelTextarea
            label="Description"
            {...register("description", {
              required: false,
              onChange: () => {
                if (errors.description) {
                  trigger("description");
                }
              },
            })}
            value={descriptionValue}
            error={!!errors.description}
            helpText={"{{description}}"}
            className="min-h-[100px]"
          />
          <div className="mt-8">
            {isMobile ? (
              <div className="flex flex-row items-center gap-[16px] space-y-2 pb-[16px]">
                <Typo2XLarge>Scenario</Typo2XLarge>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-[40px] w-full"
                  onClick={handleAddScenarios}
                >
                  + Add scenario entry
                </Button>
              </div>
            ) : (
              <div>
                <div className={"mb-4 space-y-2"}>
                  <Typo2XLarge>Scenario</Typo2XLarge>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="mb-4 w-full"
                  onClick={handleAddScenarios}
                >
                  + Add scenario entry
                </Button>
              </div>
            )}
            <div className="space-y-4">
              {scenariosValue?.map((scenario, index) => {
                const isExpanded = expandedMessages[index] === true;
                return (
                  <div
                    key={index}
                    className={`w-full ${isMobile ? "bg-background-surface-3" : "bg-background-card"} border-border-light overflow-hidden rounded-md border`}
                  >
                    <div className="flex items-center justify-between p-4">
                      <div className="flex w-full items-center gap-2">
                        <div className="w-full pr-4">
                          {isExpanded ? (
                            <FloatingLabelInput
                              id={`scenario-${index}`}
                              label="Scenario name*"
                              value={scenariosValue[index].name}
                              onChange={(e) => {
                                const newScenarios = [...scenariosValue];
                                newScenarios[index].name = e.target.value;
                                setValue("scenarios", newScenarios, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });
                              }}
                            />
                          ) : (
                            <div
                              className="flex cursor-pointer items-center gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleOpen(index);
                              }}
                            >
                              <span>{scenario.name || "Name*"}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost_white"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              const newScenarios = [...scenariosValue];
                              const scenarioToCopy = { ...newScenarios[index] };
                              scenarioToCopy.name = `Copy of ${scenarioToCopy.name}`;
                              newScenarios.splice(index, 0, scenarioToCopy);
                              setValue("scenarios", newScenarios, {
                                shouldDirty: true,
                              });
                              setExpandedMessages((prev) => {
                                // Create a new object to update expanded state
                                const updatedExpanded = { ...prev };
                                // Shift all indices after the current one
                                Object.keys(updatedExpanded)
                                  .map(Number)
                                  .filter((key) => key > index)
                                  .sort((a, b) => b - a) // Sort in descending order to avoid overwriting
                                  .forEach((key) => {
                                    updatedExpanded[key + 1] =
                                      updatedExpanded[key];
                                  });
                                // Set both original and copied scenario to expanded
                                updatedExpanded[index] = true;
                                updatedExpanded[index + 1] = true;
                                return updatedExpanded;
                              });
                            }}
                          >
                            <Copy className="min-h-[24px] min-w-[24px]" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost_white"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              const newScenarios = [...scenariosValue];
                              newScenarios.splice(index, 1);
                              setValue("scenarios", newScenarios, {
                                shouldDirty: true,
                              });
                            }}
                          >
                            <Trash2 className="min-h-[24px] min-w-[24px]" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost_white"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              const newExpanded = { ...expandedMessages };
                              newExpanded[index] = !isExpanded;
                              setExpandedMessages(newExpanded);
                            }}
                          >
                            {isExpanded ? (
                              <ChevronUp className="min-h-[24px] min-w-[24px]" />
                            ) : (
                              <ChevronDown className="min-h-[24px] min-w-[24px]" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="p-4">
                        <FloatingLabelTextarea
                          label="Scenario description*"
                          id={`scenario-${index}`}
                          value={scenariosValue[index].description}
                          className="min-h-[120px]"
                          onChange={(e) => {
                            const newScenarios = [...scenariosValue];
                            newScenarios[index].description = e.target.value;
                            setValue("scenarios", newScenarios, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8">
            {isMobile ? (
              <div className="flex flex-row items-center gap-[16px] space-y-2 pb-[16px]">
                <Typo2XLarge>Lorebook</Typo2XLarge>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-[40px] w-full"
                  onClick={handleAddEntry}
                >
                  + Add lorebook
                </Button>
              </div>
            ) : (
              <div>
                <div className={"mb-4 space-y-2"}>
                  <Typo2XLarge>Lore book</Typo2XLarge>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="mb-4 w-full"
                  onClick={handleAddEntry}
                >
                  + Add lorebook
                </Button>
              </div>
            )}

            <SortableBlockListV2
              items={entriesValue || []}
              onChange={handleEntriesChange}
              onEntryChange={handleEntryChange}
              onEntryDelete={handleEntryDelete}
              onEntryClone={handleEntryClone}
              openItems={openItems}
              onOpenItemsChange={setOpenItems}
              clonedItemId={clonedItemId}
              deleteItemId={deleteItemId}
              tryedValidation={tryedValidation}
            />
          </div>
        </TabsContent>

        <TabsContent value="additional-info" className="mt-4 space-y-4">
          <div className="space-y-4">
            <FloatingLabelInputs
              label="Tags"
              values={tagsValue}
              onValuesChange={(newTags) => {
                setValue("tags", newTags, { shouldDirty: true });
              }}
              helpText={
                tagsValue && tagsValue.length >= 5
                  ? "You can only add up to 5 tags."
                  : undefined
              }
              warning={tagsValue && tagsValue.length >= 5}
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

export default PlotForm;
