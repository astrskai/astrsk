import { useState, useCallback, useEffect, useRef } from "react";
import { Plus, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components-v2/ui/input";
import { ScrollAreaSimple } from "@/components-v2/ui/scroll-area-simple";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components-v2/ui/select";
import { ifNodeQueries } from "@/app/queries/if-node/query-factory";
import { useUpdateIfNodeConditions, type EditableCondition as EditableConditionType } from "@/app/queries/if-node/mutations/condition-mutations";
import { useFlowPanelContext } from "@/flow-multi/components/flow-panel-provider";
import { IfCondition } from "@/flow-multi/nodes/if-node";
import { UniqueEntityID } from "@/shared/domain";
import { 
  ConditionDataType, 
  ConditionOperator,
  getDefaultOperatorForDataType,
  isUnaryOperator,
  isValidOperatorForDataType
} from '@/flow-multi/types/condition-types';
import { OperatorCombobox } from '@/flow-multi/components/operator-combobox';
import { toast } from "sonner";

interface IfNodePanelProps {
  flowId: string;
  nodeId: string;
}

// Use the EditableCondition type from mutations
type EditableCondition = EditableConditionType;

export function IfNodePanel({ flowId, nodeId }: IfNodePanelProps) {
  const { setLastInputField, closePanel } = useFlowPanelContext();
  
  // Get mutation hook for updating conditions
  const updateConditions = useUpdateIfNodeConditions(flowId, nodeId);
  
  // Query for if node data from separate data store (new architecture)
  const { data: ifNodeData, isLoading: ifNodeLoading } = useQuery({
    ...ifNodeQueries.detail(flowId, nodeId),
    enabled: !!flowId && !!nodeId && !updateConditions.isEditing,
  });
  const [logicOperator, setLogicOperator] = useState<'AND' | 'OR'>('AND');
  const [conditions, setConditions] = useState<EditableCondition[]>([]);
  const lastInitializedNodeId = useRef<string | null>(null);
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Auto-close panel when connected node is deleted
  useEffect(() => {
    if (!ifNodeLoading && !ifNodeData && nodeId) {
      // Node has been deleted, close the panel
      closePanel(`ifNode-${nodeId}`);
    }
  }, [ifNodeData, ifNodeLoading, nodeId, closePanel]);

  // Save conditions to node using targeted mutation
  const saveConditions = useCallback((newConditions: EditableCondition[], newOperator: 'AND' | 'OR') => {

    updateConditions.mutate({
      conditions: newConditions,
      draftConditions: newConditions,
      logicOperator: newOperator
    }, {
      onSuccess: () => {
        // Update local state after successful save
        setConditions(newConditions);
        setLogicOperator(newOperator);
      },
      onError: (error) => {
        toast.error("Failed to save conditions", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });
  }, [updateConditions]);


  // Clean up input field tracking on unmount
  useEffect(() => {
    return () => {
      setLastInputField(null, null, null, undefined);
    };
  }, [setLastInputField]);

  // Initialize from if node data
  useEffect(() => {
    // Check if user is typing in an input field
    const activeElement = document.activeElement;
    const isTyping = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';

    if (nodeId && ifNodeData && !isTyping) {
      // Load existing conditions or create default (but not while typing)
      const existingConditions = ifNodeData.conditions || [];
      const existingOperator = ifNodeData.logicOperator || 'AND';

      setLogicOperator(existingOperator);

      // If there are existing conditions, use them
      if (existingConditions.length > 0) {
        // Convert to editable conditions format
        const editableConditions: EditableCondition[] = existingConditions.map((c: any) => ({
          id: c.id,
          dataType: c.dataType ?? null,
          value1: c.value1 || '',
          operator: c.operator ?? null,
          value2: c.value2 || ''
        }));
        setConditions(editableConditions);
      } else {
        // Create default condition if none exist - start with no operator selected
        const defaultCondition: EditableCondition = {
          id: new UniqueEntityID().toString(),
          dataType: null,
          value1: '',
          operator: null,
          value2: ''
        };
        setConditions([defaultCondition]);
        // Don't save here - let the user make changes first
      }

      lastInitializedNodeId.current = nodeId;
    }
  }, [nodeId, ifNodeData]); // Sync whenever nodeId or ifNodeData changes

  const addCondition = useCallback(() => {
    const newCondition: EditableCondition = {
      id: new UniqueEntityID().toString(),
      dataType: null,
      value1: '',
      operator: null,
      value2: ''
    };
    const newConditions = [...conditions, newCondition];
    setConditions(newConditions);
    saveConditions(newConditions, logicOperator);
  }, [conditions, logicOperator, saveConditions]);

  const removeCondition = useCallback((id: string) => {
    // Don't allow removing if it's the only condition
    if (conditions.length <= 1) return;
    
    const newConditions = conditions.filter(c => c.id !== id);
    setConditions(newConditions);
    saveConditions(newConditions, logicOperator);
  }, [conditions, logicOperator, saveConditions]);

  const updateCondition = useCallback((id: string, field: keyof EditableCondition, value: string) => {
    const newConditions = conditions.map(c => {
      if (c.id !== id) return c;
      
      // When data type changes, reset operator to default for that type
      if (field === 'dataType') {
        const newDataType = value as ConditionDataType;
        const currentOperator = c.operator;
        const isValidForNewType = currentOperator ? isValidOperatorForDataType(currentOperator, newDataType) : false;
        
        return {
          ...c,
          dataType: newDataType,
          operator: isValidForNewType ? currentOperator : getDefaultOperatorForDataType(newDataType)
        };
      }
      
      return { ...c, [field]: value };
    });
    setConditions(newConditions);
    saveConditions(newConditions, logicOperator);
  }, [conditions, logicOperator, saveConditions]);

  const handleLogicOperatorChange = useCallback((value: 'AND' | 'OR') => {
    setLogicOperator(value);
    saveConditions(conditions, value);
  }, [conditions, saveConditions]);

  // Handle operator change from nested dropdown
  const handleOperatorChange = useCallback((id: string, dataType: ConditionDataType, operator: ConditionOperator) => {
    const newConditions = conditions.map(c => {
      if (c.id !== id) return c;
      
      const operatorChanged = c.operator !== operator;
      
      // Keep existing values when changing data type or operator
      // Only clear value2 if switching to a unary operator
      if (operatorChanged && isUnaryOperator(operator)) {
        // Switching to unary operator - clear value2
        return {
          ...c,
          dataType,
          operator,
          value2: ''
        };
      }
      
      // Keep all values when just changing data type or switching between binary operators
      return { 
        ...c, 
        dataType, 
        operator 
      };
    });
    setConditions(newConditions);
    saveConditions(newConditions, logicOperator);
  }, [conditions, logicOperator, saveConditions]);

  if (ifNodeLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background-surface-2">
        <div className="flex items-center gap-2 text-text-subtle">
          <span>Loading if node...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background-surface-2">
      <ScrollAreaSimple className="flex-1">
        <div className="p-4 flex flex-col justify-start items-start gap-8 w-full">
          {/* Header with Logic Operator and Add Button */}
          <div className="self-stretch inline-flex justify-between items-center">
            <div className="w-28 inline-flex flex-col justify-start items-start gap-1">
              <Select value={logicOperator} onValueChange={(value) => handleLogicOperatorChange(value as 'AND' | 'OR')}>
                <SelectTrigger className="self-stretch h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-primary text-xs font-normal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">AND</SelectItem>
                  <SelectItem value="OR">OR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <button
              onClick={addCondition}
              className="h-7 px-3 py-2 bg-background-surface-4 rounded-full shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline-1 outline-offset-[-1px] outline-border-light flex justify-center items-center gap-2 hover:bg-background-surface-5 transition-colors"
            >
              <Plus className="w-4 h-4 text-text-body" />
              <div className="justify-center text-text-primary text-xs font-semibold leading-none">Add condition</div>
            </button>
          </div>

          {/* Conditions List */}
          <div className="self-stretch flex flex-col justify-start items-start gap-3">
            {conditions.map((condition, index) => (
                <div key={condition.id} className="self-stretch flex flex-col gap-3">
                  {/* Logic Operator Separator */}
                  {index > 0 && (
                    <div className="self-stretch h-3.5 justify-start text-text-subtle text-xs font-normal">
                      {logicOperator}
                    </div>
                  )}
                  
                  {/* Condition */}
                  <div className="self-stretch inline-flex justify-start items-start gap-2">
                    <div className="flex-1 inline-flex flex-col justify-start items-start gap-3">
                      {/* Value1 and Operator Row */}
                      <div className="self-stretch inline-flex justify-start items-center gap-2">
                        {/* Value1 Input */}
                        <div className="flex-1 inline-flex flex-col justify-start items-start gap-1">
                          <Input
                            ref={(el) => {
                              inputRefs.current[`${condition.id}-value1`] = el;
                            }}
                            value={condition.value1}
                            onChange={(e) => updateCondition(condition.id, 'value1', e.target.value)}
                            onFocus={(e) => {
                              setLastInputField(
                                nodeId, 
                                `${condition.id}-value1`, 
                                e.currentTarget,
                                (value: string) => updateCondition(condition.id, 'value1', value)
                              );
                            }}
                            onBlur={() => {
                              // Don't clear on blur - let the next focus event handle it
                            }}
                            placeholder="Variable or value"
                            className="self-stretch h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-primary text-xs font-normal"
                          />
                        </div>
                        {/* Unified Operator Combobox */}
                        <div className="w-[192px] inline-flex flex-col justify-start items-start gap-1">
                          <OperatorCombobox
                            value={{
                              dataType: condition.dataType,
                              operator: condition.operator
                            }}
                            onChange={(dataType, operator) => handleOperatorChange(condition.id, dataType, operator)}
                            className="w-full"
                            placeholder="Select"
                          />
                        </div>
                      </div>
                      
                      {/* Value2 Row - only show if operator exists and requires it */}
                      {condition.operator && !isUnaryOperator(condition.operator) && (
                        <div className="self-stretch flex flex-col justify-start items-start gap-1">
                          <Input
                            ref={(el) => {
                              inputRefs.current[`${condition.id}-value2`] = el;
                            }}
                            value={condition.value2}
                            onChange={(e) => updateCondition(condition.id, 'value2', e.target.value)}
                            onFocus={(e) => {
                              setLastInputField(
                                nodeId, 
                                `${condition.id}-value2`, 
                                e.currentTarget,
                                (value: string) => updateCondition(condition.id, 'value2', value)
                              );
                            }}
                            onBlur={() => {
                              // Don't clear on blur - let the next focus event handle it
                            }}
                            placeholder={condition.dataType === 'boolean' ? 'true/false' : 'Compare value'}
                            className="self-stretch h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-primary text-xs font-normal"
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Delete Button - only show if not the first/only condition */}
                    {conditions.length > 1 && (
                      <div
                        onClick={() => removeCondition(condition.id)}
                        className="inline-flex justify-start items-start cursor-pointer"
                      >
                        <div className="w-5 h-5 relative rounded-[5px] overflow-hidden">
                          <X className="w-4 h-4 absolute left-[0.5px] top-[0.5px] text-text-placeholder" />
                        </div>
                      </div>
                    )}
                    {/* Invisible spacer when delete button is hidden */}
                    {conditions.length <= 1 && (
                      <div className="w-5 h-5" />
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </ScrollAreaSimple>
    </div>
  );
}