import { useState, useEffect } from "react";
import { ImportDialog } from "@/components-v2/import-dialog";
import { ScrollArea } from "@/components-v2/ui/scroll-area";
import { ModelItem } from "@/components-v2/title/create-title/step-prompts";
import { SvgIcon } from "@/components-v2/svg-icon";

export interface AgentModel {
  agentId: string;
  agentName?: string;
  modelName: string;
}

export interface FlowImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File, agentModelOverrides?: Map<string, { apiSource: string; modelId: string; modelName: string }>) => Promise<void>;
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
  const [agentModelOverrides, setAgentModelOverrides] = useState<Map<string, { apiSource: string; modelId: string; modelName: string }>>(new Map());
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
      await onImport(importingFile, agentModelOverrides.size > 0 ? agentModelOverrides : undefined);
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
      maxWidth="max-w-2xl"
      className="p-2 pt-8"
      contentClassName="px-4 pb-4 flex flex-col justify-start items-start gap-6"
      hideCloseWhenFile={true}
      file={importingFile}
      onFileSelect={handleFileSelect}
      onFileRemove={() => setImportingFile(null)}
      isImporting={isImporting}
    >
      {agentModels.length > 0 && (
        <div className="self-stretch max-h-96 flex flex-col justify-start items-start gap-4 overflow-hidden">
          <ScrollArea className="w-full max-h-96">
            <div className="flex flex-col gap-4">
              {agentModels.map((agent) => (
                <div
                  key={agent.agentId}
                  className="self-stretch p-4 bg-background-surface-3 rounded inline-flex flex-col justify-start items-start gap-2"
                >
                  <div className="self-stretch flex flex-col justify-start items-start gap-4">
                    <div className="self-stretch flex flex-col justify-start items-start gap-2">
                      <div className="self-stretch justify-start text-text-subtle text-base font-normal leading-relaxed">
                        Agent : {agent.agentName}
                      </div>
                    </div>
                    <div className="self-stretch flex flex-col justify-start items-start gap-2">
                      <div className="self-stretch flex-1 justify-start text-text-subtle text-base font-normal leading-relaxed">
                        Flow original model
                      </div>
                      <div className="self-stretch flex-1 justify-start text-text-primary text-base font-normal leading-relaxed">
                        {agent.modelName || "No model"}
                      </div>
                    </div>
                    <div className="self-stretch flex flex-col justify-start items-start gap-2">
                      <div className="self-stretch justify-start text-text-subtle text-base font-medium leading-relaxed">
                        Select model to connect
                      </div>
                      <div className="self-stretch">
                        <ModelItem
                          forceMobile={true}
                          connectionChanged={(
                            apiSource,
                            modelId,
                            modelName,
                          ) => {
                            const newOverrides = new Map(
                              agentModelOverrides,
                            );
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </ImportDialog>
  );
}