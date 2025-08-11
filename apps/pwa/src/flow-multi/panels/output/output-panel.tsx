import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { SchemaFieldType, OutputFormat, SchemaField } from "@/modules/agent/domain/agent";
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
import { Editor } from "@/components-v2/editor";
import type { editor } from "monaco-editor";
import { debounce } from "lodash-es";

import { Input } from "@/components-v2/ui/input";
import { Button } from "@/components-v2/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components-v2/ui/select";
import { ScrollAreaSimple } from "@/components-v2/ui/scroll-area-simple";
import { sanitizeFileName } from "@/shared/utils";

// Import from new compact architecture
import { 
  useFlowPanel, 
  FlowPanelLoading, 
  FlowPanelError 
} from "@/flow-multi/hooks/use-flow-panel";
import { useFlowPanelContext } from "@/flow-multi/components/flow-panel-provider";
import { OutputPanelProps, SchemaFieldItem } from "./output-panel-types";

// Import reusable components from original
import { SortableSchemaField } from "./sortable-schema-field";
import { OutputFormatSelector } from "./output-format-selector";

export function OutputPanel({ flowId, agentId }: OutputPanelProps) {
  // 1. Use the new flow panel hook
  const { 
    agent, 
    isLoading, 
    updateAgent,
    lastInitializedAgentId 
  } = useFlowPanel({ flowId, agentId });

  // 2. Get Monaco editor functions from flow context
  const { setLastMonacoEditor } = useFlowPanelContext();

  // 3. Local UI state
  const [isExpanded, setIsExpanded] = useState(false);
  const [localAccordionOpen, setLocalAccordionOpen] = useState(true);
  const [selectedFieldId, setSelectedFieldId] = useState<string>("");
  const [localDescription, setLocalDescription] = useState("");
  const [displayFields, setDisplayFields] = useState<SchemaFieldItem[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // 4. Parse schema fields from agent
  const parseAgentSchemaFields = useCallback((agent: any): SchemaFieldItem[] => {
    if (!agent?.props?.schemaFields) return [];
    
    return agent.props.schemaFields.map((field: SchemaField): SchemaFieldItem => ({
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

  // 5. Initialize state when agent changes
  useEffect(() => {
    if (agentId && agentId !== lastInitializedAgentId.current && agent) {
      // Parse schema fields
      const fields = parseAgentSchemaFields(agent);
      setDisplayFields(fields);
      setSelectedFieldId(fields[0]?.id || "");
      
      lastInitializedAgentId.current = agentId;
    }
  }, [agentId, agent, parseAgentSchemaFields]);

  // 6. Get selected field
  const selectedField = useMemo(() => 
    displayFields.find(f => f.id === selectedFieldId),
    [displayFields, selectedFieldId]
  );

  // 7. Sync local description with selected field
  useEffect(() => {
    if (selectedField) {
      setLocalDescription(selectedField.description || "");
    }
  }, [selectedField?.id]);

  // 8. Debounced save for schema fields
  const debouncedSaveSchema = useMemo(
    () => debounce(async (fields: SchemaFieldItem[]) => {
      if (!agent || !agentId) return;
      
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
      
      await updateAgent(agentId, { 
        schemaFields,
        enabledStructuredOutput: schemaFields.length > 0
      });
    }, 300),
    [agent, agentId, updateAgent]
  );

  // 9. Field management functions
  const addNewField = useCallback(() => {
    const newId = `field-${Date.now()}`;
    const newField: SchemaFieldItem = {
      id: newId,
      name: `field_${displayFields.length + 1}`,
      description: "",
      type: SchemaFieldType.String,
      required: true,
      array: false,
      enabled: true,
    };
    
    const updatedFields = [...displayFields, newField];
    setDisplayFields(updatedFields);
    setSelectedFieldId(newId);
    debouncedSaveSchema(updatedFields);
  }, [displayFields, debouncedSaveSchema]);

  const deleteField = useCallback((fieldId: string) => {
    const updatedFields = displayFields.filter(f => f.id !== fieldId);
    setDisplayFields(updatedFields);
    
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(updatedFields[0]?.id || "");
    }
    
    debouncedSaveSchema(updatedFields);
  }, [displayFields, selectedFieldId, debouncedSaveSchema]);

  const updateField = useCallback((fieldId: string, updates: Partial<SchemaFieldItem>) => {
    const updatedFields = displayFields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    );
    setDisplayFields(updatedFields);
    debouncedSaveSchema(updatedFields);
  }, [displayFields, debouncedSaveSchema]);

  const reorderFields = useCallback((oldIndex: number, newIndex: number) => {
    const reorderedFields = arrayMove(displayFields, oldIndex, newIndex);
    setDisplayFields(reorderedFields);
    debouncedSaveSchema(reorderedFields);
  }, [displayFields, debouncedSaveSchema]);

  // 10. DnD sensors
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

  // 11. Editor mount handler for variable insertion tracking
  const handleDescriptionEditorMount = useCallback((editor: editor.IStandaloneCodeEditor) => {
    editor.onDidFocusEditorWidget(() => {
      // Track editor and cursor position for variable insertion
      const position = editor.getPosition();
      if (position && agentId) {
        setLastMonacoEditor(agentId, `output-${agentId}-${flowId}`, editor, position);
      }
    });
    
    editor.onDidBlurEditorWidget(() => {
      // Clear editor tracking when focus lost
      setLastMonacoEditor(null, null, null, null);
    });
    
    // Update position on cursor change
    editor.onDidChangeCursorPosition((e) => {
      if (agentId) {
        setLastMonacoEditor(agentId, `output-${agentId}-${flowId}`, editor, e.position);
      }
    });
  }, [agentId, flowId, setLastMonacoEditor]);

  // 12. Handle output format change
  const handleOutputFormatChange = useCallback(async (value: {
    outputFormat: OutputFormat;
    outputStreaming: boolean;
  }) => {
    if (!agent || !agentId) return;
    
    await updateAgent(agentId, value);
  }, [agent, agentId, updateAgent]);

  // 13. Agent key for variable display
  const agentKey = useMemo(() => {
    return sanitizeFileName(agent?.props.name || "agentname");
  }, [agent?.props.name]);

  // 14. Early returns for loading/error states
  if (isLoading) {
    return <FlowPanelLoading message="Loading output panel..." />;
  }

  if (!agent) {
    return <FlowPanelError message="Agent not found" />;
  }

  // 15. Main render
  return (
    <div ref={containerRef} className="h-full flex flex-col bg-background-surface-2">
      {/* Output Format Selector */}
      <OutputFormatSelector
        value={{
          outputFormat: agent.props.outputFormat ?? OutputFormat.StructuredOutput,
          outputStreaming: agent.props.outputStreaming ?? true,
        }}
        onChange={handleOutputFormatChange}
        isOpen={localAccordionOpen}
        onOpenChange={setLocalAccordionOpen}
        disabled={false}
        hasError={
          agent.props.enabledStructuredOutput === true && 
          (agent.props.outputFormat || OutputFormat.StructuredOutput) === OutputFormat.StructuredOutput &&
          (!agent.props.schemaFields || agent.props.schemaFields.length === 0)
        }
        isStandalone={false}
        className="w-full"
      />
      
      <div className="flex-1 overflow-hidden p-2">
        {/* Show text output view when text format is selected */}
        {(agent.props.outputFormat || OutputFormat.StructuredOutput) === OutputFormat.TextOutput ? (
          <div className="flex h-full justify-center items-center">
            <div className="inline-flex flex-col justify-center items-center gap-2">
              <div className="text-center font-[600] text-[14px] leading-[20px] text-text-body">
                Agent output is represented by {`{{${agentKey}.response}}`}
              </div>
            </div>
          </div>
        ) : (
          (agent.props.outputFormat || OutputFormat.StructuredOutput) === OutputFormat.StructuredOutput && !selectedField && displayFields.length === 0 ? (
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
                              isSelected={field.id === selectedFieldId}
                              onClick={() => setSelectedFieldId(field.id)}
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
                                onBlur={(e) => {
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
                                updateField(selectedField.id, { description: newValue });
                              }}
                              language="markdown"
                              onMount={handleDescriptionEditorMount}
                              containerClassName="h-full"
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
                          updateField(selectedField.id, { description: newValue });
                        }}
                        language="markdown"
                        onMount={handleDescriptionEditorMount}
                        containerClassName="h-full"
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