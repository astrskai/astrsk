import { useEffect, useState } from "react";
import { Button } from "@/shared/ui";
import { ScrollAreaSimple } from "@/shared/ui/scroll-area-simple";
import SelectableScenarioItem from "./selectable-scenario-item";
import { Loader2 } from "lucide-react";

interface SelectScenarioDialogProps {
  onSkip: () => void;
  onAdd: (scenarioIndex: number) => void;
  renderedScenarios: Array<{ name: string; description: string }> | null;
  onRenderScenarios: () => void;
  sessionId: string;
  plotCardId: string;
}

const SelectScenarioDialog = ({
  onSkip,
  onAdd,
  renderedScenarios,
  onRenderScenarios,
  sessionId,
  plotCardId,
}: SelectScenarioDialogProps) => {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState<
    number | null
  >(null);
  const [isAddingScenario, setIsAddingScenario] = useState<boolean>(false);

  // Render scenarios on mount and when plotCardId changes
  useEffect(() => {
    onRenderScenarios();
  }, [plotCardId, onRenderScenarios]);

  // Reset selected index when sessionId or plotCardId changes
  useEffect(() => {
    setSelectedScenarioIndex(null);
  }, [sessionId, plotCardId]);

  // Handle adding scenario
  const handleAddScenario = async () => {
    if (selectedScenarioIndex !== null) {
      setIsAddingScenario(true);
      try {
        await onAdd(selectedScenarioIndex);
      } finally {
        setIsAddingScenario(false);
      }
    }
  };

  // Always show scenario selection view directly
  if (renderedScenarios) {
    // Scenario selection view
    return (
      <div className="bg-background-surface-2 outline-border-light mx-auto inline-flex w-full max-w-[600px] flex-col items-start justify-start gap-2.5 overflow-hidden rounded-lg p-6 outline-1">
        <div className="flex flex-col items-end justify-start gap-6 self-stretch">
          <div className="flex flex-col items-start justify-start gap-2 self-stretch">
            <div className="text-text-primary justify-start self-stretch text-2xl font-semibold">
              First message
            </div>
            <div className="text-text-body justify-start self-stretch text-base leading-tight font-medium">
              Select a first message for your new session.
            </div>
          </div>
          <div className="relative self-stretch">
            <ScrollAreaSimple className="flex max-h-[600px] flex-col items-start justify-start gap-4">
              {renderedScenarios.length > 0 ? (
                renderedScenarios.map((scenario, index) => (
                  <SelectableScenarioItem
                    key={index}
                    name={scenario.name}
                    contents={scenario.description}
                    active={selectedScenarioIndex === index}
                    onClick={() => {
                      setSelectedScenarioIndex(index);
                    }}
                  />
                ))
              ) : (
                <div className="inline-flex w-full flex-col items-start justify-start gap-4 self-stretch py-6">
                  <div className="text-text-body justify-start self-stretch text-center text-2xl font-bold">
                    No scenarios yet
                  </div>
                  <div className="text-background-surface-5 justify-start self-stretch text-center text-base leading-normal font-medium">
                    Start by adding a scenario to your plot card.
                    <br />
                    Scenarios set the opening scene for your session <br />—
                    like a narrator kicking things off.
                  </div>
                </div>
              )}
            </ScrollAreaSimple>
          </div>
          <div className="inline-flex items-center justify-start gap-2">
            <Button
              variant="ghost"
              className="flex h-auto min-w-20 items-center justify-center gap-2 rounded-[20px] px-3 py-2.5"
              onClick={onSkip}
            >
              <div className="text-button-background-primary justify-center text-sm leading-tight font-medium">
                Skip
              </div>
            </Button>
            <Button
              disabled={selectedScenarioIndex === null || isAddingScenario}
              onClick={handleAddScenario}
              className="bg-button-background-primary inline-flex h-10 min-w-20 flex-col items-center justify-center gap-2.5 rounded-[20px] px-4 py-2.5"
            >
              <div className="inline-flex items-center justify-start gap-2">
                {isAddingScenario && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                <div className="text-button-foreground-primary justify-center text-sm leading-tight font-semibold">
                  Add
                </div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state while scenarios are being rendered
  return null;
};

export default SelectScenarioDialog;
