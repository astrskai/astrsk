import { useState, useEffect } from "react";
import {
  Checkbox, ImportDialog, Label, ScrollArea,
  SvgIcon,
} from "@/shared/ui";
import { ModelItem } from "@/features/flow/ui/model-selection";
import { AgentModelCard } from "@/features/flow/ui/agent-model-card";
import { ModelTier } from "@/entities/agent/domain/agent";

export interface AgentModel {
  agentId: string;
  agentName?: string;
  modelName: string;
  modelTier?: ModelTier;
}

export interface SessionImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (
    file: File,
    includeHistory: boolean,
    agentModelOverrides?: Map<
      string,
      { apiSource: string; modelId: string; modelName: string }
    >,
  ) => Promise<void>;
  onFileSelect?: (file: File) => Promise<AgentModel[] | void>;
  title?: string;
  description?: string;
}

export function SessionImportDialog({
  open,
  onOpenChange,
  onImport,
  onFileSelect,
  title = "Import session",
  description = "Importing a session automatically imports all its related cards and flows.",
}: SessionImportDialogProps) {
  const [importingFile, setImportingFile] = useState<File | null>(null);
  const [agentModels, setAgentModels] = useState<AgentModel[]>([]);
  const [agentModelOverrides, setAgentModelOverrides] = useState<
    Map<string, { apiSource: string; modelId: string; modelName: string }>
  >(new Map());
  const [isIncludeHistory, setIsIncludeHistory] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setImportingFile(null);
      setAgentModels([]);
      setAgentModelOverrides(new Map());
      setIsIncludeHistory(false);
      setIsImporting(false);
    }
  }, [open]);

  const handleFileSelect = async (file: File) => {
    setImportingFile(file);

    // If onFileSelect is provided, use it to get agent models
    if (onFileSelect) {
      const models = await onFileSelect(file);
      if (models) {
        setAgentModels(models);
      }
    }
  };

  const handleImport = async () => {
    if (!importingFile) return;

    setIsImporting(true);
    try {
      await onImport(
        importingFile,
        isIncludeHistory,
        agentModelOverrides.size > 0 ? agentModelOverrides : undefined,
      );
      onOpenChange(false);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <ImportDialog
      open={open}
      onOpenChange={onOpenChange}
      onImport={handleImport}
      title={title}
      description={description}
      accept=".session"
      fileIcon={<SvgIcon name="sessions_solid" size={24} />}
      className="p-2 pt-8"
      contentClassName="px-4 pb-4 flex flex-col justify-start items-start gap-6"
      hideCloseWhenFile={true}
      file={importingFile}
      onFileSelect={handleFileSelect}
      onFileRemove={() => setImportingFile(null)}
      isImporting={isImporting}
    >
      {/* Agent Models Section */}
      {agentModels.length > 0 && (
        <div className="flex max-h-96 flex-col items-start justify-start gap-4 self-stretch overflow-hidden">
          <ScrollArea className="max-h-96 w-full overflow-y-auto">
            <div className="flex flex-col gap-4">
              {agentModels.map((agent) => (
                <AgentModelCard
                  key={agent.agentId}
                  agentName={
                    agent.agentName || `Agent ${agent.agentId.slice(0, 8)}`
                  }
                  originalModel={agent.modelName}
                  recommendedTier={agent.modelTier || ModelTier.Light}
                >
                  <div className="self-stretch">
                    <ModelItem
                      forceMobile={true}
                      connectionChanged={(apiSource, modelId, modelName) => {
                        const newOverrides = new Map(agentModelOverrides);
                        if (modelName) {
                          newOverrides.set(agent.agentId, {
                            apiSource,
                            modelId,
                            modelName,
                          });
                        } else {
                          newOverrides.delete(agent.agentId);
                        }
                        setAgentModelOverrides(newOverrides);
                      }}
                    />
                  </div>
                </AgentModelCard>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Chat History Section - Now at the bottom */}
      <Label className="inline-flex h-6 cursor-pointer items-center justify-start gap-2 self-stretch">
        <Checkbox
          defaultChecked={false}
          checked={isIncludeHistory}
          onCheckedChange={(checked) => {
            setIsIncludeHistory(checked === true);
          }}
          disabled={isImporting}
        />
        <span className="text-text-primary justify-start text-base leading-relaxed font-normal">
          Include chat messages
        </span>
      </Label>
    </ImportDialog>
  );
}
