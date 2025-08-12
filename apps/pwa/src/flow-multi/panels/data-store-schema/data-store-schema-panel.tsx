import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Trash2, Plus, Database, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components-v2/ui/tooltip";
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
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { debounce } from "lodash-es";

import { Input } from "@/components-v2/ui/input";
import { Button } from "@/components-v2/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components-v2/ui/select";
import { ScrollAreaSimple } from "@/components-v2/ui/scroll-area-simple";

// Import from flow panel architecture
import { 
  useFlowPanel, 
  FlowPanelLoading, 
  FlowPanelError 
} from "@/flow-multi/hooks/use-flow-panel";
import { useFlowPanelContext } from "@/flow-multi/components/flow-panel-provider";
import { DataStoreSchemaProps, DataStoreSchemaField, DataStoreSchema, DataStoreFieldType } from "./data-store-schema-types";
import { SortableField } from "./sortable-field";
import { UniqueEntityID } from "@/shared/domain";
import { sanitizeFileName } from "@/shared/utils/file-utils";
import { ReadyState } from "@/modules/flow/domain";

export function DataStoreSchemaPanel({ flowId }: DataStoreSchemaProps) {
  // 1. Use flow panel hook for flow data
  const { 
    flow,
    isLoading,
    saveFlow,
  } = useFlowPanel({ flowId });

  // Get flow panel context for opening panels and adding nodes
  const { openPanel, addDataStoreNode } = useFlowPanelContext();

  // 2. Local state for fields
  const [fields, setFields] = useState<DataStoreSchemaField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>("");
  const [localInitialValue, setLocalInitialValue] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Use ref to hold current flow for debounced save
  const flowRef = useRef(flow);
  const saveFlowRef = useRef(saveFlow);
  
  // Update refs when flow or saveFlow changes
  useEffect(() => {
    flowRef.current = flow;
    saveFlowRef.current = saveFlow;
  }, [flow, saveFlow]);

  // 3. Get selected field
  const selectedField = useMemo(() => 
    fields.find(f => f.id === selectedFieldId),
    [fields, selectedFieldId]
  );

  // Track if this is the initial load
  const isFirstLoadRef = useRef(true);
  
  // 4. Initialize fields from flow's dataStoreSchema
  // Only update if we don't have unsaved changes to prevent overwriting user edits
  useEffect(() => {
    if (flow && !isLoading && !hasUnsavedChanges) {
      const schema = flow.props.dataStoreSchema;
      if (schema?.fields && schema.fields.length > 0) {
        setFields(schema.fields);
        
        // Only set selection on first load or if current selection doesn't exist
        setSelectedFieldId(prevSelectedId => {
          // If this is the first load or no previous selection, select first field
          if (isFirstLoadRef.current || !prevSelectedId) {
            isFirstLoadRef.current = false;
            return schema.fields[0]?.id || "";
          }
          
          // Check if the previously selected field still exists
          const fieldStillExists = schema.fields.some(f => f.id === prevSelectedId);
          if (fieldStillExists) {
            return prevSelectedId; // Keep current selection
          } else {
            return schema.fields[0]?.id || ""; // Field was deleted, select first
          }
        });
      } else {
        setFields([]);
        setSelectedFieldId("");
        isFirstLoadRef.current = true; // Reset for next time
      }
    }
  }, [flow?.props.dataStoreSchema, isLoading, hasUnsavedChanges]); // Re-initialize when schema changes or loading completes

  // 5. Sync local fields with selected field
  useEffect(() => {
    if (selectedField) {
      setLocalInitialValue(selectedField.initialValue || "");
    }
  }, [selectedField?.id, selectedField?.initialValue]);

  // 6. Debounced save for fields to flow's dataStoreSchema
  // Using useCallback with empty deps and refs to avoid recreation
  const debouncedSaveFields = useMemo(
    () => debounce(async (updatedFields: DataStoreSchemaField[]) => {
      const currentFlow = flowRef.current;
      const currentSaveFlow = saveFlowRef.current;
      
      if (!currentFlow || !currentSaveFlow) {
        console.error('[DATA_STORE_SCHEMA] Cannot save - flow or saveFlow is null');
        return;
      }
      
      // Update flow's dataStoreSchema
      const updatedSchema: DataStoreSchema = {
        fields: updatedFields
      };
      
      const updateResult = currentFlow.update({ dataStoreSchema: updatedSchema });
      if (updateResult.isSuccess) {
        let flowToSave = updateResult.getValue();
        
        // Set flow to Draft state if it was Ready
        if (flowToSave.props.readyState === ReadyState.Ready) {
          const stateUpdateResult = flowToSave.setReadyState(ReadyState.Draft);
          if (stateUpdateResult.isSuccess) {
            flowToSave = stateUpdateResult.getValue();
          }
        }
        
        await currentSaveFlow(flowToSave);
        // Clear unsaved changes after successful save
        setHasUnsavedChanges(false);
      } else {
        console.error("[DATA_STORE_SCHEMA] Failed to update flow:", updateResult.getError());
      }
    }, 300),
    [] // Empty deps to create debounce only once
  );
  
  // Clean up debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedSaveFields.cancel();
    };
  }, [debouncedSaveFields]);

  // 7. DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 8. Handle drag end for reordering (disabled - no reordering in schema panel)
  const handleDragEnd = (event: DragEndEvent) => {
    // Drag functionality disabled for schema panel
    return;
  };

  // 9. Field management functions
  const addNewField = useCallback(() => {
    const newId = new UniqueEntityID().toString();
    const newField: DataStoreSchemaField = {
      id: newId,
      name: `field_${fields.length + 1}`,
      type: 'string',
      initialValue: ""  // Will be set to 'false' if type changes to boolean
    };
    
    const updatedFields = [...fields, newField];
    setFields(updatedFields);
    setSelectedFieldId(newId);
    setHasUnsavedChanges(true); // Mark as having unsaved changes
    debouncedSaveFields(updatedFields);
  }, [fields, debouncedSaveFields]);

  const deleteField = useCallback((fieldId: string) => {
    const updatedFields = fields.filter(f => f.id !== fieldId);
    setFields(updatedFields);
    
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(updatedFields[0]?.id || "");
    }
    
    setHasUnsavedChanges(true); // Mark as having unsaved changes
    debouncedSaveFields(updatedFields);
  }, [fields, selectedFieldId, debouncedSaveFields]);


  const updateField = useCallback((fieldId: string, updates: Partial<DataStoreSchemaField>) => {
    // Sanitize field name if it's being updated  
    if (updates.name) {
      updates.name = sanitizeFileName(updates.name);
    }
    
    const updatedFields = fields.map(field => {
      if (field.id === fieldId) {
        const updatedField = { ...field, ...updates };
        // Clear initial value when type changes
        if (updates.type && updates.type !== field.type) {
          // Set appropriate default based on new type
          if (updates.type === 'boolean') {
            updatedField.initialValue = 'false';
          } else {
            updatedField.initialValue = '';
          }
        }
        return updatedField;
      }
      return field;
    });
    setFields(updatedFields);
    // Update local state if this is the selected field (only for non-boolean types)
    if (fieldId === selectedFieldId && updates.type && updates.type !== 'boolean') {
      const field = updatedFields.find(f => f.id === fieldId);
      if (field) {
        setLocalInitialValue(field.initialValue);
      }
    }
    setHasUnsavedChanges(true); // Mark as having unsaved changes
    debouncedSaveFields(updatedFields);
  }, [fields, selectedFieldId, debouncedSaveFields]);


  // 10. Early returns for loading/error states
  if (isLoading) {
    return <FlowPanelLoading message="Loading data store schema..." />;
  }

  if (!flow) {
    return <FlowPanelError message="Flow not found" />;
  }

  // 11. Main render
  return (
    <div className="h-full flex flex-col bg-background-surface-2">
      {/* Header with description */}
      <div className="px-2 py-2.5 bg-background-surface-2 border-b border-border-dark flex flex-col justify-start items-start gap-2.5">
        <div className="self-stretch inline-flex justify-start items-center gap-10">
          <div className="flex-1 justify-start text-text-subtle text-xs font-normal">
            Create data fields to build nodes that can be linked into your flow and control session state dynamically.
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={addDataStoreNode}
          >
            <Plus />
            Data store node
          </Button>
        </div>
      </div>

      {/* Main content */}
      {fields.length === 0 ? (
        // Empty state
        <div className="self-stretch flex-1 p-2 bg-background-surface-2 inline-flex justify-start items-start gap-2">
          <div className="flex-1 self-stretch min-w-36 inline-flex flex-col justify-start items-start gap-4">
            <div className="self-stretch flex-1 flex flex-col justify-center items-center gap-8">
              <div className="flex flex-col justify-start items-center gap-2">
                <div className="text-center justify-start text-text-body text-base font-semibold leading-relaxed">No schema fields yet</div>
                <div className="w-40 text-center justify-start text-background-surface-5 text-xs font-normal">Start by creating fields for your data store schema.</div>
              </div>
              <button 
                onClick={addNewField}
                className="h-7 px-3 py-2 bg-background-surface-4 rounded-full shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-border-light inline-flex justify-center items-center gap-2 hover:bg-background-surface-5 transition-colors"
              >
                <Plus className="w-4 h-4 text-text-body" />
                <div className="justify-center text-text-primary text-xs font-semibold leading-none">Create schema field</div>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 p-2 bg-background-surface-2 inline-flex justify-start items-start gap-2">
          {/* Left panel - Schema fields */}
          <div className="flex-1 max-w-64 min-w-36 inline-flex flex-col justify-start items-start gap-4">
            <button
              onClick={addNewField}
              className="h-7 px-3 py-2 bg-background-surface-4 rounded-full shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline-1 outline-offset-[-1px] outline-border-light inline-flex justify-center items-center gap-2 hover:bg-background-surface-5 transition-colors"
            >
              <Plus className="w-4 h-4 text-text-body" />
              <div className="justify-center text-text-primary text-xs font-semibold leading-none">Schema Field(s)</div>
            </button>

            <ScrollAreaSimple className="self-stretch flex-1">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis, restrictToParentElement]}
              >
                <SortableContext
                  items={fields.map(field => field.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="self-stretch flex flex-col justify-start items-start gap-2">
                    {fields.map((field) => (
                      <SortableField
                        key={field.id}
                        field={field}
                        isSelected={field.id === selectedFieldId}
                        onClick={() => setSelectedFieldId(field.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </ScrollAreaSimple>
          </div>

          {/* Divider */}
          <div className="w-px self-stretch bg-border-dark"></div>

          {/* Right panel - Field details */}
          <div className="flex-1 h-80 min-w-36 inline-flex flex-col justify-start items-end gap-4">
          {selectedField ? (
            <>
              {/* Delete button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => deleteField(selectedField.id)}
                      className="w-6 h-6 relative rounded-sm hover:opacity-80 transition-opacity"
                    >
                      <Trash2 className="min-w-3.5 min-h-4 absolute left-[5px] top-[4px] text-text-subtle" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent variant="button">
                    <p>Delete field</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Name and Data type fields */}
              <div className="self-stretch inline-flex justify-start items-start gap-2">
                <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
                  <div className="self-stretch inline-flex justify-start items-center gap-2">
                    <div className="justify-start text-text-body text-[10px] font-medium leading-none">Name</div>
                  </div>
                  <div className="self-stretch flex flex-col justify-start items-start gap-1">
                    <Input
                      value={selectedField.name}
                      onChange={(e) => updateField(selectedField.id, { name: e.target.value })}
                      className="self-stretch h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-primary text-xs font-normal"
                      placeholder="field_name"
                    />
                  </div>
                </div>
                
                <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
                  <div className="self-stretch inline-flex justify-start items-center gap-2">
                    <div className="justify-start text-text-body text-[10px] font-medium leading-none">Data type</div>
                  </div>
                  <div className="self-stretch flex flex-col justify-start items-start gap-1">
                    <Select 
                      value={selectedField.type} 
                      onValueChange={(value) => {
                        updateField(selectedField.id, { 
                          type: value as DataStoreFieldType
                        });
                      }}
                    >
                      <SelectTrigger className="self-stretch h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-primary text-xs font-normal">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">String</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="integer">Integer</SelectItem>
                        <SelectItem value="boolean">Boolean</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Initial Value field */}
              {selectedField.type === 'boolean' ? (
                <div className="self-stretch flex flex-col justify-start items-start gap-1">
                  <div className="self-stretch inline-flex justify-start items-start gap-2">
                    <div className="justify-start text-text-body text-[10px] font-medium leading-none">Initial state</div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-text-info" />
                        </TooltipTrigger>
                        <TooltipContent variant="button">
                          <p>Set the default boolean value</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="self-stretch flex flex-col justify-start items-start gap-1">
                    <button
                      onClick={() => {
                        setLocalInitialValue('true');
                        updateField(selectedField.id, { initialValue: 'true' });
                      }}
                      className="self-stretch inline-flex justify-start items-center gap-2 cursor-pointer"
                    >
                      <div className="w-3 h-3 p-0.5 bg-background-surface-5 rounded-md flex justify-center items-center gap-2">
                        {localInitialValue === 'true' && (
                          <div className="w-1.5 h-1.5 bg-text-primary rounded-full"></div>
                        )}
                      </div>
                      <div className="justify-start text-text-primary text-[10px] font-medium leading-none">True</div>
                    </button>
                    <button
                      onClick={() => {
                        setLocalInitialValue('false');
                        updateField(selectedField.id, { initialValue: 'false' });
                      }}
                      className="self-stretch inline-flex justify-start items-center gap-2 cursor-pointer"
                    >
                      <div className="w-3 h-3 p-0.5 bg-background-surface-5 rounded-md flex justify-center items-center gap-2">
                        {localInitialValue === 'false' && (
                          <div className="w-1.5 h-1.5 bg-text-primary rounded-full"></div>
                        )}
                      </div>
                      <div className="justify-start text-text-primary text-[10px] font-medium leading-none">False</div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="self-stretch inline-flex flex-col justify-start items-start gap-2">
                  <div className="self-stretch inline-flex justify-start items-center gap-2">
                    <div className="justify-start text-text-body text-[10px] font-medium leading-none">Initial value</div>
                  </div>
                  <div className="self-stretch flex flex-col justify-start items-start gap-1">
                    <Input
                      value={localInitialValue}
                      onChange={(e) => {
                        setLocalInitialValue(e.target.value);
                        updateField(selectedField.id, { initialValue: e.target.value });
                      }}
                      className="self-stretch h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-primary text-xs font-normal"
                      placeholder={
                        selectedField.type === 'string' ? "Enter text value" :
                        selectedField.type === 'number' ? "0" :
                        selectedField.type === 'integer' ? "0" :
                        selectedField.type === 'boolean' ? "true" :
                        "Enter initial value"
                      }
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-text-subtle text-xs mb-2">No field selected</div>
                <div className="text-text-subtle text-xs">
                  {fields.length === 0 
                    ? "Click 'Schema Field(s)' to add a new field" 
                    : "Select a field to configure its properties"}
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
}