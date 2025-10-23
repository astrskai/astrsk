import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogClose,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
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

export const ScenarioSelectionDialog: React.FC<ScenarioSelectionDialogProps> = ({
  open,
  onOpenChange,
  scenarios,
  onSelectScenario,
  isLoading = false,
}) => {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState<number | null>(null);
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
      await onSelectScenario(scenarios[selectedScenarioIndex], selectedScenarioIndex);
      handleOpenChange(false);
    } finally {
      setIsAddingScenario(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        hideClose
        className="w-80 p-6 bg-background-surface-2 rounded-lg outline-1 outline-border-light inline-flex flex-col justify-start items-start gap-2.5 overflow-hidden"
      >
        <div className="self-stretch flex flex-col justify-start items-end gap-6">
          <div className="self-stretch flex flex-col justify-start items-start gap-2">
            <DialogTitle className="self-stretch justify-start text-text-primary text-xl font-semibold">
              Scenario
            </DialogTitle>
            <DialogDescription className="self-stretch justify-start text-text-body text-sm font-medium leading-tight">
              Select a scenario for your new session.
            </DialogDescription>
          </div>
          <div className="self-stretch flex flex-col justify-start items-start gap-4">
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
          <div className="inline-flex justify-start items-center gap-2">
            <DialogClose asChild>
              <Button
                variant="ghost"
                className="min-w-20 px-3 py-2.5 rounded-[20px] flex justify-center items-center gap-2 h-auto"
              >
                <div className="justify-center text-button-background-primary text-sm font-medium leading-tight">
                  Cancel
                </div>
              </Button>
            </DialogClose>
            <Button
              disabled={
                selectedScenarioIndex === null || isAddingScenario || isLoading
              }
              onClick={handleAddScenario}
              className="h-10 min-w-20 px-4 py-2.5 bg-button-background-primary rounded-[20px] inline-flex flex-col justify-center items-center gap-2.5"
            >
              <div className="inline-flex justify-start items-center gap-2">
                {(isAddingScenario || isLoading) && (
                  <Loader2 className="animate-spin h-4 w-4" />
                )}
                <div className="justify-center text-button-foreground-primary text-sm font-semibold leading-tight">
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