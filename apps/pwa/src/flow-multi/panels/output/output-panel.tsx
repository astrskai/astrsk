import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { debounce } from "lodash-es";
import { toast } from "sonner";
import { SchemaFieldType, SchemaField } from "@/modules/agent/domain/agent";
import { Trash2, Plus, Maximize2, Minimize2, X } from "lucide-react";
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
import { Editor } from "@/shared/ui/editor";
import type { editor } from "monaco-editor";

import { Input } from "@/components-v2/ui/input";
import { Button } from "@/components-v2/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components-v2/ui/select";
import { ScrollAreaSimple } from "@/components-v2/ui/scroll-area-simple";
import { sanitizeFileName } from "@/shared/lib";

// Import queries and mutations
import { agentQueries } from "@/app/queries/agent/query-factory";
import { 
  useUpdateAgentOutput, 
  useUpdateAgentOutputFormat, 
  useUpdateAgentSchemaFields 
} from "@/app/queries/agent/mutations/output-mutations";

// Import context
import { useFlowPanelContext } from "@/flow-multi/components/flow-panel-provider";
import { OutputPanelProps, SchemaFieldItem } from "./output-panel-types";

// Import reusable components
import { SortableSchemaField } from "./sortable-schema-field";
import { OutputFormatSelector } from "./output-format-selector";

