import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  ImportDialog,
  Loading,
  SvgIcon,
} from "@/shared/ui";
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
  // Commented out - no longer needed since we import as-is
  // onFileSelect?: (file: File) => Promise<AgentModel[] | void>;
  file?: File | null;
  // Commented out - no longer showing model selection
  // agentModels?: AgentModel[];
  title?: string;
  description?: string;
}

export function SessionImportDialog({
  open,
  onOpenChange,
  onImport,
  file: externalFile,
  title = "Import session",
  description = "Importing a session automatically imports all its related cards and flows.",
}: SessionImportDialogProps) {
  const [importingFile, setImportingFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Initialize with external file if provided and auto-import
  useEffect(() => {
    if (open && externalFile && !isImporting) {
      setImportingFile(externalFile);
      // Auto-import when file is provided
      handleImportFile(externalFile);
    }
  }, [open, externalFile]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setImportingFile(null);
      setIsImporting(false);
    }
  }, [open]);

  const handleImportFile = async (file: File) => {
    setIsImporting(true);
    try {
      // Import as-is without model overrides or history selection
      await onImport(file, false, undefined);
      onOpenChange(false);
    } catch {
      // Error handled by onImport, just close
      onOpenChange(false);
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileSelect = async (file: File | null) => {
    if (!file) return;
    setImportingFile(file);
    // Auto-import when file is selected
    await handleImportFile(file);
  };

  // If importing, show loading dialog
  if (isImporting) {
    return (
      <Dialog open={open} onOpenChange={undefined}>
        <DialogContent className="max-w-sm">
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <Loading />
            <p className="text-fg-muted text-base">Importing session...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Otherwise show file picker dialog
  return (
    <ImportDialog
      open={open}
      onOpenChange={onOpenChange}
      onImport={() => importingFile && handleImportFile(importingFile)}
      title={title}
      description={description}
      accept=".session"
      fileIcon={<SvgIcon name="sessions_solid" size={24} />}
      hideCloseWhenFile={false}
      file={importingFile}
      onFileSelect={handleFileSelect}
      onFileRemove={() => setImportingFile(null)}
      isImporting={isImporting}
    />
  );
}
