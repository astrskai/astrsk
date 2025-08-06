import { useState, useEffect, useCallback, useMemo } from "react";
import { Trash2, Plus, GripVertical, Maximize2, Database } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components-v2/ui/tooltip";
import { Editor } from "@/components-v2/editor";
import type { editor } from "monaco-editor";
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
import { DataStoreSchemaProps, SchemaField } from "./data-store-schema-types";

// Drag handle icon component
const DragHandle = () => (
  <div className="w-6 h-6 relative">
    <div className="w-0.5 h-[2.40px] left-[11.40px] top-[6px] absolute origin-top-left rotate-90 bg-text-info rounded-full"></div>
    <div className="w-0.5 h-[2.40px] left-[15.80px] top-[6px] absolute origin-top-left rotate-90 bg-text-info rounded-full"></div>
    <div className="w-0.5 h-[2.40px] left-[11.40px] top-[10.40px] absolute origin-top-left rotate-90 bg-text-info rounded-full"></div>
    <div className="w-0.5 h-[2.40px] left-[15.80px] top-[10.40px] absolute origin-top-left rotate-90 bg-text-info rounded-full"></div>
    <div className="w-0.5 h-[2.40px] left-[11.40px] top-[14.80px] absolute origin-top-left rotate-90 bg-text-info rounded-full"></div>
    <div className="w-0.5 h-[2.40px] left-[15.80px] top-[14.80px] absolute origin-top-left rotate-90 bg-text-info rounded-full"></div>
  </div>
);

