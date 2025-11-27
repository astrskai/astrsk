import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { flowQueries } from "@/entities/flow/api/query-factory";
import { dataStoreNodeQueries } from "@/entities/data-store-node/api/query-factory";
import { useUpdateDataStoreNodeFields } from "@/entities/data-store-node/api/mutations/field-mutations";
import { useFlowPanelContext } from "@/features/flow/ui/flow-panel-provider";
import { Button, Editor, ScrollAreaSimple } from "@/shared/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import { Plus, Trash2, Maximize2, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui";
import type { editor } from "monaco-editor";
import { debounce } from "lodash-es";
import type { DataStoreField } from "@/entities/flow/domain/flow";
import { SortableDataField } from "./sortable-data-field";
import { UniqueEntityID } from "@/shared/domain";
import { toastError, toastInfo } from "@/shared/ui/toast";

interface DataStorePanelProps {
  flowId: string;
  nodeId: string;
}

export function DataStorePanel({ flowId, nodeId }: DataStorePanelProps) {
  const { openPanel, closePanel } = useFlowPanelContext();

  // Get mutation hook with proper node-level updates
  const updateNodeFields = useUpdateDataStoreNodeFields(flowId, nodeId);

  // Query for node data from separate data store (new architecture)
  const { data: dataStoreNodeData, isLoading: dataStoreNodeLoading } = useQuery(
    {
      ...dataStoreNodeQueries.detail(nodeId),
      enabled: !!flowId && !!nodeId && !updateNodeFields.isEditing,
    },
  );

  // Query for data store schema - panel-specific query
  const { data: schema, isLoading: schemaLoading } = useQuery({
    ...flowQueries.dataStoreSchema(flowId),
    enabled: !!flowId && !updateNodeFields.isEditing,
  });

  const schemaFields = useMemo(() => schema?.fields || [], [schema?.fields]);

  // Auto-close panel when connected node is deleted
  useEffect(() => {
    if (!dataStoreNodeLoading && !dataStoreNodeData && nodeId) {
      // Node has been deleted, close the panel
      closePanel(`dataStore-${nodeId}`);
    }
  }, [dataStoreNodeData, dataStoreNodeLoading, nodeId, closePanel]);

  // Local state for imported fields and logic
  const [dataStoreFields, setDataStoreFields] = useState<DataStoreField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>("");
  const [selectedSchemaFieldId, setSelectedSchemaFieldId] =
    useState<string>("");
  const [localLogic, setLocalLogic] = useState("");
  const lastNodeIdRef = useRef<string>("");
  const isEditingLogicRef = useRef<boolean>(false);

  // Track blocking user from switching during save
  const [showLoading, setShowLoading] = useState(false);
  const pendingSaveRef = useRef<boolean>(false);
  const hasRecentlyEditedRef = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout>();
  const isFieldsPending = updateNodeFields.isPending;

  // Initialize data store fields from node data
  useEffect(() => {
    if (dataStoreNodeData && nodeId) {
      // Always sync when data changes, regardless of editing state
      if (dataStoreNodeData.dataStoreFields) {
        setDataStoreFields(dataStoreNodeData.dataStoreFields);
        if (
          dataStoreNodeData.dataStoreFields.length > 0 &&
          nodeId !== lastNodeIdRef.current
        ) {
          setSelectedFieldId(
            dataStoreNodeData.dataStoreFields[0].schemaFieldId,
          );
        }
      } else {
        setDataStoreFields([]);
        if (nodeId !== lastNodeIdRef.current) {
          setSelectedFieldId("");
        }
      }
      lastNodeIdRef.current = nodeId;
    }
  }, [dataStoreNodeData, nodeId]);

  // Sync logic with selected field - only when field selection or field logic changes
  useEffect(() => {
    // Don't sync if we're actively editing or have pending changes
    if (isEditingLogicRef.current || hasRecentlyEditedRef.current) {
      return;
    }

    const selectedField = dataStoreFields.find(
      (f) => f.schemaFieldId === selectedFieldId,
    );
    const newLogic = selectedField?.logic || "";
    if (localLogic !== newLogic) {
      setLocalLogic(newLogic);
    }
  }, [selectedFieldId, dataStoreFields, localLogic]);

  // Save data store fields to node using targeted mutation
  const saveDataStoreFields = useCallback(
    (fields: DataStoreField[]) => {
      updateNodeFields.mutate(fields, {
        onSuccess: () => {
          // Update local state after successful save
          setDataStoreFields(fields);
        },
        onError: (error) => {
          toastError("Failed to save data store fields", {
            description:
              error instanceof Error ? error.message : "Unknown error",
          });
        },
      });
    },
    [updateNodeFields],
  );

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Handle drag end for reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = dataStoreFields.findIndex(
        (item) => item.schemaFieldId === active.id,
      );
      const newIndex = dataStoreFields.findIndex(
        (item) => item.schemaFieldId === over.id,
      );
      const reorderedFields = arrayMove(dataStoreFields, oldIndex, newIndex);
      // Save will update state via flow update
      saveDataStoreFields(reorderedFields);
    }
  };

  // Import selected schema field
  const handleImportField = useCallback(() => {
    if (!selectedSchemaFieldId) return;

    // Check if already imported
    const alreadyExists = dataStoreFields.some(
      (f) => f.schemaFieldId === selectedSchemaFieldId,
    );
    if (alreadyExists) return;

    const schemaField = schemaFields.find(
      (f) => f.id === selectedSchemaFieldId,
    );
    if (!schemaField) return;

    const newField: DataStoreField = {
      id: new UniqueEntityID().toString(),
      schemaFieldId: selectedSchemaFieldId,
      logic: "", // Initialize with empty string instead of undefined
    };

    const updatedFields = [...dataStoreFields, newField];
    setSelectedFieldId(selectedSchemaFieldId);
    setSelectedSchemaFieldId("");
    // Save will update state via flow update
    saveDataStoreFields(updatedFields);
  }, [
    selectedSchemaFieldId,
    dataStoreFields,
    schemaFields,
    saveDataStoreFields,
  ]);

  // Use ref to track fields for saving without causing re-renders
  const fieldsRef = useRef(dataStoreFields);
  useEffect(() => {
    fieldsRef.current = dataStoreFields;
  }, [dataStoreFields]);

  // Save logic for selected field (called by debounced function)
  const saveLogicForField = useCallback(
    (value: string) => {
      if (selectedFieldId) {
        const updatedFields = dataStoreFields.map((f) =>
          f.schemaFieldId === selectedFieldId
            ? { ...f, logic: value } // Save empty string as-is, don't convert to undefined
            : f,
        );
        // Only update via save, which will trigger state update from flow
        saveDataStoreFields(updatedFields);
        // Reset editing flag after save
        isEditingLogicRef.current = false;
      }
    },
    [selectedFieldId, dataStoreFields, saveDataStoreFields],
  );

  // Handle completed save and clear loading state
  useEffect(() => {
    // When mutation starts, clear the pending save ref
    if (isFieldsPending && pendingSaveRef.current) {
      pendingSaveRef.current = false;
    }

    // When mutation completes, clear editing flags to allow sync
    if (!isFieldsPending) {
      hasRecentlyEditedRef.current = false;
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      // Hide loading if it was showing
      if (showLoading) {
        setShowLoading(false);
      }
    }
  }, [isFieldsPending, showLoading]);

  // Handle field selection with blocking logic
  const handleFieldSelect = useCallback(
    (fieldId: string) => {
      // If trying to switch to the same field, do nothing
      if (fieldId === selectedFieldId) {
        return;
      }

      // If a save is currently in progress, block the switch
      if (isFieldsPending) {
        setShowLoading(true);
        toastInfo("Saving changes before switching field...", {
          duration: 2000,
        });
        return;
      }

      // If we have pending unsaved changes (debounce timer), block switch
      if (pendingSaveRef.current) {
        setShowLoading(true);
        toastInfo("Saving changes before switching field...", {
          duration: 2000,
        });
        return;
      }

      // No pending saves, switch immediately
      setSelectedFieldId(fieldId);
    },
    [selectedFieldId, isFieldsPending],
  );

  // Delete selected field
  const handleDeleteField = useCallback(() => {
    if (!selectedFieldId) return;

    const filtered = dataStoreFields.filter(
      (f) => f.schemaFieldId !== selectedFieldId,
    );
    // Select next field if available
    if (filtered.length > 0) {
      setSelectedFieldId(filtered[0].schemaFieldId);
    } else {
      setSelectedFieldId("");
    }
    // Save will update state via flow update
    saveDataStoreFields(filtered);
  }, [selectedFieldId, dataStoreFields, saveDataStoreFields]);

  // Handle opening data schema setup
  const handleOpenSchema = useCallback(() => {
    openPanel("dataStoreSchema"); // No nodeId - schema is global
  }, [openPanel]);

  // Get Monaco editor functions from flow context
  const { setLastMonacoEditor } = useFlowPanelContext();

  // Editor mount handler
  const handleEditorMount = useCallback(
    (editor: editor.IStandaloneCodeEditor) => {
      editor.onDidFocusEditorWidget(() => {
        const position = editor.getPosition();
        if (position) {
          setLastMonacoEditor(
            nodeId,
            `datastore-${nodeId}-${flowId}`,
            editor,
            position,
          );
        }
      });

      editor.onDidBlurEditorWidget(() => {
        setLastMonacoEditor(null, null, null, null);
      });

      editor.onDidChangeCursorPosition((e) => {
        setLastMonacoEditor(
          nodeId,
          `datastore-${nodeId}-${flowId}`,
          editor,
          e.position,
        );
      });
    },
    [nodeId, flowId, setLastMonacoEditor],
  );

  // Debounced save for logic with pending flag support
  const debouncedSaveLogic = useMemo(
    () =>
      debounce((value: string) => {
        // Set a flag that we have pending changes that will save soon
        pendingSaveRef.current = true;

        // Set flag to prevent syncing for a while after editing
        hasRecentlyEditedRef.current = true;
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(() => {
          hasRecentlyEditedRef.current = false;
        }, 1000); // Wait 1 second after last edit before allowing sync

        // Save logic for current field
        if (selectedFieldId) {
          const updatedFields = fieldsRef.current.map((f) =>
            f.schemaFieldId === selectedFieldId ? { ...f, logic: value } : f,
          );
          fieldsRef.current = updatedFields; // Update ref

          saveDataStoreFields(updatedFields); // Save to database - this will trigger the mutation's isPending state

          // Reset editing flag after save
          isEditingLogicRef.current = false;
        }
      }, 1000), // 1 second debounce like response design panel
    [selectedFieldId, saveDataStoreFields],
  );

  // Get selected field and its schema
  const selectedField = useMemo(
    () => dataStoreFields.find((f) => f.schemaFieldId === selectedFieldId),
    [dataStoreFields, selectedFieldId],
  );

  const selectedFieldSchema = useMemo(
    () => schemaFields.find((f) => f.id === selectedFieldId),
    [schemaFields, selectedFieldId],
  );

  // Get available schema fields (not yet imported)
  const availableSchemaFields = useMemo(
    () =>
      schemaFields.filter(
        (sf) => !dataStoreFields.some((df) => df.schemaFieldId === sf.id),
      ),
    [schemaFields, dataStoreFields],
  );

  // Loading states
  if (dataStoreNodeLoading || schemaLoading) {
    return (
      <div className="bg-surface-raised flex h-full items-center justify-center">
        <div className="text-fg-subtle flex items-center gap-2">
          <span>Loading data store...</span>
        </div>
      </div>
    );
  }

  // Check if there are no schema fields at all
  const hasNoSchema = schemaFields.length === 0;

  // Show "No schema available" page if no schema fields exist
  if (hasNoSchema) {
    return (
      <div className="bg-surface-raised flex h-full">
        <div className="flex flex-1 flex-col items-center justify-center gap-8 p-2">
          <div className="flex flex-col items-center justify-start gap-2">
            <div className="text-fg-muted text-center text-base leading-relaxed font-semibold">
              No schema fields available
            </div>
            <div className="text-background-surface-5 text-center text-xs font-normal">
              Create a data schema to define the fields used in this node.
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={handleOpenSchema}>
            Go to Data schema setup
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-raised flex h-full flex-col">
      {/* Header with description */}
      {/* <div className="self-stretch px-2 py-2.5 bg-surface-raised border-b border-border-default inline-flex flex-col justify-start items-start gap-2.5">
        <div className="self-stretch inline-flex justify-start items-center gap-10">
          <div className="flex-1 justify-start text-fg-subtle text-xs font-normal leading-none">
            This panel uses the schema you defined in the Data Store Schema panel.<br/>
            Each field here is linked to those definitions, allowing you to configure and manage values directly for this node.
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenSchema}
          >
            Data schema setup
          </Button>
        </div>
      </div> */}

      {/* Main content */}
      <div className="bg-surface-raised flex flex-1 gap-2 p-2">
        {/* Left panel - Import and fields list */}
        <div className="flex max-w-64 min-w-36 flex-1 flex-col gap-4">
          {/* Import dropdown section - single row layout */}
          <div className="flex flex-col items-start justify-start gap-2 self-stretch">
            <div className="inline-flex items-center justify-start gap-2 self-stretch">
              <div className="text-fg-muted justify-start text-[10px] leading-none font-medium">
                Select data
              </div>
            </div>
            <div className="inline-flex items-end justify-start gap-2 self-stretch">
              <div className="inline-flex flex-1 flex-col items-start justify-start gap-1">
                <Select
                  value={selectedSchemaFieldId}
                  onValueChange={setSelectedSchemaFieldId}
                >
                  <SelectTrigger className="bg-canvas outline-border-muted text-fg-default h-8 self-stretch rounded-md px-4 py-2 text-xs font-normal outline-1 outline-offset-[-1px]">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSchemaFields.length === 0 ? (
                      <div className="text-fg-subtle px-4 py-2 text-xs">
                        No fields available to import
                      </div>
                    ) : (
                      availableSchemaFields.map((field) => (
                        <SelectItem key={field.id} value={field.id}>
                          {field.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleImportField}
                disabled={!selectedSchemaFieldId}
                size="sm"
                variant="secondary"
              >
                Add
              </Button>
            </div>
          </div>

          {/* Fields list */}
          {dataStoreFields.length > 0 && (
            <ScrollAreaSimple className="flex-1 self-stretch">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis, restrictToParentElement]}
              >
                <SortableContext
                  items={dataStoreFields.map((f) => f.schemaFieldId)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col items-start justify-start gap-2 self-stretch">
                    {dataStoreFields.map((field) => {
                      const schemaField = schemaFields.find(
                        (sf) => sf.id === field.schemaFieldId,
                      );
                      return schemaField ? (
                        <SortableDataField
                          key={field.schemaFieldId}
                          field={field}
                          fieldName={schemaField.name}
                          isSelected={
                            field.schemaFieldId === selectedFieldId &&
                            !showLoading
                          }
                          onClick={() => handleFieldSelect(field.schemaFieldId)}
                        />
                      ) : null;
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </ScrollAreaSimple>
          )}
        </div>

        {/* Divider */}
        <div className="bg-border-dark w-px self-stretch"></div>

        {/* Right panel - Logic editor */}
        <div className="flex min-w-36 flex-1 flex-col gap-4">
          {selectedField && selectedFieldSchema ? (
            <>
              {/* Delete button */}
              <div className="mt-2 mr-1 flex justify-end self-stretch">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleDeleteField}
                        className="relative h-6 w-6 rounded-sm transition-opacity hover:opacity-80"
                      >
                        <Trash2 className="text-fg-subtle size-[24px]" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent variant="button">
                      <p>Delete field</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Logic field */}
              <div className="flex flex-1 flex-col gap-2">
                <div className="inline-flex items-center justify-start gap-1 self-stretch">
                  <div className="text-fg-muted justify-start text-[10px] leading-none font-medium">
                    Logic
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative h-4 w-4 cursor-pointer overflow-hidden transition-opacity hover:opacity-80">
                          <Info
                            className="text-fg-subtle absolute top-[1.33px] left-[1.33px] h-3.5 w-3.5"
                            strokeWidth={2}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <div className="max-w-xs">
                          <p className="mb-1 font-semibold">
                            Data Update Logic
                          </p>
                          <p className="text-xs">
                            Add data update logic using Jinja + JavaScript.
                            Logic will be added next to [data_name= ].
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="bg-canvas outline-border-muted relative flex flex-1 flex-col overflow-hidden rounded-md outline-1 outline-offset-[-1px]">
                  {/* Expand button */}
                  <div className="absolute top-2 right-2 z-10">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className="hover:bg-surface inline-flex items-center justify-start gap-2 rounded p-2 transition-colors"
                            onClick={() => {
                              // TODO: Implement expand functionality
                            }}
                          >
                            <Maximize2 className="text-fg-subtle h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent variant="button">
                          <p>Expand editor</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Editor */}
                  <div className="h-full w-full">
                    <Editor
                      key={`editor-${nodeId}-${selectedFieldId}`}
                      value={localLogic}
                      onChange={(value) => {
                        isEditingLogicRef.current = true;
                        setLocalLogic(value || "");
                        debouncedSaveLogic(value || "");
                      }}
                      language="javascript"
                      onMount={handleEditorMount}
                      containerClassName="h-full"
                      isLoading={showLoading}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 12,
                        lineNumbers: "off",
                        folding: false,
                        renderLineHighlight: "none",
                        scrollbar: {
                          vertical: "auto",
                          horizontal: "hidden",
                        },
                        overviewRulerLanes: 0,
                        hideCursorInOverviewRuler: true,
                        overviewRulerBorder: false,
                        wordWrap: "on",
                        padding: { top: 8, bottom: 16 },
                      }}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <div className="text-fg-subtle mb-2 text-xs">
                  {dataStoreFields.length === 0
                    ? "Import schema fields to get started"
                    : "Select a field to configure its logic"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
