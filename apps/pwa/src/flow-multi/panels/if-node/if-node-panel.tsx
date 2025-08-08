import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components-v2/ui/input";
import { ScrollAreaSimple } from "@/components-v2/ui/scroll-area-simple";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components-v2/ui/select";
import { useFlowPanel } from "@/flow-multi/hooks/use-flow-panel";
import { FlowPanelLoading } from "@/flow-multi/hooks/use-flow-panel";
import { debounce } from "lodash-es";

interface IfNodePanelProps {
  flowId: string;
  nodeId: string;
}

interface Condition {
  id: string;
  value1: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  value2: string;
}

export function IfNodePanel({ flowId, nodeId }: IfNodePanelProps) {
  const { flow, isLoading, saveFlow } = useFlowPanel({ flowId });
  const [logicOperator, setLogicOperator] = useState<'AND' | 'OR'>('AND');
  const [conditions, setConditions] = useState<Condition[]>([]);
  const lastInitializedNodeId = useRef<string | null>(null);
  const flowLoadedRef = useRef<boolean>(false);

  // Save conditions to node
  const saveConditions = useCallback(async (newConditions: Condition[], newOperator: 'AND' | 'OR') => {
    if (!flow) return;
    
    const node = flow.props.nodes.find(n => n.id === nodeId);
    if (!node) return;

    const updatedNode = {
      ...node,
      data: {
        ...node.data,
        conditions: newConditions,
        logicOperator: newOperator
      }
    };

    const updatedNodes = flow.props.nodes.map(n => 
      n.id === nodeId ? updatedNode : n
    );

    const updateResult = flow.update({ nodes: updatedNodes });
    if (updateResult.isSuccess) {
      await saveFlow(updateResult.getValue());
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
      const existingConditions = nodeData?.conditions || [];
      const existingOperator = nodeData?.logicOperator || 'AND';
      
      setLogicOperator(existingOperator);
      
      // If there are existing conditions, use them
      if (existingConditions.length > 0) {
        setConditions(existingConditions);
      } else {
        // Only create default condition if none exist
        const defaultCondition = {
          id: `cond-${Date.now()}`,
          value1: '',
          operator: 'equals' as const,
          value2: ''
        };
        setConditions([defaultCondition]);
        // Don't save here - let the user make changes first
      }
      
      lastInitializedNodeId.current = nodeId;
    }
  }, [nodeId, flow]); // Depend on both but use refs to control initialization

  const addCondition = useCallback(() => {
    const newCondition: Condition = {
      id: `cond-${Date.now()}`,
      value1: '',
      operator: 'equals',
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

  const updateCondition = useCallback((id: string, field: keyof Condition, value: string) => {
    const newConditions = conditions.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    );
    setConditions(newConditions);
    saveConditions(newConditions, logicOperator);
  }, [conditions, logicOperator, saveConditions]);

  const handleLogicOperatorChange = useCallback((value: 'AND' | 'OR') => {
    setLogicOperator(value);
    saveConditions(conditions, value);
  }, [conditions, saveConditions]);

  if (isLoading) {
    return <FlowPanelLoading message="Loading if node..." />;
  }

  return (
    <div className="h-full flex flex-col bg-background-surface-2">
      <div className="flex-1 p-4 inline-flex flex-col justify-start items-start gap-8">
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
        <ScrollAreaSimple className="self-stretch flex-1">
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
                        <div className="flex-1 inline-flex flex-col justify-start items-start gap-1">
                          <Input
                            value={condition.value1}
                            onChange={(e) => updateCondition(condition.id, 'value1', e.target.value)}
                            placeholder="value1"
                            className="self-stretch h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-primary text-xs font-normal"
                          />
                        </div>
                        <div className="w-32 inline-flex flex-col justify-start items-start gap-1">
                          <Select 
                            value={condition.operator} 
                            onValueChange={(value) => updateCondition(condition.id, 'operator', value)}
                          >
                            <SelectTrigger className="self-stretch h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-primary text-xs font-normal">
                              <SelectValue>
                                {condition.operator === 'equals' && 'is equal to'}
                                {condition.operator === 'not_equals' && 'not equal to'}
                                {condition.operator === 'greater_than' && 'greater than'}
                                {condition.operator === 'less_than' && 'lower than'}
                                {condition.operator === 'contains' && 'contains'}
                                {condition.operator === 'not_contains' && 'not contains'}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="equals">is equal to</SelectItem>
                              <SelectItem value="not_equals">not equal to</SelectItem>
                              <SelectItem value="greater_than">greater than</SelectItem>
                              <SelectItem value="less_than">lower than</SelectItem>
                              <SelectItem value="contains">contains</SelectItem>
                              <SelectItem value="not_contains">not contains</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {/* Value2 Row */}
                      <div className="self-stretch flex flex-col justify-start items-start gap-1">
                        <Input
                          value={condition.value2}
                          onChange={(e) => updateCondition(condition.id, 'value2', e.target.value)}
                          placeholder="value2"
                          className="self-stretch h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-primary text-xs font-normal"
                        />
                      </div>
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
        </ScrollAreaSimple>
      </div>
    </div>
  );
}