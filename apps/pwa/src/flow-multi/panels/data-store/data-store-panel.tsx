import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useFlowPanel } from "@/flow-multi/hooks/use-flow-panel";
import { useFlowPanelContext } from "@/flow-multi/components/flow-panel-provider";
import { Button } from "@/components-v2/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components-v2/ui/select";
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
import { Plus, Trash2, Maximize2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components-v2/ui/tooltip";
import { Editor } from "@/components-v2/editor";
import type { editor } from "monaco-editor";
import { debounce } from "lodash-es";
import type { DataStoreField, Flow } from "@/modules/flow/domain/flow";
import { SortableDataField } from "./sortable-data-field";
import { ScrollAreaSimple } from "@/components-v2/ui/scroll-area-simple";

interface DataStorePanelProps {
  flowId: string;
  nodeId: string;
}

export function DataStorePanel({ flowId, nodeId }: DataStorePanelProps) {
  const { flow, saveFlow } = useFlowPanel({ flowId });
  const { openPanel } = useFlowPanelContext();

  // Store flow in ref to prevent re-renders from triggering logic reset
  const flowRef = useRef(flow);
  useEffect(() => {
    flowRef.current = flow;
  }, [flow]);


  // Get node data from flow
  const node = flow?.props.nodes.find(n => n.id === nodeId);
  const nodeData = node?.data as any;
  
  // Get schema fields from flow's dataStoreSchema
  const schemaFields = useMemo(() => flow?.props.dataStoreSchema?.fields || [], [flow?.props.dataStoreSchema?.fields]);

  // Local state for imported fields and logic
  const [dataStoreFields, setDataStoreFields] = useState<DataStoreField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>("");
  const [selectedSchemaFieldId, setSelectedSchemaFieldId] = useState<string>("");
  const [localLogic, setLocalLogic] = useState("");
  const lastNodeIdRef = useRef<string>("");
  const isEditingLogicRef = useRef<boolean>(false);

  // Initialize data store fields from node data - only when nodeId changes
  useEffect(() => {
    if (flow && nodeId && nodeId !== lastNodeIdRef.current) {
      const currentNode = flow.props.nodes.find(n => n.id === nodeId);
      const currentNodeData = currentNode?.data as any;
      
      if (currentNodeData?.dataStoreFields) {
        setDataStoreFields(currentNodeData.dataStoreFields);
        if (currentNodeData.dataStoreFields.length > 0) {
          setSelectedFieldId(currentNodeData.dataStoreFields[0].schemaFieldId);
        }
      } else {
        setDataStoreFields([]);
        setSelectedFieldId("");
      }
      lastNodeIdRef.current = nodeId;
    }
  }, [flow, nodeId]); // Only when nodeId changes

  // Sync logic with selected field - only when field selection changes or initial load
  useEffect(() => {
    // Don't sync if we're actively editing
    if (isEditingLogicRef.current) {
      return;
    }
    
    const selectedField = dataStoreFields.find(f => f.schemaFieldId === selectedFieldId);
    if (selectedField) {
      setLocalLogic(selectedField.logic || "");
    } else {
      setLocalLogic("");
    }
  }, [selectedFieldId, dataStoreFields]);

  // Save data store fields to node
  const saveDataStoreFields = useCallback(async (fields: DataStoreField[]) => {
    const currentFlow = flowRef.current;
    if (!currentFlow) return;
    
    const currentNode = currentFlow.props.nodes.find(n => n.id === nodeId);
    if (!currentNode) return;
    
    const updatedNode = {
      ...currentNode,
      data: {
        ...currentNode.data,
        dataStoreFields: fields
      }
    };
    
    const updatedNodes = currentFlow.props.nodes.map(n => 
      n.id === nodeId ? updatedNode : n
    );
    
    const updateResult = currentFlow.update({ nodes: updatedNodes });
    if (updateResult.isSuccess) {
      await saveFlow(updateResult.getValue());
      
      // Update the node data directly in the flow panel to trigger re-render
      if ((window as any).flowPanelUpdateNodeData) {
        (window as any).flowPanelUpdateNodeData(nodeId, { dataStoreFields: fields });
      }
    }
  }, [nodeId, saveFlow]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end for reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setDataStoreFields((items) => {
        const oldIndex = items.findIndex((item) => item.schemaFieldId === active.id);
        const newIndex = items.findIndex((item) => item.schemaFieldId === over.id);
        const reorderedFields = arrayMove(items, oldIndex, newIndex);
        saveDataStoreFields(reorderedFields);
        return reorderedFields;
      });
    }
  };

  // Import selected schema field
  const handleImportField = useCallback(() => {
    if (!selectedSchemaFieldId) return;
    
    // Check if already imported
    const alreadyExists = dataStoreFields.some(f => f.schemaFieldId === selectedSchemaFieldId);
    if (alreadyExists) return;
    
    const schemaField = schemaFields.find(f => f.id === selectedSchemaFieldId);
    if (!schemaField) return;
    
    const newField: DataStoreField = {
      schemaFieldId: selectedSchemaFieldId,
      value: schemaField.initialValue || '',
      logic: ''  // Initialize with empty string instead of undefined
    };
    
    const updatedFields = [...dataStoreFields, newField];
    setDataStoreFields(updatedFields);
    setSelectedFieldId(selectedSchemaFieldId);
    setSelectedSchemaFieldId("");
    saveDataStoreFields(updatedFields);
  }, [selectedSchemaFieldId, dataStoreFields, schemaFields, saveDataStoreFields]);

  // Save logic for selected field (called by debounced function)
  const saveLogicForField = useCallback((value: string) => {
    if (selectedFieldId) {
      const updatedFields = dataStoreFields.map(f => 
        f.schemaFieldId === selectedFieldId 
          ? { ...f, logic: value }  // Save empty string as-is, don't convert to undefined
          : f
      );
      setDataStoreFields(updatedFields);
      saveDataStoreFields(updatedFields);
      // Reset editing flag after save
      isEditingLogicRef.current = false;
    }
  }, [selectedFieldId, dataStoreFields, saveDataStoreFields]);

  // Delete selected field
  const handleDeleteField = useCallback(() => {
    if (!selectedFieldId) return;
    
    const filtered = dataStoreFields.filter(f => f.schemaFieldId !== selectedFieldId);
    // Select next field if available
    if (filtered.length > 0) {
      setSelectedFieldId(filtered[0].schemaFieldId);
    } else {
      setSelectedFieldId("");
    }
    setDataStoreFields(filtered);
    saveDataStoreFields(filtered);
  }, [selectedFieldId, dataStoreFields, saveDataStoreFields]);

  // Handle opening data schema setup
  const handleOpenSchema = useCallback(() => {
    openPanel('dataStoreSchema', nodeId);
  }, [openPanel, nodeId]);

  // Get Monaco editor functions from flow context
  const { setLastMonacoEditor } = useFlowPanelContext();

  // Editor mount handler
  const handleEditorMount = useCallback((editor: editor.IStandaloneCodeEditor) => {
    editor.onDidFocusEditorWidget(() => {
      const position = editor.getPosition();
      if (position) {
        setLastMonacoEditor(nodeId, `datastore-${nodeId}-${flowId}`, editor, position);
      }
    });
    
    editor.onDidBlurEditorWidget(() => {
      setLastMonacoEditor(null, null, null, null);
    });
    
    editor.onDidChangeCursorPosition((e) => {
      setLastMonacoEditor(nodeId, `datastore-${nodeId}-${flowId}`, editor, e.position);
    });
  }, [nodeId, flowId, setLastMonacoEditor]);

  // Debounced save for logic
  const debouncedSaveLogic = useMemo(
    () => debounce((value: string) => {
      saveLogicForField(value);
    }, 1000), // 1 second debounce like response design panel
    [saveLogicForField]
  );

  // Get selected field and its schema
  const selectedField = useMemo(() => 
    dataStoreFields.find(f => f.schemaFieldId === selectedFieldId),
    [dataStoreFields, selectedFieldId]
  );

  const selectedFieldSchema = useMemo(() => 
    schemaFields.find(f => f.id === selectedFieldId),
    [schemaFields, selectedFieldId]
  );

  // Get available schema fields (not yet imported)
  const availableSchemaFields = useMemo(() => 
    schemaFields.filter(sf => !dataStoreFields.some(df => df.schemaFieldId === sf.id)),
    [schemaFields, dataStoreFields]
  );

  return (
    <div className="flex flex-col h-full bg-background-surface-2">
      {/* Header with description */}
      <div className="self-stretch px-2 py-2.5 bg-background-surface-2 border-b border-border-dark inline-flex flex-col justify-start items-start gap-2.5">
        <div className="self-stretch inline-flex justify-start items-center gap-10">
          <div className="flex-1 justify-start text-text-subtle text-xs font-normal leading-none">
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
      </div>

      {/* Main content */}
      <div className="flex-1 p-2 bg-background-surface-2 flex gap-2">
        {/* Left panel - Import and fields list */}
        <div className="flex-1 max-w-64 min-w-36 flex flex-col gap-4">
          {/* Import dropdown section */}
          <div className="self-stretch flex flex-col justify-start items-start gap-2">
            <div className="self-stretch flex flex-col justify-start items-start gap-2">
              <div className="self-stretch inline-flex justify-start items-center gap-2">
                <div className="justify-start text-text-body text-[10px] font-medium leading-none">Import data store schema</div>
              </div>
              <div className="self-stretch flex flex-col justify-start items-start gap-1">
                <Select
                  value={selectedSchemaFieldId}
                  onValueChange={setSelectedSchemaFieldId}
                >
                  <SelectTrigger className="self-stretch h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-primary text-xs font-normal">
                    <SelectValue placeholder="Select the data store schema" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSchemaFields.length === 0 ? (
                      <div className="px-4 py-2 text-xs text-text-subtle">No fields available to import</div>
                    ) : (
                      availableSchemaFields.map(field => (
                        <SelectItem key={field.id} value={field.id}>
                          {field.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <button
              onClick={handleImportField}
              disabled={!selectedSchemaFieldId}
              className="self-stretch h-7 px-3 py-2 bg-background-surface-4 rounded-full shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline-1 outline-offset-[-1px] outline-border-light inline-flex justify-center items-center gap-2 hover:bg-background-surface-5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4 text-text-body" />
              <div className="justify-center text-text-primary text-xs font-semibold leading-none">Import</div>
            </button>
          </div>

          {/* Fields list */}
          {dataStoreFields.length > 0 && (
            <ScrollAreaSimple className="self-stretch flex-1">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis, restrictToParentElement]}
              >
                <SortableContext
                  items={dataStoreFields.map(f => f.schemaFieldId)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="self-stretch flex flex-col justify-start items-start gap-2">
                    {dataStoreFields.map((field) => {
                      const schemaField = schemaFields.find(sf => sf.id === field.schemaFieldId);
                      return schemaField ? (
                        <SortableDataField
                          key={field.schemaFieldId}
                          field={field}
                          fieldName={schemaField.name}
                          isSelected={field.schemaFieldId === selectedFieldId}
                          onClick={() => setSelectedFieldId(field.schemaFieldId)}
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
        <div className="w-px self-stretch bg-border-dark"></div>

        {/* Right panel - Logic editor */}
        <div className="flex-1 min-w-36 flex flex-col gap-4">
          {selectedField && selectedFieldSchema ? (
            <>
              {/* Delete button */}
              <div className="self-stretch flex justify-end">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleDeleteField}
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
              </div>

              {/* Logic field */}
              <div className="flex-1 flex flex-col gap-2">
                <div className="self-stretch inline-flex justify-start items-start gap-2">
                  <div className="justify-start text-text-body text-[10px] font-medium leading-none">Logic</div>
                </div>
                <div className="flex-1 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal flex flex-col overflow-hidden relative">
                    {/* Expand button */}
                    <div className="absolute top-2 right-2 z-10">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button 
                              className="p-2 inline-flex justify-start items-center gap-2 hover:bg-background-surface-1 rounded transition-colors"
                              onClick={() => {
                                // TODO: Implement expand functionality
                                console.log("Expand editor");
                              }}
                            >
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
                          padding: { top: 8, bottom: 16 }
                        }}
                      />
                    </div>
                  </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-text-subtle text-xs mb-2">
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