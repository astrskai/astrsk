import { useState } from "react";
import { Plus, X, ChevronDown } from "lucide-react";
import { Input } from "@/components-v2/ui/input";
import { ScrollAreaSimple } from "@/components-v2/ui/scroll-area-simple";

interface IfNodePanelProps {
  flowId: string;
  nodeId: string;
}

interface Condition {
  id: string;
  value1: string;
  operator: string;
  value2: string;
}

export function IfNodePanel({ flowId, nodeId }: IfNodePanelProps) {
  const [logicOperator, setLogicOperator] = useState<'AND' | 'OR'>('AND');
  const [conditions, setConditions] = useState<Condition[]>([]);

  const addCondition = () => {
    const newCondition: Condition = {
      id: `cond-${Date.now()}`,
      value1: '',
      operator: 'equals',
      value2: ''
    };
    setConditions([...conditions, newCondition]);
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter(c => c.id !== id));
  };

  const updateCondition = (id: string, field: keyof Condition, value: string) => {
    setConditions(conditions.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  return (
    <div className="h-full w-full p-4 bg-background-surface-2 flex">
      <div className="flex-1 flex flex-col gap-8">
        {/* Header with Logic Operator and Add Button */}
        <div className="w-full flex justify-between items-center">
          <div className="w-28 h-11">
            <div className="w-full h-full px-4 py-2 bg-background-surface-0 rounded-lg outline outline-[1.40px] outline-offset-[-1.40px] outline-border-normal flex justify-between items-center overflow-hidden cursor-pointer"
                 onClick={() => setLogicOperator(logicOperator === 'AND' ? 'OR' : 'AND')}>
              <div className="flex-1 flex justify-start items-center gap-6">
                <div className="flex-1 justify-start text-text-primary text-base">{logicOperator}</div>
              </div>
              <ChevronDown className="w-6 h-6 text-background-surface-5" />
            </div>
          </div>
          <button
            onClick={addCondition}
            className="h-7 px-3 py-2 bg-background-surface-4 rounded-full shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-border-light flex justify-center items-center gap-2 hover:bg-background-surface-5 transition-colors"
          >
            <Plus className="w-4 h-4 text-text-body" />
            <div className="justify-center text-text-primary text-xs font-semibold leading-none">Add condition</div>
          </button>
        </div>

        {/* Conditions List */}
        <ScrollAreaSimple className="flex-1 overflow-auto">
          <div className="flex flex-col gap-6">
            {conditions.length === 0 ? (
              <div className="text-center py-8 text-text-subtle text-sm">
                No conditions defined. Click "Add condition" to get started.
              </div>
            ) : (
              conditions.map((condition, index) => (
                <div key={condition.id} className="self-stretch flex flex-col gap-6">
                  {/* Logic Operator Separator */}
                  {index > 0 && (
                    <div className="self-stretch inline-flex justify-start items-center gap-6">
                      <div className="flex-1 justify-start text-text-subtle text-base">{logicOperator}</div>
                    </div>
                  )}
                  
                  {/* Condition Row */}
                  <div className="self-stretch inline-flex justify-start items-start gap-3">
                    <div className="flex-1 inline-flex flex-col justify-start items-start gap-3">
                      {/* Value1 and Operator Row */}
                      <div className="self-stretch inline-flex justify-start items-center gap-2">
                        <div className="flex-1 inline-flex flex-col justify-start items-start gap-1">
                          <Input
                            value={condition.value1}
                            onChange={(e) => updateCondition(condition.id, 'value1', e.target.value)}
                            placeholder="value1"
                            className="self-stretch min-h-11 px-4 py-2 bg-background-surface-0 rounded-lg outline outline-[1.40px] outline-offset-[-1.40px] outline-border-normal text-base placeholder:text-text-placeholder"
                          />
                        </div>
                        <div className="w-36 inline-flex flex-col justify-start items-start gap-1">
                          <div className="self-stretch min-h-11 px-4 py-2 bg-background-surface-0 rounded-lg outline outline-[1.40px] outline-offset-[-1.40px] outline-border-normal inline-flex justify-between items-center overflow-hidden cursor-pointer"
                               onClick={() => {
                                 const operators = ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'not_contains'];
                                 const currentIndex = operators.indexOf(condition.operator);
                                 const nextIndex = (currentIndex + 1) % operators.length;
                                 updateCondition(condition.id, 'operator', operators[nextIndex]);
                               }}>
                            <div className="flex-1 flex justify-start items-center gap-6">
                              <div className="flex-1 justify-start text-text-primary text-base">
                                {condition.operator === 'equals' && 'is equal to'}
                                {condition.operator === 'not_equals' && 'not equal to'}
                                {condition.operator === 'greater_than' && 'greater than'}
                                {condition.operator === 'less_than' && 'lower than'}
                                {condition.operator === 'contains' && 'contains'}
                                {condition.operator === 'not_contains' && 'not contains'}
                              </div>
                            </div>
                            <ChevronDown className="w-6 h-6 text-background-surface-5" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Value2 Row */}
                      <div className="self-stretch h-11 flex flex-col justify-start items-start gap-1">
                        <Input
                          value={condition.value2}
                          onChange={(e) => updateCondition(condition.id, 'value2', e.target.value)}
                          placeholder="value2"
                          className="self-stretch min-h-11 px-4 py-2 bg-background-surface-0 rounded-lg outline outline-[1.40px] outline-offset-[-1.40px] outline-border-normal text-base placeholder:text-text-placeholder"
                        />
                      </div>
                    </div>
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => removeCondition(condition.id)}
                      className="w-5 h-5 relative rounded-[5px] overflow-hidden hover:bg-background-surface-4 transition-colors"
                    >
                      <X className="w-2.5 h-2.5 absolute left-[5px] top-[5px] text-text-placeholder" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollAreaSimple>
      </div>
    </div>
  );
}