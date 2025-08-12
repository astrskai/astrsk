import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components-v2/ui/input";
import { ScrollAreaSimple } from "@/components-v2/ui/scroll-area-simple";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components-v2/ui/select";
import { useFlowPanel } from "@/flow-multi/hooks/use-flow-panel";
import { FlowPanelLoading } from "@/flow-multi/hooks/use-flow-panel";
import { debounce } from "lodash-es";
import { 
  Condition, 
  ConditionDataType, 
  ConditionOperator,
  getDefaultOperatorForDataType,
  isUnaryOperator,
  isValidOperatorForDataType
} from '@/flow-multi/types/condition-types';
import { OperatorCombobox } from '@/flow-multi/components/operator-combobox';
import { ReadyState } from "@/modules/flow/domain";

interface IfNodePanelProps {
  flowId: string;
  nodeId: string;
}

// Extended condition type to allow null operator during creation
type EditableCondition = Omit<Condition, 'operator' | 'dataType'> & {
  dataType: ConditionDataType | null;
  operator: ConditionOperator | null;
};

export function IfNodePanel({ flowId, nodeId }: IfNodePanelProps) {
  const { flow, isLoading, saveFlow } = useFlowPanel({ flowId });
  const [logicOperator, setLogicOperator] = useState<'AND' | 'OR'>('AND');
  const [conditions, setConditions] = useState<EditableCondition[]>([]);
  const lastInitializedNodeId = useRef<string | null>(null);
  const flowLoadedRef = useRef<boolean>(false);

  // Save conditions to node
  const saveConditions = useCallback(async (newConditions: EditableCondition[], newOperator: 'AND' | 'OR') => {
    // Filter out incomplete conditions (where dataType or operator is null)
    // Only persist fully-formed conditions to prevent downstream issues
    const validConditions = newConditions.filter(c => 
      c.dataType !== null && c.operator !== null
    );

    // Update the node data directly in the flow panel which will handle saving
    if ((window as any).flowPanelUpdateNodeData) {
      (window as any).flowPanelUpdateNodeData(nodeId, { 
        conditions: validConditions, // Only valid conditions for evaluation
        draftConditions: newConditions, // All conditions including drafts
        logicOperator: newOperator 
      });
    } else {
      // Fallback if flow panel method is not available
      if (!flow) return;
      
      const node = flow.props.nodes.find(n => n.id === nodeId);
      if (!node) return;

      const updatedNode = {
        ...node,
        data: {
          ...node.data,
          conditions: validConditions,
          draftConditions: newConditions, // Store all conditions including drafts
          logicOperator: newOperator
        }
      };

      const updatedNodes = flow.props.nodes.map(n => 
        n.id === nodeId ? updatedNode : n
      );

      const updateResult = flow.update({ nodes: updatedNodes });
      if (updateResult.isSuccess) {
        let flowToSave = updateResult.getValue();
        
        // Set flow to Draft state if it was Ready
        if (flowToSave.props.readyState === ReadyState.Ready) {
          const stateUpdateResult = flowToSave.setReadyState(ReadyState.Draft);
          if (stateUpdateResult.isSuccess) {
            flowToSave = stateUpdateResult.getValue();
          }
        }
        
        await saveFlow(flowToSave);
      }
    }
  }, [flow, nodeId, saveFlow]);

  // Track when flow is loaded
  useEffect(() => {
    if (flow && !flowLoadedRef.current) {
      flowLoadedRef.current = true;
    }
  }, [flow]);

  // Initialize from node data
  useEffect(() => {
    if (nodeId && nodeId !== lastInitializedNodeId.current && flow && flowLoadedRef.current) {
      const node = flow.props.nodes.find(n => n.id === nodeId);
      const nodeData = node?.data as any;
      
      // Load existing conditions or create default
      // Prefer draftConditions (includes incomplete ones) for UI state
      const existingConditions = nodeData?.draftConditions || nodeData?.conditions || [];
      const existingOperator = nodeData?.logicOperator || 'AND';
      
      setLogicOperator(existingOperator);
      
      // If there are existing conditions, use them
      if (existingConditions.length > 0) {
        // Migrate old conditions that don't have dataType
        const migratedConditions: EditableCondition[] = existingConditions.map((c: any) => {
          if (!c.dataType && c.operator) {
            // Infer data type from operator for backwards compatibility
            let dataType: ConditionDataType | null = 'string';
            if (c.operator === 'greater_than' || c.operator === 'less_than' || 
                c.operator === 'greater_than_or_equals' || c.operator === 'less_than_or_equals') {
              dataType = 'number';
            }
            
            return {
              ...c,
              dataType,
              operator: c.operator || 'equals'
            };
          }
          // For new conditions with null dataType/operator, keep them as-is
          return {
            ...c,
            dataType: c.dataType ?? null,
            operator: c.operator ?? null
          };
        });
        setConditions(migratedConditions);
      } else {
        // Only create default condition if none exist - start with no operator selected
        const defaultCondition: EditableCondition = {
          id: `cond-${Date.now()}`,
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
  }, [nodeId, flow]); // Depend on both but use refs to control initialization

  const addCondition = useCallback(() => {
    const newCondition: EditableCondition = {
      id: `cond-${Date.now()}`,
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

  if (isLoading) {
    return <FlowPanelLoading message="Loading if node..." />;
  }

  return (
    <div className="h-full flex flex-col bg-background-surface-2">
      <ScrollAreaSimple className="flex-1">
        <div className="p-4 pr-2 inline-flex flex-col justify-start items-start gap-8">
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
                    <div className="w-80 h-3.5 justify-start text-text-subtle text-xs font-normal">
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
                            value={condition.value1}
                            onChange={(e) => updateCondition(condition.id, 'value1', e.target.value)}
                            placeholder="Variable or value"
                            className="self-stretch h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-primary text-xs font-normal"
                          />
                        </div>
                        {/* Unified Operator Combobox */}
                        <div className="w-[148px] inline-flex flex-col justify-start items-start gap-1">
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
                            value={condition.value2}
                            onChange={(e) => updateCondition(condition.id, 'value2', e.target.value)}
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