export function OutputPanel({ flowId, agentId }: OutputPanelProps) {
  // 1. Get Monaco editor functions from flow context
  const { setLastMonacoEditor } = useFlowPanelContext();

  // 2. Mutations for updating output
  const updateOutput = useUpdateAgentOutput(flowId, agentId || "");
  const updateOutputFormat = useUpdateAgentOutputFormat(flowId, agentId || "");
  const updateSchemaFields = useUpdateAgentSchemaFields(flowId, agentId || "");

  // 3. Query for agent output data
  // Prevent query refetching while mutations are active (like agent-node.tsx pattern)
  const queryEnabled = !!agentId && 
    !updateOutput.isEditing && 
    !updateSchemaFields.isEditing &&
    !updateOutput.isPending &&
    !updateOutputFormat.isPending;
  
  const { 
    data: outputData, 
    isLoading, 
    error 
  } = useQuery({
    ...agentQueries.output(agentId),
    enabled: queryEnabled,
  });


  // 4. Local UI state
  const [isExpanded, setIsExpanded] = useState(false);
  const [localAccordionOpen, setLocalAccordionOpen] = useState(true);
  const [selectedFieldId, setSelectedFieldId] = useState<string>("");
  const [localDescription, setLocalDescription] = useState("");
  const [displayFields, setDisplayFields] = useState<SchemaFieldItem[]>([]);
  
  // Track blocking user from switching during save
  const [showLoading, setShowLoading] = useState(false);
  const pendingSaveRef = useRef<boolean>(false);
  const hasRecentlyEditedRef = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout>();
  const isSchemaFieldsPending = updateSchemaFields.isPending;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const lastInitializedAgentId = useRef<string | null>(null);

  // 5. Parse schema fields from output data
  const parseSchemaFields = useCallback((schemaFields: SchemaField[]): SchemaFieldItem[] => {
    return schemaFields.map((field: SchemaField): SchemaFieldItem => ({
      id: field.name, // Use name as ID for schema fields
      name: field.name,
      description: field.description || "",
      type: field.type,
      required: field.required,
      array: field.array,
      enabled: true,
      minimum: field.minimum,
      maximum: field.maximum,
      pattern: field.pattern,
      enum: field.enum,
    }));
  }, []);

  // 6. Initialize state when agent changes
  useEffect(() => {
    if (agentId && agentId !== lastInitializedAgentId.current && outputData) {
      // Parse schema fields
      const fields = parseSchemaFields(outputData.schemaFields || []);
      setDisplayFields(fields);
      setSelectedFieldId(fields[0]?.id || "");
      
      lastInitializedAgentId.current = agentId;
    }
  }, [agentId, outputData, parseSchemaFields]);

  // 6a. Sync UI state when backend data changes externally (similar to agent-node.tsx)
  // This ensures the toggle switches reflect changes made by AI operations
  useEffect(() => {
    // Don't sync while mutations are active to prevent conflicts
    if (updateOutput.isPending || updateOutputFormat.isPending || updateOutput.isEditing) {
      return;
    }
    
    // The OutputFormatSelector will automatically use the latest outputData values
    // since it reads directly from outputData?.enabledStructuredOutput and outputData?.outputStreaming
    // No additional state sync needed - React will re-render when outputData changes
  }, [outputData?.enabledStructuredOutput, outputData?.outputStreaming, updateOutput.isPending, updateOutputFormat.isPending, updateOutput.isEditing]);

  // 7. Sync display fields when output data changes (for cross-tab sync)
  useEffect(() => {
    // Don't sync while editing, cursor is active, or recently edited to prevent feedback loops
    if (updateOutput.isEditing || updateSchemaFields.isEditing || 
        updateOutput.hasCursor || updateSchemaFields.hasCursor || 
        hasRecentlyEditedRef.current) {
      return;
    }
    
    if (outputData?.schemaFields) {
      const fields = parseSchemaFields(outputData.schemaFields);
      setDisplayFields(fields);
      
      // Keep selected field if it still exists - use callback to get latest selectedFieldId
      setSelectedFieldId(prevSelectedId => {
        if (prevSelectedId && !fields.find(f => f.id === prevSelectedId)) {
          return fields[0]?.id || "";
        }
        return prevSelectedId;
      });
    }
  }, [outputData?.schemaFields, parseSchemaFields, updateOutput.isEditing, updateSchemaFields.isEditing]);

  // 8. Get selected field
  const selectedField = useMemo(() => 
    displayFields.find(f => f.id === selectedFieldId),
    [displayFields, selectedFieldId]
  );

  // 9. Sync local description with selected field
  useEffect(() => {
    if (selectedField) {
      setLocalDescription(selectedField.description || "");
    }
  }, [selectedField?.id, selectedField?.description]);

  // Handle completed save and clear loading state
  useEffect(() => {
    // When mutation starts, clear the pending save ref
    if (isSchemaFieldsPending && pendingSaveRef.current) {
      pendingSaveRef.current = false;
    }
    
    // When mutation completes, clear editing flags to allow sync AND clear pending ref
    if (!isSchemaFieldsPending) {
      hasRecentlyEditedRef.current = false;
      pendingSaveRef.current = false; // Force clear pending ref
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      
      // Hide loading if it was showing
      if (showLoading) {
        setShowLoading(false);
      }
    }
  }, [isSchemaFieldsPending, showLoading]);

  // 10. Save schema fields to database - only recreate when target changes
  const saveSchemaFields = useCallback((fields: SchemaFieldItem[]) => {
    // Convert SchemaFieldItem[] to SchemaField[]
    const schemaFields: SchemaField[] = fields.map(field => ({
      name: field.name,
      description: field.description || undefined,
      type: field.type,
      required: field.required,
      array: field.array,
      minimum: field.minimum,
      maximum: field.maximum,
      pattern: field.pattern,
      enum: field.enum,
    }));
    
    // Update using mutation
    updateSchemaFields.mutate(schemaFields);
  }, [updateSchemaFields]);

  // Use ref to track fields for saving without causing re-renders
  const fieldsRef = useRef(displayFields);
  useEffect(() => {
    fieldsRef.current = displayFields;
  }, [displayFields]);

  // Debounced field update for description changes with stable reference
  const debouncedUpdateFieldDescription = useMemo(() => 
    debounce((fieldId: string, description: string) => {
      // Set flags for blocking and sync prevention
      pendingSaveRef.current = true;
      
      hasRecentlyEditedRef.current = true;
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        hasRecentlyEditedRef.current = false;
      }, 1000);
      
      // Use ref to get current fields without causing re-render
      const updatedFields = fieldsRef.current.map(field => 
        field.id === fieldId ? { ...field, description } : field
      );
      fieldsRef.current = updatedFields; // Update ref
      
      saveSchemaFields(updatedFields); // Save to database - this will trigger the mutation's isPending state
      
      // Don't call setDisplayFields here to avoid re-render/jittering
    }, 300),
    [saveSchemaFields] // saveSchemaFields now has stable reference
  );

  // Handle field selection with blocking logic
  const handleFieldSelect = useCallback((fieldId: string) => {
    if (fieldId === selectedFieldId) return;
    
    // Block if save in progress
    if (isSchemaFieldsPending) {
      setShowLoading(true);
      toast.info("Saving changes before switching field...", { duration: 2000 });
      return;
    }
    
    // Block if pending unsaved changes
    if (pendingSaveRef.current) {
      setShowLoading(true);
      toast.info("Saving changes before switching field...", { duration: 2000 });
      return;
    }
    
    // Switch immediately
    setSelectedFieldId(fieldId);
  }, [selectedFieldId, isSchemaFieldsPending, showLoading]);

  // 11. Field management functions
  const addNewField = useCallback(() => {
    const fieldName = `field_${displayFields.length + 1}`;
    const newField: SchemaFieldItem = {
      id: fieldName, // Use field name as ID to match server behavior
      name: fieldName,
      description: "",
      type: SchemaFieldType.String,
      required: true,
      array: false,
      enabled: true,
    };
    
    const updatedFields = [...displayFields, newField];
    setDisplayFields(updatedFields);
    
    // Use setTimeout to ensure state is updated before selection
    setTimeout(() => {
      setSelectedFieldId(fieldName);
    }, 0);
    
    saveSchemaFields(updatedFields);
  }, [displayFields, saveSchemaFields]);

  const deleteField = useCallback((fieldId: string) => {
    const updatedFields = displayFields.filter(f => f.id !== fieldId);
    setDisplayFields(updatedFields);
    
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(updatedFields[0]?.id || "");
    }
    
    saveSchemaFields(updatedFields);
  }, [displayFields, selectedFieldId, saveSchemaFields]);

  const updateField = useCallback((fieldId: string, updates: Partial<SchemaFieldItem>) => {
    const updatedFields = displayFields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    );
    setDisplayFields(updatedFields);
    saveSchemaFields(updatedFields);
  }, [displayFields, saveSchemaFields]);

  const reorderFields = useCallback((oldIndex: number, newIndex: number) => {
    const reorderedFields = arrayMove(displayFields, oldIndex, newIndex);
    setDisplayFields(reorderedFields);
    saveSchemaFields(reorderedFields);
  }, [displayFields, saveSchemaFields]);

  // 12. DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = displayFields.findIndex((field) => field.id === active.id);
      const newIndex = displayFields.findIndex((field) => field.id === over.id);
      reorderFields(oldIndex, newIndex);
    }
  };

  // 13. Editor mount handler for variable insertion tracking
  const handleDescriptionEditorMount = useCallback((editor: editor.IStandaloneCodeEditor) => {
    editor.onDidFocusEditorWidget(() => {
      // Track editor and cursor position for variable insertion
      const position = editor.getPosition();
      if (position && agentId) {
        setLastMonacoEditor(agentId, `output-${agentId}-${flowId}`, editor, position);
      }
      // Mark cursor as active when editor is focused
      updateOutput.setCursorActive(true);
    });
    
    editor.onDidBlurEditorWidget(() => {
      // Clear editor tracking when focus lost
      setLastMonacoEditor(null, null, null, null);
      // Mark cursor as inactive when editor loses focus
      updateOutput.setCursorActive(false);
    });
    
    // Update position on cursor change
    editor.onDidChangeCursorPosition((e) => {
      if (agentId) {
        setLastMonacoEditor(agentId, `output-${agentId}-${flowId}`, editor, e.position);
      }
    });
  }, [agentId, flowId, setLastMonacoEditor, updateOutput]);

  // 14. Handle structured output toggle change
  const handleStructuredOutputChange = useCallback(async (enabled: boolean) => {
    updateOutput.mutate({
      enabledStructuredOutput: enabled,
    });
  }, [updateOutput]);

  // 15. Handle streaming toggle change
  const handleStreamingChange = useCallback(async (streaming: boolean) => {
    updateOutput.mutate({
      outputStreaming: streaming,
    });
  }, [updateOutput]);

  // 15. Agent key for variable display
  const agentKey = useMemo(() => {
    return sanitizeFileName(outputData?.name || "agentname");
  }, [outputData?.name]);

  // 16. Early returns for loading/error states
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background-surface-2">
        <div className="flex items-center gap-2 text-text-subtle">
          <span>Loading output panel...</span>
        </div>
      </div>
    );
  }

  if (error || !outputData) {
    return (
      <div className="h-full flex items-center justify-center bg-background-surface-2">
        <div className="flex items-center gap-2 text-text-subtle">
          <span>Failed to load output data</span>
        </div>
      </div>
    );
  }

  // 17. Main render
  return (
    <div ref={containerRef} className="h-full flex flex-col bg-background-surface-2">
      {/* Output Format Selector */}
      <OutputFormatSelector
        value={{
          enabledStructuredOutput: outputData?.enabledStructuredOutput ?? false,
          outputStreaming: outputData?.outputStreaming ?? true,
        }}
        onChange={handleStructuredOutputChange}
        onStreamingChange={handleStreamingChange}
        isOpen={localAccordionOpen}
        onOpenChange={setLocalAccordionOpen}
        disabled={false}
        hasError={
          outputData?.enabledStructuredOutput === true && 
          (!outputData?.schemaFields || outputData.schemaFields.length === 0)
        }
        isStandalone={false}
        className="w-full"
      />
      
      <div className="flex-1 overflow-hidden p-2">
        {/* Show text output view when structured output is disabled */}
        {!outputData?.enabledStructuredOutput ? (
          <div className="flex h-full justify-center items-center">
            <div className="inline-flex flex-col justify-center items-center gap-2">
              <div className="text-center font-[600] text-[14px] leading-[20px] text-text-body">
                Agent output is represented by {`{{${agentKey}.response}}`}
              </div>
            </div>
          </div>
        ) : (
          outputData?.enabledStructuredOutput && !selectedField && displayFields.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center">
              <div className="flex flex-col justify-center items-center gap-8">
                <div className="flex flex-col justify-start items-center gap-2">
                  <div className="text-center justify-start text-text-body text-base font-semibold leading-relaxed">No schema field</div>
                  <div className="w-40 text-center justify-start text-background-surface-5 text-xs font-normal">Define the structure of your agent's output</div>
                </div>
                <Button
                  onClick={addNewField}
                  variant="secondary"
                  size="sm"
                >
                  <Plus className="min-w-4 min-h-4" />
                  Create schema field
                </Button>
              </div>
            </div>
          ) : (
            /* Show structured output view */
            <div className="flex gap-2 h-full min-w-0">
              {/* Left panel - Schema fields */}
              <div className="flex flex-col gap-2 flex-1 min-w-[146px] max-w-[256px] overflow-hidden">
                <div className="self-stretch inline-flex justify-start items-start gap-2 flex-wrap content-start mb-2">
                  <button
                    onClick={addNewField}
                    className="h-7 px-3 py-2 bg-background-surface-4 rounded-full shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline-1 outline-offset-[-1px] outline-border-light flex justify-center items-center gap-2 hover:bg-background-surface-5 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-text-body" />
                    <div className="justify-center text-text-primary text-xs font-semibold leading-none">Schema Field(s)</div>
                  </button>
                </div>
                
                {displayFields.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-[#A3A5A8] text-xs">
                      No fields configured. Click "+ Schema Field(s)" to get started.
                    </div>
                  </div>
                ) : (
                  <ScrollAreaSimple className="flex-1">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                    >
                      <SortableContext
                        items={displayFields.map(field => field.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="flex flex-col gap-2 pr-2">
                          {displayFields.map((field) => (
                            <SortableSchemaField
                              key={field.id}
                              agentKey={agentKey}
                              field={field}
                              isSelected={field.id === selectedFieldId && !showLoading}
                              onClick={() => handleFieldSelect(field.id)}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </ScrollAreaSimple>
                )}
              </div>
              
              {/* Divider */}
              <div className="w-px self-stretch bg-border-dark"></div>
              
              {/* Right panel - Field details */}
              <div className="flex-1 min-w-0 overflow-hidden">
                {selectedField ? (
                  <div className="w-full h-full flex flex-col justify-start items-start gap-4 min-w-0 relative p-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => deleteField(selectedField.id)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-sm hover:opacity-80 transition-opacity z-10"
                        >
                          <Trash2 className="min-w-3.5 min-h-4 text-text-subtle" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent variant="button">
                        <p>Delete</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    {/* Name and Data type fields */}
                    <div className="self-stretch inline-flex justify-start items-start gap-2 mt-8">
                      <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
                        <div className="self-stretch inline-flex justify-start items-center gap-2">
                          <div className="justify-start text-text-body text-[10px] font-medium leading-none">Name</div>
                        </div>
                        <div className="self-stretch flex flex-col justify-start items-start gap-1">
                          <Input
                            value={selectedField.name}
                            onChange={(e) => updateField(selectedField.id, { name: e.target.value })}
                            onFocus={() => updateOutput.setCursorActive(true)}
                            onBlur={() => updateOutput.setCursorActive(false)}
                            className="self-stretch h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-primary text-xs font-normal"
                            placeholder="variable_name"
                          />
                        </div>
                      </div>
                      
                      <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
                        <div className="self-stretch inline-flex justify-start items-center gap-2">
                          <div className="justify-start text-text-body text-[10px] font-medium leading-none">Data type</div>
                        </div>
                        <div className="self-stretch flex flex-col justify-start items-start gap-1">
                          <Select 
                            value={selectedField.array ? `${selectedField.type}_array` : selectedField.type} 
                            onValueChange={(value) => {
                              const isArray = value.endsWith('_array');
                              const baseType = value.replace('_array', '') as SchemaFieldType;
                              updateField(selectedField.id, { 
                                type: baseType,
                                array: isArray,
                                required: true 
                              });
                            }}
                          >
                            <SelectTrigger className="self-stretch h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-primary text-xs font-normal">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="string">String</SelectItem>
                              <SelectItem value="string_array">String (Array)</SelectItem>
                              <SelectItem value="integer">Integer</SelectItem>
                              <SelectItem value="integer_array">Integer (Array)</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="number_array">Number (Array)</SelectItem>
                              <SelectItem value="boolean">Boolean</SelectItem>
                              <SelectItem value="boolean_array">Boolean (Array)</SelectItem>
                              <SelectItem value="enum">Enum</SelectItem>
                              <SelectItem value="enum_array">Enum (Array)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    
                    {/* Min/Max fields for Integer and Number types */}
                    {(selectedField.type === SchemaFieldType.Integer || selectedField.type === SchemaFieldType.Number) && (
                      <div className="self-stretch inline-flex justify-start items-start gap-2">
                        <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
                          <div className="self-stretch inline-flex justify-start items-center gap-2">
                            <div className="justify-start text-text-body text-[10px] font-medium leading-none">Minimum</div>
                          </div>
                          <div className="self-stretch flex flex-col justify-start items-start gap-1">
                            <Input
                              type="number"
                              value={selectedField.minimum || ""}
                              onChange={(e) => updateField(selectedField.id, { minimum: e.target.value ? Number(e.target.value) : undefined })}
                              onFocus={() => updateOutput.setCursorActive(true)}
                              onBlur={() => updateOutput.setCursorActive(false)}
                              className="self-stretch h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-primary text-xs font-normal"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
                          <div className="self-stretch inline-flex justify-start items-center gap-2">
                            <div className="justify-start text-text-body text-[10px] font-medium leading-none">Maximum</div>
                          </div>
                          <div className="self-stretch flex flex-col justify-start items-start gap-1">
                            <Input
                              type="number"
                              value={selectedField.maximum || ""}
                              onChange={(e) => updateField(selectedField.id, { maximum: e.target.value ? Number(e.target.value) : undefined })}
                              onFocus={() => updateOutput.setCursorActive(true)}
                              onBlur={() => updateOutput.setCursorActive(false)}
                              className="self-stretch h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-primary text-xs font-normal"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Enum options for Enum types */}
                    {selectedField.type === SchemaFieldType.Enum && (
                      <div className="self-stretch flex flex-col justify-start items-start gap-2">
                        <div className="self-stretch pr-7 flex flex-col justify-start items-start gap-2">
                          <button
                            onClick={() => {
                              const currentEnum = selectedField.enum || [];
                              updateField(selectedField.id, { 
                                enum: [...currentEnum, ''] 
                              });
                            }}
                            className="self-stretch h-7 px-3 py-2 bg-background-surface-0 rounded-full shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline-1 outline-offset-[-1px] outline-border-light inline-flex justify-center items-center gap-2 hover:bg-background-surface-1 transition-colors"
                          >
                            <Plus className="w-4 h-4 text-text-body" />
                            <div className="justify-center text-text-primary text-xs font-semibold leading-none">Enum</div>
                          </button>
                        </div>
                        <div className="self-stretch flex flex-col justify-start items-start gap-1">
                          {(selectedField.enum || []).map((option, index) => (
                            <div key={index} className="self-stretch inline-flex justify-start items-center gap-2">
                              <Input
                                value={option}
                                onChange={(e) => {
                                  const newEnum = [...(selectedField.enum || [])];
                                  newEnum[index] = e.target.value;
                                  updateField(selectedField.id, { enum: newEnum });
                                }}
                                onFocus={() => updateOutput.setCursorActive(true)}
                                onBlur={(e) => {
                                  updateOutput.setCursorActive(false);
                                  const trimmedValue = e.target.value.trim();
                                  if (trimmedValue !== e.target.value) {
                                    const newEnum = [...(selectedField.enum || [])];
                                    newEnum[index] = trimmedValue;
                                    updateField(selectedField.id, { enum: newEnum });
                                  }
                                }}
                                className="flex-1 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-primary text-xs font-normal"
                                placeholder="Option value"
                              />
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => {
                                      const newEnum = (selectedField.enum || []).filter((_, i) => i !== index);
                                      updateField(selectedField.id, { enum: newEnum });
                                    }}
                                    className="w-6 h-6 relative rounded-sm flex-shrink-0"
                                  >
                                    <X className="w-3.5 h-4 absolute left-[5px] top-[4px] text-text-subtle" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent variant="button">
                                  <p>Delete</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Description field */}
                    <div className="self-stretch flex-1 flex flex-col justify-start items-start gap-2 min-w-0 overflow-hidden">
                      <div className="self-stretch justify-start text-text-body text-[10px] font-medium leading-none">Description</div>
                      <div className="self-stretch flex-1 flex flex-col justify-start items-start gap-1 min-w-0 overflow-hidden">
                        <div className="self-stretch flex-1 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal flex flex-col justify-start items-start overflow-hidden relative min-w-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="absolute top-2 right-2 z-10 w-6 h-6 rounded-sm hover:bg-background-surface-1 flex items-center justify-center transition-colors"
                              >
                                {isExpanded ? <Minimize2 className="w-4 h-4 text-text-subtle" /> : <Maximize2 className="w-4 h-4 text-text-subtle" />}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent variant="button">
                              <p>{isExpanded ? "Collapse" : "Expand"}</p>
                            </TooltipContent>
                          </Tooltip>
                          <div className="w-full h-full">
                            <Editor
                              key={selectedField.id} // Force new editor instance for each field
                              value={localDescription}
                              onChange={(value) => {
                                const newValue = value || "";
                                setLocalDescription(newValue);
                                debouncedUpdateFieldDescription(selectedField.id, newValue);
                              }}
                              language="markdown"
                              onMount={handleDescriptionEditorMount}
                              containerClassName="h-full"
                              isLoading={showLoading}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-[#A3A5A8] text-xs">
                      Select a field to configure its properties
                    </div>
                  </div>
                )}
              </div>
              
              {/* Expanded Editor View */}
              {isExpanded && selectedField && (
                <div className="absolute inset-0 z-20 bg-background-surface-2 p-4">
                  <div className="w-full h-full bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal flex flex-col justify-start items-start overflow-hidden relative">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setIsExpanded(false)}
                          className="absolute top-2 right-2 z-10 w-6 h-6 rounded-sm hover:bg-background-surface-1 flex items-center justify-center transition-colors"
                        >
                          <Minimize2 className="w-4 h-4 text-text-subtle" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent variant="button">
                        <p>Collapse</p>
                      </TooltipContent>
                    </Tooltip>
                    <div className="w-full h-full">
                      <Editor
                        key={selectedField.id} // Force new editor instance for each field
                        value={localDescription}
                        onChange={(value) => {
                          const newValue = value || "";
                          setLocalDescription(newValue);
                          debouncedUpdateFieldDescription(selectedField.id, newValue);
                        }}
                        language="markdown"
                        onMount={handleDescriptionEditorMount}
                        containerClassName="h-full"
                        isLoading={showLoading}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}