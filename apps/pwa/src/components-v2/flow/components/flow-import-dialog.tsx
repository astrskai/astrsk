import { useState, useEffect } from "react";
import { ImportDialog } from "@/components-v2/import-dialog";
import { ScrollArea } from "@/components-v2/ui/scroll-area";
import { ModelItem } from "@/components-v2/title/create-title/step-prompts";
import { AgentModelCard } from "@/components-v2/flow/components/agent-model-card";
import { SvgIcon } from "@/components-v2/svg-icon";
import { ModelTier } from "@/modules/agent/domain/agent";

export interface AgentModel {
  agentId: string;
  agentName?: string;
  modelName: string;
  modelTier?: ModelTier;
}

export interface FlowImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (
    file: File,
    agentModelOverrides?: Map<
      string,
      { apiSource: string; modelId: string; modelName: string }
    >,
  ) => Promise<void>;
  onFileSelect?: (file: File) => Promise<AgentModel[] | void>;
  title?: string;
  description?: string;
}

export function FlowImportDialog({
  open,
  onOpenChange,
  onImport,
  onFileSelect,
  title = "Import flow",
  description = "",
}: FlowImportDialogProps) {
  const [importingFile, setImportingFile] = useState<File | null>(null);
  const [agentModels, setAgentModels] = useState<AgentModel[]>([]);
  const [agentModelOverrides, setAgentModelOverrides] = useState<
    Map<string, { apiSource: string; modelId: string; modelName: string }>
  >(new Map());
  const [isImporting, setIsImporting] = useState(false);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setImportingFile(null);
      setAgentModels([]);
      setAgentModelOverrides(new Map());
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
      accept=".json"
      fileIcon={<SvgIcon name="agents_solid" size={24} />}
      className="p-2 pt-8"
      contentClassName="px-4 pb-4 flex flex-col justify-start items-start gap-6"
      hideCloseWhenFile={true}
      file={importingFile}
      onFileSelect={handleFileSelect}
      onFileRemove={() => setImportingFile(null)}
      isImporting={isImporting}
    >
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
    </ImportDialog>
  );
}
