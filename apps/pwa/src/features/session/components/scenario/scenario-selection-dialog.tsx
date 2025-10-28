import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogClose,
} from "@/shared/ui";
import { ScenarioItem } from "./scenario-item";

export interface Scenario {
  name: string;
  description: string;
}

interface ScenarioSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenarios: Scenario[];
  onSelectScenario: (scenario: Scenario, index: number) => Promise<void>;
  isLoading?: boolean;
}

export const ScenarioSelectionDialog: React.FC<
  ScenarioSelectionDialogProps
> = ({
  open,
  onOpenChange,
  scenarios,
  onSelectScenario,
  isLoading = false,
}) => {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState<
    number | null
  >(null);
  const [isAddingScenario, setIsAddingScenario] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      setSelectedScenarioIndex(null);
    }
  };

  const handleAddScenario = async () => {
    if (selectedScenarioIndex === null) return;

    setIsAddingScenario(true);
    try {
      await onSelectScenario(
        scenarios[selectedScenarioIndex],
        selectedScenarioIndex,
      );
      handleOpenChange(false);
    } finally {
      setIsAddingScenario(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        hideClose
        className="bg-background-surface-2 outline-border-light inline-flex w-80 flex-col items-start justify-start gap-2.5 overflow-hidden rounded-lg p-6 outline-1"
      >
        <div className="flex flex-col items-end justify-start gap-6 self-stretch">
          <div className="flex flex-col items-start justify-start gap-2 self-stretch">
            <DialogTitle className="text-text-primary justify-start self-stretch text-xl font-semibold">
              Scenario
            </DialogTitle>
            <DialogDescription className="text-text-body justify-start self-stretch text-sm leading-tight font-medium">
              Select a scenario for your new session.
            </DialogDescription>
          </div>
          <div className="flex flex-col items-start justify-start gap-4 self-stretch">
            {scenarios.map((scenario, index) => (
              <ScenarioItem
                key={index}
                name={scenario.name}
                contents={scenario.description}
                active={selectedScenarioIndex === index}
                onClick={() => setSelectedScenarioIndex(index)}
              />
            ))}
          </div>
          <div className="inline-flex items-center justify-start gap-2">
            <DialogClose asChild>
              <Button
                variant="ghost"
                className="flex h-auto min-w-20 items-center justify-center gap-2 rounded-[20px] px-3 py-2.5"
              >
                <div className="text-button-background-primary justify-center text-sm leading-tight font-medium">
                  Cancel
                </div>
              </Button>
            </DialogClose>
            <Button
              disabled={
                selectedScenarioIndex === null || isAddingScenario || isLoading
              }
              onClick={handleAddScenario}
              className="bg-button-background-primary inline-flex h-10 min-w-20 flex-col items-center justify-center gap-2.5 rounded-[20px] px-4 py-2.5"
            >
              <div className="inline-flex items-center justify-start gap-2">
                {(isAddingScenario || isLoading) && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                <div className="text-button-foreground-primary justify-center text-sm leading-tight font-semibold">
                  Add
                </div>
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
