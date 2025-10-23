import { useState, useEffect } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Checkbox,
  Label,
  RadioGroup,
  RadioGroupItem,
  ScrollArea,
} from "@/shared/ui";
import { AgentModelCard } from "@/features/flow/components/agent-model-card";
import { ModelTier } from "@/entities/agent/domain/agent";

export interface AgentModelTierInfo {
  agentId: string;
  agentName: string;
  modelName: string;
  recommendedTier: ModelTier;
  selectedTier: ModelTier;
}

export interface SessionExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (
    modelTierSelections: Map<string, ModelTier>,
    includeHistory: boolean,
  ) => Promise<void>;
  agents: AgentModelTierInfo[];
  title?: string;
  description?: string;
}

export function SessionExportDialog({
  open,
  onOpenChange,
  onExport,
  agents,
  title = "Export session",
  description,
}: SessionExportDialogProps) {
  const [modelTierSelections, setModelTierSelections] = useState<
    Map<string, ModelTier>
  >(new Map());
  const [includeHistory, setIncludeHistory] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Initialize selections with recommended tiers or Light by default
  useEffect(() => {
    if (open && agents.length > 0) {
      const initialSelections = new Map<string, ModelTier>();
      agents.forEach((agent) => {
        initialSelections.set(
          agent.agentId,
          agent.selectedTier || agent.recommendedTier || ModelTier.Light,
        );
      });
      setModelTierSelections(initialSelections);
    }
  }, [open, agents]);

  const handleTierChange = (agentId: string, tier: ModelTier) => {
    const newSelections = new Map(modelTierSelections);
    newSelections.set(agentId, tier);
    setModelTierSelections(newSelections);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(modelTierSelections, includeHistory);
      onOpenChange(false);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">{title}</DialogTitle>
          {description && (
            <p className="text-text-subtle mt-2 text-base">{description}</p>
          )}
        </DialogHeader>

        {agents.length > 0 && (
          <ScrollArea className="max-h-96 w-full overflow-y-auto">
            <div className="flex flex-col gap-4">
              {agents.map((agent) => (
                <AgentModelCard
                  key={agent.agentId}
                  agentName={agent.agentName}
                  originalModel={agent.modelName}
                  isExportMode={true}
                >
                  <RadioGroup
                    value={
                      modelTierSelections.get(agent.agentId) || ModelTier.Light
                    }
                    onValueChange={(value) =>
                      handleTierChange(agent.agentId, value as ModelTier)
                    }
                    className="flex flex-col gap-1.5 self-stretch"
                  >
                    <div className="inline-flex items-start justify-start gap-3.5 self-stretch">
                      <RadioGroupItem
                        value={ModelTier.Light}
                        id={`${agent.agentId}-light`}
                        className="mt-0.5 h-5 w-5"
                      />
                      <div className="inline-flex flex-col items-start justify-center gap-1.5">
                        <Label
                          htmlFor={`${agent.agentId}-light`}
                          className="text-text-primary cursor-pointer justify-start text-base leading-relaxed font-medium"
                        >
                          Light
                        </Label>
                        <div className="text-text-info justify-start text-base leading-relaxed font-medium">
                          Faster, efficient models for basic tasks
                        </div>
                      </div>
                    </div>
                    <div className="inline-flex items-start justify-start gap-3.5 self-stretch">
                      <RadioGroupItem
                        value={ModelTier.Heavy}
                        id={`${agent.agentId}-heavy`}
                        className="mt-0.5 h-5 w-5"
                      />
                      <div className="inline-flex flex-col items-start justify-center gap-1.5">
                        <Label
                          htmlFor={`${agent.agentId}-heavy`}
                          className="text-text-primary cursor-pointer justify-start text-base leading-relaxed font-medium"
                        >
                          Heavy
                        </Label>
                        <div className="text-text-info justify-start text-base leading-relaxed font-medium">
                          Advanced models with higher capabilities
                        </div>
                      </div>
                    </div>
                  </RadioGroup>
                </AgentModelCard>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Include History Checkbox */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="include-history"
            checked={includeHistory}
            onCheckedChange={(checked) => {
              if (typeof checked === "boolean") {
                setIncludeHistory(checked);
              }
            }}
          />
          <Label
            htmlFor="include-history"
            className="text-text-primary cursor-pointer text-base leading-relaxed font-normal"
          >
            Include chat messages
          </Label>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button size="lg" onClick={handleExport} disabled={isExporting}>
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
