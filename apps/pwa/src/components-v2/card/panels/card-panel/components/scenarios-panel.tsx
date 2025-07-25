import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import { Editor } from "@/components-v2/editor";
import { Trash2, Plus, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components-v2/ui/tooltip";

import { PlotCard } from "@/modules/card/domain";
import { Input } from "@/components-v2/ui/input";
import { Button } from "@/components-v2/ui/button";
import { ScrollAreaSimple } from "@/components-v2/ui/scroll-area-simple";
import { debounce } from "lodash-es";
import { registerCardMonacoEditor } from "./variables-panel";

// Import the sortable component
import { SortableItem } from "@/components-v2/card/panels/card-panel/components/sortable-item";

// Import our abstraction
import { 
  useCardPanel, 
  CardPanelProps, 
  CardPanelLoading, 
  CardPanelError, 
  CardPanelEmpty 
} from "@/components-v2/card/panels/hooks/use-card-panel";

interface ScenariosPanelProps extends CardPanelProps {}

interface Scenario {
  id: string;
  name: string;
  description: string;
}

export function ScenariosPanel({ cardId }: ScenariosPanelProps) {
  // 1. Use our custom hook for card panel functionality
  const { card, isLoading, lastInitializedCardId, saveCard } = useCardPanel<PlotCard>({
    cardId,
  });
  
  // 2. UI state (expansion, errors, etc.)
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  // 3. Local form state (for immediate UI feedback)
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  
  // 4. Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // 5. SINGLE initialization useEffect (right after state)
  useEffect(() => {
    if (cardId !== lastInitializedCardId.current && card && card instanceof PlotCard) {
      const scenarioList = card.props.scenarios?.map((scenario, index) => ({
        id: `scenario-${index}`,
        name: scenario.name || "",
        description: scenario.description || "",
      })) || [];
      setScenarios(scenarioList);
      if (scenarioList.length > 0 && !selectedScenarioId) {
        setSelectedScenarioId(scenarioList[0].id);
      }
      lastInitializedCardId.current = cardId;
    }
  }, [cardId, card]); // Only depend on cardId and card, not selectedScenarioId

  // Focus on name input when selected scenario changes
  useEffect(() => {
    if (selectedScenarioId && nameInputRef.current) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
      }, 50);
    }
  }, [selectedScenarioId]);


  // 6. Debounced save with parameters (NOT closures!)
  const debouncedSave = useMemo(
    () => debounce((newScenarios: Scenario[]) => {
      if (!card) return;

      // Check for actual changes inline
      const currentScenarios = card.props.scenarios || [];
      
      // Check if scenarios count differs
      if (newScenarios.length !== currentScenarios.length) {
        const scenariosData = newScenarios.map((scenario) => ({
          name: scenario.name,
          description: scenario.description,
        }));
        const updateResult = card.update({ scenarios: scenariosData });
        if (updateResult.isSuccess) {
          saveCard(card);
        }
        return;
      }
      
      // Check if scenario content differs
      const hasChanges = newScenarios.some((scenario, index) => {
        const currentScenario = currentScenarios[index];
        if (!currentScenario) return true;
        return (
          scenario.name !== (currentScenario.name || "") ||
          scenario.description !== (currentScenario.description || "")
        );
      });

      if (hasChanges) {
        const scenariosData = newScenarios.map((scenario) => ({
          name: scenario.name,
          description: scenario.description,
        }));
        const updateResult = card.update({ scenarios: scenariosData });
        if (updateResult.isSuccess) {
          saveCard(card);
        }
      }
    }, 300),
    [card, saveCard]
  );

  // Common Monaco editor mount handler
  const handleEditorMount = useCallback((editor: any) => {
    // Register editor for variable insertion
    const position = editor.getPosition();
    registerCardMonacoEditor(editor, position);

    // Track cursor changes
    editor.onDidChangeCursorPosition((e: any) => {
      registerCardMonacoEditor(editor, e.position);
    });

    // Track focus
    editor.onDidFocusEditorWidget(() => {
      const position = editor.getPosition();
      registerCardMonacoEditor(editor, position);
    });

    // Focus the editor when mounted (only for expanded views)
    if (editor.getDomNode()?.closest('.absolute.inset-0')) {
      editor.focus();
    }
  }, []);

  const selectedScenario = scenarios.find((s) => s.id === selectedScenarioId);

  // 8. Change handlers that pass current values
  const handleAddScenario = useCallback(() => {
    const newScenario: Scenario = {
      id: `scenario-${Date.now()}`,
      name: `Scenario ${scenarios.length + 1}`,
      description: "",
    };
    const newScenarios = [...scenarios, newScenario];
    setScenarios(newScenarios);
    setSelectedScenarioId(newScenario.id);
    debouncedSave(newScenarios);
  }, [scenarios, debouncedSave]);

  const handleDeleteScenario = useCallback(
    (scenarioId: string) => {
      const newScenarios = scenarios.filter((s) => s.id !== scenarioId);
      setScenarios(newScenarios);
      if (selectedScenarioId === scenarioId) {
        setSelectedScenarioId(newScenarios.length > 0 ? newScenarios[0].id : null);
      }
      debouncedSave(newScenarios);
    },
    [scenarios, selectedScenarioId, debouncedSave],
  );

  const handleUpdateScenario = useCallback(
    (scenarioId: string, updates: Partial<Scenario>) => {
      const newScenarios = scenarios.map((scenario) =>
        scenario.id === scenarioId ? { ...scenario, ...updates } : scenario,
      );
      setScenarios(newScenarios);
      debouncedSave(newScenarios);
    },
    [scenarios, debouncedSave],
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = scenarios.findIndex(
        (scenario) => scenario.id === active.id,
      );
      const newIndex = scenarios.findIndex(
        (scenario) => scenario.id === over.id,
      );
      const newScenarios = arrayMove(scenarios, oldIndex, newIndex);
      setScenarios(newScenarios);
      debouncedSave(newScenarios);
    }
  }, [scenarios, debouncedSave]);

  // 9. Early returns
  if (isLoading) {
    return <CardPanelLoading message="Loading scenarios..." />;
  }

  if (!card) {
    return <CardPanelError message="Scenarios are only available for plot cards" />;
  }

  // 10. Render
  return (
    <TooltipProvider>
      <div
        ref={containerRef}
        className="h-full flex flex-col bg-background-surface-2 relative"
      >

        <div className="flex-1 overflow-hidden p-2">
          {!selectedScenario && scenarios.length === 0 ? (
            <CardPanelEmpty
              title="No scenario"
              description="Scenarios set the opening scene for your session"
              action={
                <Button
                  onClick={handleAddScenario}
                  variant="secondary"
                  size="sm"
                >
                  <Plus className="min-w-4 min-h-4" />
                  Create new scenario
                </Button>
              }
            />
          ) : (
            <div className="flex gap-2 h-full min-w-0">
              {/* Left panel - Scenario list */}
              <div className="flex flex-col gap-2 flex-1 min-w-[146px] max-w-[256px] overflow-hidden">
                <div className="self-stretch pl-7 pr-2 inline-flex justify-start items-center gap-2 overflow-hidden">
                  <button
                    onClick={handleAddScenario}
                    className="flex-1 h-7 px-3 py-2 bg-background-surface-4 rounded-full shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline-1 outline-offset-[-1px] outline-border-light flex justify-center items-center gap-2 hover:bg-background-surface-3 transition-colors overflow-hidden"
                  >
                    <Plus className="w-4 h-4 text-text-body flex-shrink-0" />
                    <div className="justify-center text-text-primary text-xs font-semibold leading-none truncate">
                      Scenario
                    </div>
                  </button>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <HelpCircle className="max-w-[16px] max-h-[16px] text-text-info cursor-help flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>
                        The scenarios in this list are <br/>available for selection as<br/> session opening messages.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {scenarios.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-text-subtle text-xs">
                      No scenarios yet. Click "Scenario" to add your first
                      scenario.
                    </div>
                  </div>
                ) : (
                  <ScrollAreaSimple className="flex-1">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                      modifiers={[
                        restrictToVerticalAxis,
                        restrictToParentElement,
                      ]}
                    >
                      <SortableContext
                        items={scenarios.map((scenario) => scenario.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="flex flex-col gap-2 pr-2">
                          {scenarios.map((scenario) => (
                            <SortableItem
                              key={scenario.id}
                              item={scenario}
                              isSelected={scenario.id === selectedScenarioId}
                              onClick={() => setSelectedScenarioId(scenario.id)}
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

              {/* Right panel - Scenario details */}
              <div className="flex-1 min-w-0 overflow-hidden">
                {selectedScenario ? (
                  <div className="w-full h-full flex flex-col justify-start items-start gap-4 min-w-0 relative p-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleDeleteScenario(selectedScenario.id)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-sm hover:opacity-80 transition-opacity z-10"
                        >
                          <Trash2 className="min-w-3.5 min-h-4 text-text-subtle" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" variant="button">
                        <p>Delete</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* Scenario name field */}
                    <div className="self-stretch flex flex-col justify-start items-start gap-2 mt-8">
                      <div className="self-stretch inline-flex justify-start items-center gap-2">
                        <div className="justify-start text-text-body text-[10px] font-medium leading-none">
                          Scenario name
                        </div>
                      </div>
                      <div className="self-stretch flex flex-col justify-start items-start gap-1">
                        <Input
                          ref={nameInputRef}
                          value={selectedScenario.name}
                          onChange={(e) =>
                            handleUpdateScenario(selectedScenario.id, {
                              name: e.target.value,
                            })
                          }
                          className="self-stretch h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal text-text-primary text-xs font-normal"
                          placeholder=""
                        />
                      </div>
                    </div>

                    {/* Description field */}
                    <div className="self-stretch flex-1 flex flex-col justify-start items-start gap-2 min-w-0 overflow-hidden">
                      <div className="self-stretch justify-start text-text-body text-[10px] font-medium leading-none">
                        Description
                      </div>
                      <div className="self-stretch flex-1 flex flex-col justify-start items-start gap-1 min-w-0 overflow-hidden">
                        <div className="self-stretch flex-1 min-w-0">
                          <Editor
                            value={selectedScenario.description}
                            onChange={(value) =>
                              handleUpdateScenario(selectedScenario.id, {
                                description: value || "",
                              })
                            }
                            language="markdown"
                            expandable={true}
                            isExpanded={isDescriptionExpanded}
                            onExpandToggle={setIsDescriptionExpanded}
                            onMount={handleEditorMount}
                            containerClassName="h-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-text-subtle text-xs">
                      Select a scenario to edit its details
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Expanded Editor View */}
        {isDescriptionExpanded && selectedScenario && (
          <div className="absolute inset-0 z-20 bg-background-surface-2 p-4">
            <div className="w-full h-full">
              <Editor
                value={selectedScenario.description}
                onChange={(value) =>
                  handleUpdateScenario(selectedScenario.id, {
                    description: value || "",
                  })
                }
                language="markdown"
                expandable={true}
                isExpanded={isDescriptionExpanded}
                onExpandToggle={setIsDescriptionExpanded}
                onMount={handleEditorMount}
                containerClassName="h-full"
              />
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}