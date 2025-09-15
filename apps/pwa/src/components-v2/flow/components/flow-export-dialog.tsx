import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components-v2/ui/dialog";
import { Button } from "@/components-v2/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components-v2/ui/radio-group";
import { Label } from "@/components-v2/ui/label";
import { ScrollArea } from "@/components-v2/ui/scroll-area";
import { AgentModelCard } from "@/components-v2/flow/components/agent-model-card";
import { ModelTier } from "@/modules/agent/domain/agent";

export interface AgentModelTierInfo {
  agentId: string;
  agentName: string;
  modelName: string;
  recommendedTier: ModelTier;
  selectedTier: ModelTier;
}

export interface FlowExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (modelTierSelections: Map<string, ModelTier>) => Promise<void>;
  agents: AgentModelTierInfo[];
  title?: string;
  description?: string;
}

export function FlowExportDialog({
  open,
  onOpenChange,
  onExport,
  agents,
  title = "Export flow",
  description = "Choose model tier for each agent. Light models are faster and cheaper, Heavy models are more powerful.",
}: FlowExportDialogProps) {
  const [modelTierSelections, setModelTierSelections] = useState<Map<string, ModelTier>>(new Map());
  const [isExporting, setIsExporting] = useState(false);

  // Initialize selections with recommended tiers or Light by default
  useEffect(() => {
    if (open && agents.length > 0) {
      const initialSelections = new Map<string, ModelTier>();
      agents.forEach(agent => {
        initialSelections.set(agent.agentId, agent.selectedTier || agent.recommendedTier || ModelTier.Light);
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
      await onExport(modelTierSelections);
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
            <p className="text-text-subtle text-base mt-2">{description}</p>
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
                  value={modelTierSelections.get(agent.agentId) || ModelTier.Light}
                  onValueChange={(value) => handleTierChange(agent.agentId, value as ModelTier)}
                  className="self-stretch flex flex-col gap-1.5"
                >
                  <div className="self-stretch inline-flex justify-start items-start gap-3.5">
                    <RadioGroupItem value={ModelTier.Light} id={`${agent.agentId}-light`} className="w-5 h-5 mt-0.5" />
                    <div className="inline-flex flex-col justify-center items-start gap-1.5">
                      <Label htmlFor={`${agent.agentId}-light`} className="justify-start text-text-primary text-base font-medium leading-relaxed cursor-pointer">
                        Light
                      </Label>
                      <div className="justify-start text-text-info text-base font-medium leading-relaxed">
                        Faster, efficient models for basic tasks
                      </div>
                    </div>
                  </div>
                  <div className="self-stretch inline-flex justify-start items-start gap-3.5">
                    <RadioGroupItem value={ModelTier.Heavy} id={`${agent.agentId}-heavy`} className="w-5 h-5 mt-0.5" />
                    <div className="inline-flex flex-col justify-center items-start gap-1.5">
                      <Label htmlFor={`${agent.agentId}-heavy`} className="justify-start text-text-primary text-base font-medium leading-relaxed cursor-pointer">
                        Heavy
                      </Label>
                      <div className="justify-start text-text-info text-base font-medium leading-relaxed">
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

        <DialogFooter>
          <Button variant="ghost" size="lg" onClick={() => onOpenChange(false)} disabled={isExporting}>
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