export function DataStoreSchemaPanel({ flowId, nodeId }: DataStoreSchemaProps) {
  // 1. Use flow panel hook for node data
  const { 
    isLoading,
    lastInitializedAgentId 
  } = useFlowPanel({ flowId });

  // 2. Get Monaco editor functions from flow context
  const { setLastMonacoEditor } = useFlowPanelContext();

  // 3. Local state for fields
  const [fields, setFields] = useState<SchemaField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>("");
  const [localDescription, setLocalDescription] = useState("");

  // 4. Get selected field
  const selectedField = useMemo(() => 
    fields.find(f => f.id === selectedFieldId),
    [fields, selectedFieldId]
  );

  // 5. Sync local description with selected field
  useEffect(() => {
    if (selectedField) {
      setLocalDescription(selectedField.description || "");
    }
  }, [selectedField?.id, selectedField?.description]);

  // 6. Debounced save for fields
  const debouncedSaveFields = useMemo(
    () => debounce(async (updatedFields: SchemaField[]) => {
      // TODO: Save fields to node data
      console.log("Saving fields:", updatedFields);
    }, 300),
    []
  );

  // 7. Field management functions
  const addNewField = useCallback(() => {
    const newId = `field-${Date.now()}`;
    const newField: SchemaField = {
      id: newId,
      name: `field_${fields.length + 1}`,
      type: 'string',
      description: "",
    };
    
    const updatedFields = [...fields, newField];
    setFields(updatedFields);
    setSelectedFieldId(newId);
    debouncedSaveFields(updatedFields);
  }, [fields, debouncedSaveFields]);

  const deleteField = useCallback((fieldId: string) => {
    const updatedFields = fields.filter(f => f.id !== fieldId);
    setFields(updatedFields);
    
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(updatedFields[0]?.id || "");
    }
    
    debouncedSaveFields(updatedFields);
  }, [fields, selectedFieldId, debouncedSaveFields]);

  const updateField = useCallback((fieldId: string, updates: Partial<SchemaField>) => {
    const updatedFields = fields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    );
    setFields(updatedFields);
    debouncedSaveFields(updatedFields);
  }, [fields, debouncedSaveFields]);

  // 8. Editor mount handler for variable insertion
  const handleDescriptionEditorMount = useCallback((editor: editor.IStandaloneCodeEditor) => {
    editor.onDidFocusEditorWidget(() => {
      const position = editor.getPosition();
      if (position && nodeId) {
        setLastMonacoEditor(nodeId, `datastore-${nodeId}-${flowId}`, editor, position);
      }
    });
    
    editor.onDidBlurEditorWidget(() => {
      setLastMonacoEditor(null, null, null, null);
    });
    
    editor.onDidChangeCursorPosition((e) => {
      if (nodeId) {
        setLastMonacoEditor(nodeId, `datastore-${nodeId}-${flowId}`, editor, e.position);
      }
    });
  }, [nodeId, flowId, setLastMonacoEditor]);

  // 9. Early returns for loading/error states
  if (isLoading) {
    return <FlowPanelLoading message="Loading data store schema..." />;
  }

  // 10. Main render
  return (
    <div className="h-full flex flex-col bg-background-surface-2">
      {/* Header with description */}
      <div className="px-2 py-2.5 bg-background-surface-2 border-b border-border-dark flex flex-col justify-start items-start gap-2.5">
        <div className="self-stretch inline-flex justify-start items-center gap-10">
          <div className="flex-1 justify-start text-text-subtle text-xs font-normal">
            Create data fields to build nodes that can be linked into your flow and control session state dynamically.
          </div>
          <button className="h-7 px-3 py-2 bg-background-surface-4 rounded-full shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline-1 outline-offset-[-1px] outline-border-light flex justify-center items-center gap-2 hover:bg-background-surface-5 transition-colors">
            <Database className="w-4 h-4 text-text-body" />
            <div className="justify-center text-text-primary text-xs font-semibold leading-none">Data store node</div>
          </button>
        </div>
      </div>

      {/* Main content */}
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
            <div className="self-stretch flex flex-col justify-start items-start gap-2">
              {fields.map((field) => (
                <div key={field.id} className="self-stretch inline-flex justify-start items-center gap-2">
                  <DragHandle />
                  <div 
                    className={`flex-1 min-w-px inline-flex flex-col justify-start items-start gap-2 cursor-pointer`}
                    onClick={() => setSelectedFieldId(field.id)}
                  >
                    <div className={`self-stretch px-4 py-2 bg-background-surface-3 rounded-md inline-flex justify-start items-center gap-2 overflow-hidden ${
                      field.id === selectedFieldId 
                        ? 'outline outline-2 outline-offset-[-2px] outline-border-selected-inverse' 
                        : ''
                    }`}>
                      <div className="flex-1 min-w-px justify-start text-text-body text-xs font-normal">
                        {`{{${field.name}}}`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                      <Trash2 className="w-3.5 h-4 absolute left-[5px] top-[4px] text-text-subtle" />
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
                      className="self-stretch min-h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-body text-xs font-normal"
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
                          type: value as SchemaField['type']
                        });
                      }}
                    >
                      <SelectTrigger className="self-stretch min-h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-primary text-xs font-normal">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">String</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="boolean">Boolean</SelectItem>
                        <SelectItem value="object">Object</SelectItem>
                        <SelectItem value="array">Array</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Description field */}
              <div className="self-stretch flex-1 flex flex-col justify-start items-start gap-2">
                <div className="self-stretch inline-flex justify-start items-start gap-2">
                  <div className="justify-start text-text-body text-[10px] font-medium leading-none">Description</div>
                </div>
                <div className="self-stretch flex-1 flex flex-col justify-start items-start gap-1">
                  <div className="self-stretch flex-1 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal flex flex-col justify-start items-end overflow-hidden relative">
                    {/* Expand button */}
                    <div className="absolute top-2 right-2 z-10">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="p-2 inline-flex justify-start items-center gap-2 hover:bg-background-surface-1 rounded transition-colors">
                              <Maximize2 className="w-4 h-4 text-text-subtle" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent variant="button">
                            <p>Expand editor</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    {/* Editor */}
                    <div className="w-full h-full">
                      <Editor
                        key={selectedField.id}
                        value={localDescription}
                        onChange={(value) => {
                          const newValue = value || "";
                          setLocalDescription(newValue);
                          updateField(selectedField.id, { description: newValue });
                        }}
                        language="markdown"
                        onMount={handleDescriptionEditorMount}
                        containerClassName="h-full"
                        options={{
                          minimap: { enabled: false },
                          fontSize: 12,
                          lineNumbers: 'off',
                          folding: false,
                          renderLineHighlight: 'none',
                          scrollbar: {
                            vertical: 'auto',
                            horizontal: 'hidden'
                          },
                          overviewRulerLanes: 0,
                          hideCursorInOverviewRuler: true,
                          overviewRulerBorder: false,
                          wordWrap: 'on',
                          padding: { top: 40, bottom: 16 }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
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
    </div>
  );
}