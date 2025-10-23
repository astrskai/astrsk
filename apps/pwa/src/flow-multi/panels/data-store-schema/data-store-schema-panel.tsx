// Data store schema panel component for Dockview multi-panel layout
// Uses targeted mutations and panel-specific queries for optimal performance

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Trash2, Plus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import { debounce } from "lodash-es";

import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components-v2/ui/select";
import { ScrollAreaSimple } from "@/components-v2/ui/scroll-area-simple";
import { HelpCircle } from "lucide-react";

// Import query and mutation system
import { useQuery } from "@tanstack/react-query";
import { flowQueries } from "@/app/queries/flow/query-factory";
import { useUpdateDataStoreSchema } from "@/app/queries/flow/mutations/data-store-mutations";

// Import from flow panel architecture
import { useFlowPanelContext } from "@/flow-multi/components/flow-panel-provider";
import { DataStoreSchemaProps, DataStoreSchemaField, DataStoreSchema, DataStoreFieldType } from "./data-store-schema-types";
import { SortableField } from "./sortable-field";
import { UniqueEntityID } from "@/shared/domain";
import { sanitizeFileName } from "@/shared/lib/file-utils";
import { toast } from "sonner";

export function DataStoreSchemaPanel({ flowId }: DataStoreSchemaProps) {
  
  // 1. Get the mutation hook with edit mode support
  const updateDataStoreSchema = useUpdateDataStoreSchema(flowId);
  
  // 2. Load just the data store schema - more efficient than loading entire flow
  const { 
    data: schema, 
    isLoading,
    error,
    dataUpdatedAt,
    isRefetching,
    isFetching,
    status
  } = useQuery({
    ...flowQueries.dataStoreSchema(flowId),
    enabled: !!flowId && !updateDataStoreSchema.isEditing, // Pause during edits
    refetchOnMount: false, // Don't refetch on mount - only when needed
    refetchOnWindowFocus: !updateDataStoreSchema.isEditing,
  });

  // Get flow panel context for opening panels and adding nodes
  const { openPanel, addDataStoreNode } = useFlowPanelContext();

  // 3. Local state for fields
  const [fields, setFields] = useState<DataStoreSchemaField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>("");
  const [localInitialValue, setLocalInitialValue] = useState("");
  
  // Track editing state in a ref to avoid triggering effects
  const isEditingRef = useRef(updateDataStoreSchema.isEditing);
  useEffect(() => {
    isEditingRef.current = updateDataStoreSchema.isEditing;
  }, [updateDataStoreSchema.isEditing]);
  
  // 4. Initialize fields from schema
  useEffect(() => {
    // Only update fields from schema if we have schema data and we're not editing
    if (schema?.fields && !isEditingRef.current) {
      setFields(schema.fields);
      // Maintain selection if possible
      if (!selectedFieldId || !schema.fields.find(f => f.id === selectedFieldId)) {
        setSelectedFieldId(schema.fields[0]?.id || "");
      }
    }
    // Don't clear fields just because schema is null - preserve local state
  }, [schema, isLoading, status]); // Don't include isEditing to avoid unnecessary re-runs
  // Note: selectedFieldId is intentionally not in deps to preserve selection

  // 5. Get selected field
  const selectedField = useMemo(() => 
    fields.find(f => f.id === selectedFieldId),
    [fields, selectedFieldId]
  );

  // 6. Sync local initial value with selected field
  useEffect(() => {
    if (selectedField) {
      setLocalInitialValue(selectedField.initialValue || "");
    }
  }, [selectedField?.id, selectedField?.initialValue]);

  // 7. Debounced save for fields - only recreate when target changes
  const debouncedSaveFields = useMemo(
    () => debounce((updatedFields: DataStoreSchemaField[]) => {
      const updatedSchema: DataStoreSchema = {
        fields: updatedFields
      };
      
      // Access mutation directly
      updateDataStoreSchema.mutate(updatedSchema, {
        onError: (error) => {
          toast.error("Failed to save data store schema", {
            description: error instanceof Error ? error.message : "Unknown error",
          });
        }
      });
    }, 300),
    [flowId] // Only recreate when save target changes
  );
  
  // Clean up debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedSaveFields.cancel();
    };
  }, [debouncedSaveFields]);

  // 8. Field management functions
  const addNewField = useCallback(() => {
    const newId = new UniqueEntityID().toString();
    const newField: DataStoreSchemaField = {
      id: newId,
      name: `field_${fields.length + 1}`,
      type: 'string',
      initialValue: ""
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
    
    debouncedSaveFields(updatedFields);
  }, [fields, selectedFieldId, debouncedSaveFields]);

  // 9. Early returns for loading/error states
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background-surface-2">
        <div className="flex items-center gap-2 text-text-subtle">
          <span>Loading data schema...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-background-surface-2">
        <div className="text-text-subtle">
          Error loading data store schema
        </div>
      </div>
    );
  }

  // 10. Main render
  return (
    <div className="h-full flex flex-col bg-background-surface-2">
      {/* Main content */}
      {fields.length === 0 ? (
        // Empty state
        <div className="self-stretch flex-1 p-2 bg-background-surface-2 inline-flex justify-start items-start gap-2">
          <div className="flex-1 self-stretch min-w-36 inline-flex flex-col justify-start items-start gap-4">
            <div className="self-stretch flex-1 flex flex-col justify-center items-center gap-8">
              <div className="flex flex-col justify-start items-center gap-2">
                <div className="text-center justify-start text-text-body text-base font-semibold leading-relaxed">No schema fields yet</div>
                <div className="w-40 text-center justify-start text-background-surface-5 text-xs font-normal">Start by creating fields for your data schema.</div>
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
                      className="w-6 h-6 relative rounded-sm hover:opacity-80 transition-opacity mt-2 mr-1"
                    >
                      <Trash2 className="size-[24px] text-text-subtle" />
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
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-text-info" />
                        </TooltipTrigger>
                        <TooltipContent variant="button">
                          <p>Default value for this field when a new<br/>session startsYou can customize this.<br/>to match your workflow needs.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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