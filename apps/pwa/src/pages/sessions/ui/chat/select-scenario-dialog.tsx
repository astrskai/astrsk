import { useEffect, useState } from "react";
import { Button } from "@/shared/ui";
import { DialogBase } from "@/shared/ui/dialogs/base";
import { ScrollAreaSimple } from "@/shared/ui/scroll-area-simple";
import SelectableScenarioItem from "./selectable-scenario-item";

interface SelectScenarioDialogProps {
  open: boolean;
  onSkip: () => void;
  onAdd: (scenarioIndex: number) => void;
  renderedScenarios: Array<{ name: string; description: string }> | null;
  onRenderScenarios: () => void;
  sessionId: string;
  scenarioCardId: string;
}

const SelectScenarioDialog = ({
  open,
  onSkip,
  onAdd,
  renderedScenarios,
  onRenderScenarios,
  sessionId,
  scenarioCardId,
}: SelectScenarioDialogProps) => {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState<
    number | null
  >(null);
  const [isAddingScenario, setIsAddingScenario] = useState<boolean>(false);

  // Render first messages on mount and when scenarioCardId changes
  useEffect(() => {
    if (open) {
      onRenderScenarios();
    }
  }, [open, scenarioCardId, onRenderScenarios]);

  // Reset selected index when sessionId or scenarioCardId changes
  useEffect(() => {
    setSelectedScenarioIndex(null);
  }, [sessionId, scenarioCardId]);

  // Handle adding first message
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

  const dialogContent = renderedScenarios ? (
    <ScrollAreaSimple className="flex max-h-[50vh] flex-col items-start justify-start gap-4">
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
          <div className="text-fg-muted justify-start self-stretch text-center text-2xl font-bold">
            No first messages yet
          </div>
          <div className="text-fg-muted justify-start self-stretch text-center text-base leading-normal font-medium">
            Start by adding a first message to your session.
            <br />
            First messages set the opening scene for your session <br />
            — like a narrator kicking things off.
          </div>
        </div>
      )}
    </ScrollAreaSimple>
  ) : null;

  const dialogFooter = (
    <div className="flex items-center justify-end gap-2">
      <Button
        variant="ghost"
        className="flex h-auto min-w-20 items-center justify-center gap-2 rounded-[20px] px-3 py-2.5"
        onClick={onSkip}
      >
        <span className="text-button-background-primary justify-center text-sm leading-tight font-medium">
          Skip
        </span>
      </Button>
      <Button
        variant="accent"
        disabled={selectedScenarioIndex === null || isAddingScenario}
        onClick={handleAddScenario}
        loading={isAddingScenario}
        className="min-w-20 rounded-[20px]"
      >
        Add
      </Button>
    </div>
  );

  return (
    <DialogBase
      open={open}
      onOpenChange={() => {
        // Prevent closing on overlay click or ESC
        // Only onSkip and onAdd can close the dialog
      }}
      title="First message"
      content={dialogContent}
      footer={dialogFooter}
      isShowCloseButton={false}
      size="lg"
    />
  );
};

export default SelectScenarioDialog;
